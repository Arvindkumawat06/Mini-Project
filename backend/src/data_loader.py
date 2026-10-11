"""Data loading and validation for UCI CTG."""
import pandas as pd
from pathlib import Path

FEATURE_NAMES = [
    "baseline_value", "accelerations", "fetal_movement", "uterine_contractions",
    "light_decelerations", "severe_decelerations", "prolonged_decelerations",
    "abnormal_short_term_variability", "mean_value_of_short_term_variability",
    "percentage_of_time_with_abnormal_long_term_variability",
    "mean_value_of_long_term_variability", "histogram_width",
    "histogram_min", "histogram_max", "histogram_number_of_peaks",
    "histogram_number_of_zeroes", "histogram_mode", "histogram_mean",
    "histogram_median", "histogram_variance", "histogram_tendency",
]
TARGET_NAME = "fetal_health"
CTG_URL = (
    "https://raw.githubusercontent.com/sfu-cmpt340/fetal-health-classification/"
    "a869055b13f226b5fe67dfaecd791396025348d8/TabulatedCTG/fetal_health.csv"
)

def load_dataset(path=None, download=True):
    """Load fetal_health.csv from disk, or download it when it is absent."""
    candidate = Path(path) if path else Path("data") / "fetal_health.csv"
    if candidate.exists():
        return pd.read_csv(candidate)
    if not download:
        raise FileNotFoundError(f"Dataset not found: {candidate}")
    try:
        frame = pd.read_csv(CTG_URL)
    except Exception as exc:
        raise RuntimeError("Could not load fetal_health.csv.") from exc
    candidate.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(candidate, index=False)
    return frame

def normalise_columns(frame):
    """Accept the UCI column spelling and normalize whitespace/case."""
    result = frame.copy()
    result.columns = [str(c).strip().lower().replace(" ", "_") for c in result.columns]
    aliases = {
        "fetal_health": TARGET_NAME,
        "fetalhealth": TARGET_NAME,
        "prolongued_decelerations": "prolonged_decelerations",
    }
    result.rename(columns=aliases, inplace=True)
    missing = [name for name in FEATURE_NAMES + [TARGET_NAME] if name not in result]
    if missing:
        raise ValueError(f"Dataset is missing required CTG columns: {missing}")
    return result[FEATURE_NAMES + [TARGET_NAME]]
