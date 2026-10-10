"""Streamlit clinical decision-support dashboard for CTG fetal health."""

from __future__ import annotations

from pathlib import Path
import time

import joblib
import numpy as np
import pandas as pd
import streamlit as st

from explainability import lime_explanation, shap_summary
from monitoring import predict_risk
from preprocess import FEATURE_NAMES, load_dataset, prepare_data

ARTIFACT = Path("artifacts/ctg_models.joblib")


@st.cache_resource
def load_artifacts() -> dict:
    if not ARTIFACT.exists():
        st.error("No trained artifacts found. Run `python train.py` first.")
        st.stop()
    return joblib.load(ARTIFACT)


@st.cache_data
def load_raw() -> pd.DataFrame:
    return load_dataset()


def main() -> None:
    st.set_page_config(page_title="CTG Fetal Risk", layout="wide")
    st.title("CTG Fetal Health Classification & Continuous Risk")
    artifacts = load_artifacts()
    models = artifacts["models"]
    model = models["Stacking Ensemble"]
    prepared = prepare_data()
    tabs = st.tabs(["Single Patient Risk Assessment", "Real-Time CTG Stream", "Model Performance & Paper Metrics"])

    with tabs[0]:
        st.subheader("Patient features")
        values = {}
        columns = st.columns(3)
        for index, feature in enumerate(FEATURE_NAMES):
            values[feature] = columns[index % 3].number_input(feature.replace("_", " ").title(), value=0.0, format="%.4f")
        if st.button("Assess fetal risk", type="primary"):
            raw = pd.DataFrame([values])
            scaled = pd.DataFrame(artifacts["scaler"].transform(raw), columns=FEATURE_NAMES)
            event = predict_risk(model, scaled)
            labels = {1: "Normal", 2: "Suspect", 3: "Pathological"}
            st.metric("Prediction", labels[event.predicted_class])
            st.metric("Confidence", f"{event.confidence:.1%}")
            st.metric("Distress probability", f"{event.distress_probability:.1%}")
            st.warning(event.alert) if "Warning" in event.alert else st.error(event.alert) if "CRITICAL" in event.alert else st.success(event.alert)
            try:
                shap_path = "artifacts/shap_summary.png"
                shap_summary(models["Random Forest"], prepared.X_train.sample(min(500, len(prepared.X_train)), random_state=42), FEATURE_NAMES, shap_path)
                st.image(shap_path, caption="Global SHAP summary")
                background = prepared.scaler.inverse_transform(prepared.X_train)
                background = pd.DataFrame(background, columns=FEATURE_NAMES)
                explanation = lime_explanation(model, artifacts["scaler"], raw, FEATURE_NAMES, background_data=background)
                st.components.v1.html(explanation.as_html(), height=500, scrolling=True)
            except RuntimeError as exc:
                st.info(str(exc))

    with tabs[1]:
        st.subheader("Sequential test-record simulator")
        raw = load_raw()
        stream_model = model
        if "stream_events" not in st.session_state:
            st.session_state.stream_events = []
        start, stop, next_record = st.columns(3)
        if start.button("Start stream"):
            st.session_state.streaming = True
        if stop.button("Stop stream"):
            st.session_state.streaming = False
        if next_record.button("Process next CTG record"):
            st.session_state.streaming = False
            st.session_state.process_one = True
        if st.session_state.get("streaming", False) or st.session_state.pop("process_one", False):
            features = raw[FEATURE_NAMES].iloc[[len(st.session_state.stream_events) % len(raw)]]
            scaled = pd.DataFrame(artifacts["scaler"].transform(features), columns=FEATURE_NAMES)
            st.session_state.stream_events.append(predict_risk(stream_model, scaled))
            if st.session_state.get("streaming", False):
                time.sleep(0.5)
                st.rerun()
        if st.session_state.stream_events:
            events = pd.DataFrame([event.__dict__ for event in st.session_state.stream_events])
            st.line_chart(events.set_index("timestamp")[["risk_score", "distress_probability"]])
            st.dataframe(events.tail(10), use_container_width=True)

    with tabs[2]:
        st.subheader("Publication-ready benchmark metrics")
        evaluation_path = Path("artifacts/evaluation.joblib")
        if evaluation_path.exists():
            evaluation = joblib.load(evaluation_path)
            st.dataframe(evaluation["metrics"].style.format("{:.4f}"), use_container_width=True)
            cols = st.columns(len(evaluation["confusion_matrices"]))
            for column, (name, matrix) in zip(cols, evaluation["confusion_matrices"].items()):
                column.write(name)
                column.dataframe(pd.DataFrame(matrix, index=["Normal", "Suspect", "Pathological"], columns=["Normal", "Suspect", "Pathological"]))
        else:
            st.info("Run training to generate metrics and confusion matrices.")


if __name__ == "__main__":
    main()
