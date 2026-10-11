"""FastAPI backend to serve ML models and metrics."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import time
from pathlib import Path

from src.monitoring import predict_risk
from src.data_loader import FEATURE_NAMES, load_dataset, normalise_columns

DATA_PATH = Path("data/fetal_health.csv")

app = FastAPI(title="Fetal Health API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ARTIFACT_PATH = Path("artifacts/ctg_models.joblib")
EVALUATION_PATH = Path("artifacts/evaluation.joblib")

class PatientFeatures(BaseModel):
    baseline_value: float
    accelerations: float
    fetal_movement: float
    uterine_contractions: float
    light_decelerations: float
    severe_decelerations: float
    prolonged_decelerations: float
    abnormal_short_term_variability: float
    mean_value_of_short_term_variability: float
    percentage_of_time_with_abnormal_long_term_variability: float
    mean_value_of_long_term_variability: float
    histogram_width: float
    histogram_min: float
    histogram_max: float
    histogram_number_of_peaks: float
    histogram_number_of_zeroes: float
    histogram_mode: float
    histogram_mean: float
    histogram_median: float
    histogram_variance: float
    histogram_tendency: float

# Global state for streaming simulation
stream_index = 0
raw_dataset = None

@app.on_event("startup")
def load_models():
    global artifacts, model, evaluation, raw_dataset
    if not ARTIFACT_PATH.exists():
        raise RuntimeError("Artifacts missing. Please train models first.")
    
    artifacts = joblib.load(ARTIFACT_PATH)
    model = artifacts["models"]["Random Forest"]
    
    if EVALUATION_PATH.exists():
        evaluation = joblib.load(EVALUATION_PATH)
    else:
        evaluation = {}
        
    try:
        raw_dataset = load_dataset()
        raw_dataset = normalise_columns(raw_dataset)
    except Exception as e:
        print(f"Warning: Could not load dataset for streaming - {e}")
        raw_dataset = pd.DataFrame(columns=FEATURE_NAMES)

@app.get("/api/metrics")
def get_metrics():
    if not evaluation:
        return {"error": "Metrics not available."}
    
    metrics_df = evaluation["metrics"].reset_index()
    # Replace NaN with None for JSON serialization
    metrics_df = metrics_df.where(pd.notnull(metrics_df), None)
    return {"metrics": metrics_df.to_dict(orient="records")}

@app.post("/api/predict")
def predict(features: PatientFeatures):
    data_dict = features.dict()
    df = pd.DataFrame([data_dict])[FEATURE_NAMES]
    scaled_df = pd.DataFrame(artifacts["scaler"].transform(df), columns=FEATURE_NAMES)
    
    event = predict_risk(model, scaled_df)
    
    return {
        "predicted_class": event.predicted_class,
        "confidence": event.confidence,
        "risk_score": event.risk_score,
        "distress_probability": event.distress_probability,
        "alert": event.alert,
        "probabilities": event.probabilities,
        "timestamp": time.time()
    }

@app.get("/api/next-record")
def get_next_record():
    """Simulates a continuous data stream by yielding the next row in the dataset."""
    global stream_index, raw_dataset
    if raw_dataset is None or raw_dataset.empty:
        raise HTTPException(status_code=400, detail="Dataset not loaded")
        
    # Get row
    row = raw_dataset.iloc[stream_index]
    # Increment counter and wrap around
    stream_index = (stream_index + 1) % len(raw_dataset)
    
    features = row[FEATURE_NAMES].to_dict()
    df = pd.DataFrame([features])[FEATURE_NAMES]
    scaled_df = pd.DataFrame(artifacts["scaler"].transform(df), columns=FEATURE_NAMES)
    
    event = predict_risk(model, scaled_df)
    
    return {
        "features": features,
        "prediction": {
            "predicted_class": event.predicted_class,
            "confidence": event.confidence,
            "risk_score": event.risk_score,
            "distress_probability": event.distress_probability,
            "alert": event.alert,
            "probabilities": event.probabilities,
            "timestamp": time.time(),
            "time_string": time.strftime("%H:%M:%S")
        }
    }

@app.get("/api/feature-importance")
def get_feature_importance():
    if not hasattr(model, "feature_importances_"):
        return {"error": "Model does not support feature importances natively."}
    
    importances = model.feature_importances_
    # Create a list of dicts sorting by value
    data = [{"name": name, "value": float(imp), "fill": "#f43f5e" if "abnormal" in name or "prolonged" in name or "variance" in name else "#14b8a6"} 
            for name, imp in zip(FEATURE_NAMES, importances)]
    data = sorted(data, key=lambda x: x["value"], reverse=True)[:10] # Top 10
    
    return {"importance": data}

@app.get("/api/dataset")
def get_dataset():
    """Return top 100 rows of the dataset for the Dataset Explorer"""
    try:
        df = normalise_columns(pd.read_csv(DATA_PATH))
        return {"data": df.head(100).to_dict(orient="records")}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/explain-local")
def explain_local(payload: dict):
    try:
        from lime.lime_tabular import LimeTabularExplainer
        import shap
        
        # Prepare the input row
        row_df = pd.DataFrame([payload])
        row_df = row_df[FEATURE_NAMES]
        
        # LIME Explanation
        # We need the training data to initialize the LIME explainer. We load the raw dataset.
        df_train = normalise_columns(pd.read_csv(DATA_PATH))[FEATURE_NAMES].values
        lime_explainer = LimeTabularExplainer(
            training_data=df_train,
            feature_names=FEATURE_NAMES,
            class_names=["Normal", "Suspect", "Pathological"],
            mode="classification"
        )
        
        # For Random Forest in this pipeline, we pass row_df directly to model.predict_proba
        exp = lime_explainer.explain_instance(
            data_row=row_df.values[0],
            predict_fn=model.predict_proba,
            num_features=5
        )
        
        lime_list = exp.as_list()
        lime_results = [{"feature": f, "weight": float(w)} for f, w in lime_list]
        
        return {"lime": lime_results}
    except Exception as e:
        print("Explain Error:", str(e))
        return {"error": str(e)}
