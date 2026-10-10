"""Continuous CTG stream simulation and early fetal distress alerts."""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Iterable, Iterator

import numpy as np
import pandas as pd


@dataclass
class RiskEvent:
    timestamp: float
    predicted_class: int
    confidence: float
    risk_score: float
    distress_probability: float
    alert: str


def classify_alert(probabilities: np.ndarray, warning_threshold: float = 0.35, critical_threshold: float = 0.60) -> tuple[float, str]:
    """Convert class probabilities [Normal, Suspect, Pathological] into an alert."""
    distress = float(probabilities[1] + probabilities[2])
    if distress >= critical_threshold:
        return distress, "CRITICAL: Fetal Distress"
    if distress >= warning_threshold:
        return distress, "Warning: Suspect"
    return distress, "Normal"


def predict_risk(model: Any, row: pd.DataFrame) -> RiskEvent:
    """Predict one record; row must already be scaled for the persisted model."""
    probabilities = np.asarray(model.predict_proba(row))[0]
    predicted = int(model.classes_[np.argmax(probabilities)]) + 1
    confidence = float(np.max(probabilities))
    distress, alert = classify_alert(probabilities)
    return RiskEvent(time.time(), predicted, confidence, (1 - confidence) * 100, distress, alert)


def stream_predictions(
    model: Any, records: pd.DataFrame, interval_seconds: float = 0.0
) -> Iterator[RiskEvent]:
    """Yield sequential events for a CTG data stream, optionally with pacing."""
    for _, row in records.iterrows():
        event = predict_risk(model, row.to_frame().T)
        yield event
        if interval_seconds > 0:
            time.sleep(interval_seconds)
