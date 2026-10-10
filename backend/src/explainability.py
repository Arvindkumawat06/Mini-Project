"""SHAP and LIME Explainable AI integration."""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import shap
from lime.lime_tabular import LimeTabularExplainer

def _predict_fn(model, scaler, feature_names):
    def predict(values):
        frame = pd.DataFrame(values, columns=feature_names)
        return model.predict_proba(scaler.transform(frame))
    return predict

def _get_shap_explainer(model, X):
    estimator = model
    if hasattr(model, "named_steps"):
        estimator = model.named_steps.get("classifier", model)
    if hasattr(estimator, "estimators_"):
        estimator = next((m for m in estimator.estimators_ if hasattr(m, "feature_importances_")), estimator)
    return shap.Explainer(estimator, X)

def shap_global_summary(model, X, feature_names, output_dir="outputs/figures"):
    """Create a SHAP beeswarm summary plot and return mean absolute importance."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    explainer = _get_shap_explainer(model, X)
    values = explainer(X)
    
    raw = values.values
    if raw.ndim == 3:
        importance = np.abs(raw).mean(axis=(0, 2))
    else:
        importance = np.abs(raw).mean(axis=0)
        
    result = pd.DataFrame({"feature": feature_names, "mean_abs_shap": importance}).sort_values("mean_abs_shap", ascending=False)
    
    plt.figure()
    shap.summary_plot(values, X, show=False, max_display=len(feature_names))
    plt.tight_layout()
    plt.savefig(Path(output_dir) / "shap_summary.png", dpi=180, bbox_inches="tight")
    plt.close()
    return result

def shap_local_explanation(model, X_train, row, feature_names, output_dir="outputs/figures"):
    """Generate SHAP waterfall plot for an individual prediction."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    explainer = _get_shap_explainer(model, X_train)
    values = explainer(row)
    
    plt.figure()
    # Assuming multiclass (Normal, Suspect, Pathological) - explain the predicted class
    predicted_class = np.argmax(model.predict_proba(row))
    if values.values.ndim == 3:
        # Multiclass SHAP values
        shap.waterfall_plot(values[0, :, predicted_class], show=False)
    else:
        shap.waterfall_plot(values[0], show=False)
        
    plt.tight_layout()
    output_path = Path(output_dir) / "shap_local.png"
    plt.savefig(output_path, dpi=180, bbox_inches="tight")
    plt.close()
    return output_path

def lime_explanation(model, scaler, row, feature_names, background_data, output_path="outputs/figures/lime_local.html"):
    """Generate a local LIME explanation for one unscaled clinical record."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    training_data = background_data[feature_names].to_numpy(dtype=float) if background_data is not None else np.zeros((2, len(feature_names)))
    
    explainer = LimeTabularExplainer(
        training_data=training_data,
        feature_names=feature_names, 
        class_names=["Normal", "Suspect", "Pathological"],
        mode="classification", discretize_continuous=True, random_state=42,
    )
    
    explanation = explainer.explain_instance(
        row.iloc[0].to_numpy(dtype=float), _predict_fn(model, scaler, feature_names),
        num_features=min(10, len(feature_names)), top_labels=3,
    )
    
    explanation.save_to_file(str(output_path))
    return explanation
