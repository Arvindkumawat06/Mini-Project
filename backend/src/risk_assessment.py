"""Risk assessment module."""
import numpy as np

def calculate_risk_score(probabilities):
    """
    R = 100(0.2*Pn + 0.5*Ps + 1.0*Pp)
    """
    p_n = probabilities[0]
    p_s = probabilities[1]
    p_p = probabilities[2]
    risk_score = 100 * (0.2 * p_n + 0.5 * p_s + 1.0 * p_p)
    return float(risk_score)

def classify_alert(probabilities, warning_threshold=0.35, critical_threshold=0.60):
    """Convert class probabilities [Normal, Suspect, Pathological] into an alert."""
    distress = float(probabilities[1] + probabilities[2])
    if distress >= critical_threshold:
        return distress, "CRITICAL: Fetal Distress"
    if distress >= warning_threshold:
        return distress, "Warning: Suspect"
    return distress, "Normal"
