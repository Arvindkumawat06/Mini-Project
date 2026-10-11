"""Preprocessing and train/test splitting for UCI CTG."""
import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import StandardScaler
from dataclasses import dataclass

from src.data_loader import FEATURE_NAMES, TARGET_NAME, load_dataset, normalise_columns

@dataclass
class PreparedData:
    X_train: pd.DataFrame
    X_test: pd.DataFrame
    y_train: pd.Series
    y_test: pd.Series
    scaler: StandardScaler
    feature_names: list
    correlation_matrix: pd.DataFrame
    cv: StratifiedKFold
    X_train_unscaled: pd.DataFrame
    X_test_unscaled: pd.DataFrame

def prepare_data(path=None, test_size=0.20, random_state=42, n_splits=5):
    """Clean, stratify, scale, and prepare cross-validation folds."""
    frame = normalise_columns(load_dataset(path))
    frame = frame.drop_duplicates().copy()
    
    # Handle missing values if any
    frame[FEATURE_NAMES] = frame[FEATURE_NAMES].apply(pd.to_numeric, errors="coerce")
    frame[TARGET_NAME] = pd.to_numeric(frame[TARGET_NAME], errors="coerce")
    frame[FEATURE_NAMES] = frame[FEATURE_NAMES].fillna(frame[FEATURE_NAMES].median())
    frame = frame.dropna(subset=[TARGET_NAME])
    frame[TARGET_NAME] = frame[TARGET_NAME].astype(int)
    
    X = frame[FEATURE_NAMES]
    y = frame[TARGET_NAME] - 1  # 0-based indexing for estimators
    
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
        X_train_scaled, X_test_scaled, y_train, y_test, scaler, FEATURE_NAMES, corr, cv,
        X_train, X_test
    )
