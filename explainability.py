"""Global SHAP and local LIME explanations for CTG predictions."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Callable

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


def _predict_fn(model: Any, scaler: Any, feature_names: list[str]) -> Callable[[np.ndarray], np.ndarray]:
    def predict(values: np.ndarray) -> np.ndarray:
        frame = pd.DataFrame(values, columns=feature_names)
        return model.predict_proba(scaler.transform(frame))
    return predict


def shap_summary(
    model: Any, X: pd.DataFrame, feature_names: list[str], output_path: str | Path = "artifacts/shap_summary.png"
) -> pd.DataFrame:
    """Create a SHAP beeswarm summary plot and return mean absolute importance."""
    try:
        import shap
    except ImportError as exc:
        raise RuntimeError("Install SHAP with `pip install shap` to enable explanations.") from exc
    estimator = model
    if hasattr(model, "named_steps"):
        estimator = model.named_steps.get("classifier", model)
    if hasattr(estimator, "estimators_"):  # stacking: explain the first tree as a robust global view
        estimator = next((m for m in estimator.estimators_ if hasattr(m, "feature_importances_")), estimator)
    explainer = shap.Explainer(estimator, X)
    values = explainer(X)
    raw = values.values
    if raw.ndim == 3:
        importance = np.abs(raw).mean(axis=(0, 2))
    else:
        importance = np.abs(raw).mean(axis=0)
    result = pd.DataFrame({"feature": feature_names, "mean_abs_shap": importance}).sort_values(
        "mean_abs_shap", ascending=False
    )
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    shap.summary_plot(values, X, show=False, max_display=len(feature_names))
    plt.tight_layout()
    plt.savefig(output_path, dpi=180, bbox_inches="tight")
    plt.close()
    return result


def lime_explanation(
    model: Any, scaler: Any, row: pd.DataFrame, feature_names: list[str],
    output_path: str | Path = "artifacts/lime_local.html",
    background_data: pd.DataFrame | None = None,
) -> Any:
    """Generate a local LIME explanation for one unscaled clinical record."""
    try:
        from lime.lime_tabular import LimeTabularExplainer
    except ImportError as exc:
        raise RuntimeError("Install LIME with `pip install lime` to enable explanations.") from exc
    training_data = (
        background_data[feature_names].to_numpy(dtype=float)
        if background_data is not None
        else np.zeros((2, len(feature_names)))
    )
    explainer = LimeTabularExplainer(
        training_data=training_data,
        feature_names=feature_names, class_names=["Normal", "Suspect", "Pathological"],
        mode="classification", discretize_continuous=True, random_state=42,
    )
    explanation = explainer.explain_instance(
        row.iloc[0].to_numpy(dtype=float), _predict_fn(model, scaler, feature_names),
        num_features=min(10, len(feature_names)), top_labels=3,
    )
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    explanation.save_to_file(str(output_path))
    return explanation
