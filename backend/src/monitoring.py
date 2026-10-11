"""Continuous CTG stream simulation and early fetal distress alerts."""
import time
import numpy as np
import pandas as pd
from dataclasses import dataclass
from src.risk_assessment import calculate_risk_score, classify_alert

@dataclass
class RiskEvent:
    timestamp: float
    predicted_class: int
    confidence: float
    risk_score: float
    distress_probability: float
    alert: str
    probabilities: list

def predict_risk(model, row):
    """Predict one record; row must already be scaled for the persisted model."""
    probabilities = np.asarray(model.predict_proba(row))[0]
    predicted = int(model.classes_[np.argmax(probabilities)]) + 1
    confidence = float(np.max(probabilities))
    
    risk_score = calculate_risk_score(probabilities)
    distress, alert = classify_alert(probabilities)
    
    return RiskEvent(time.time(), predicted, confidence, risk_score, distress, alert, probabilities.tolist())

def stream_predictions(model, records, interval_seconds=0.0):
    """Yield sequential events for a CTG data stream, optionally with pacing."""
    for _, row in records.iterrows():
        event = predict_risk(model, row.to_frame().T)
        yield event
        if interval_seconds > 0:
            time.sleep(interval_seconds)
