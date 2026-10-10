"""Data loading, validation, preprocessing, and train/test splitting for UCI CTG."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import StandardScaler

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
# Public mirror of the UCI CTG tabular export.
CTG_URL = (
    "https://raw.githubusercontent.com/sfu-cmpt340/fetal-health-classification/"
    "a869055b13f226b5fe67dfaecd791396025348d8/TabulatedCTG/fetal_health.csv"
)


@dataclass
class PreparedData:
    """Leakage-safe, scaled representation of the CTG data."""

    X_train: pd.DataFrame
    X_test: pd.DataFrame
    y_train: pd.Series
    y_test: pd.Series
    scaler: StandardScaler
    feature_names: list[str]
    correlation_matrix: pd.DataFrame
    cv: StratifiedKFold


def load_dataset(path: Optional[str | Path] = None, download: bool = True) -> pd.DataFrame:
    """Load fetal_health.csv from disk, or download it when it is absent."""
    candidate = Path(path) if path else Path("data") / "fetal_health.csv"
    if candidate.exists():
        return pd.read_csv(candidate)
    if not download:
        raise FileNotFoundError(f"Dataset not found: {candidate}")
    try:
        frame = pd.read_csv(CTG_URL)
    except Exception as exc:
        raise RuntimeError(
            "Could not load fetal_health.csv. Download it from the UCI CTG dataset "
            "and place it at data/fetal_health.csv."
        ) from exc
    candidate.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(candidate, index=False)
    return frame


def _normalise_columns(frame: pd.DataFrame) -> pd.DataFrame:
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


def prepare_data(
    path: Optional[str | Path] = None,
    test_size: float = 0.20,
    random_state: int = 42,
    n_splits: int = 5,
) -> PreparedData:
    """Clean, stratify, scale, and prepare cross-validation folds."""
    frame = _normalise_columns(load_dataset(path))
    frame = frame.drop_duplicates().copy()
    frame[FEATURE_NAMES] = frame[FEATURE_NAMES].apply(pd.to_numeric, errors="coerce")
    frame[TARGET_NAME] = pd.to_numeric(frame[TARGET_NAME], errors="coerce")
    frame[FEATURE_NAMES] = frame[FEATURE_NAMES].fillna(frame[FEATURE_NAMES].median())
    frame = frame.dropna(subset=[TARGET_NAME])
    frame[TARGET_NAME] = frame[TARGET_NAME].astype(int)
    if not set(frame[TARGET_NAME].unique()).issubset({1, 2, 3}):
        raise ValueError("fetal_health must contain only classes 1, 2, and 3.")

    X = frame[FEATURE_NAMES]
    # Most sklearn estimators accept arbitrary labels, while XGBoost requires
    # zero-based labels. Keep the documented 1/2/3 values at ingestion and
    # use a stable internal encoding for every estimator.
    y = frame[TARGET_NAME] - 1
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(
        scaler.fit_transform(X_train), columns=FEATURE_NAMES, index=X_train.index
    )
    X_test_scaled = pd.DataFrame(
        scaler.transform(X_test), columns=FEATURE_NAMES, index=X_test.index
    )
    corr = X_train.corr(method="spearman")
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)
    return PreparedData(
        X_train_scaled, X_test_scaled, y_train, y_test, scaler, FEATURE_NAMES, corr, cv
    )


def redundant_features(correlation_matrix: pd.DataFrame, threshold: float = 0.90) -> list[str]:
    """Return later columns in highly correlated feature pairs for review."""
    upper = correlation_matrix.where(
        np.triu(np.ones(correlation_matrix.shape), k=1).astype(bool)
    )
    return [column for column in upper.columns if (upper[column].abs() > threshold).any()]


if __name__ == "__main__":
    prepared = prepare_data()
    print(f"Train: {prepared.X_train.shape}, test: {prepared.X_test.shape}")
    print("Highly correlated features:", redundant_features(prepared.correlation_matrix))
