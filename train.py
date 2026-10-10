"""Optuna-tuned CTG classifiers, stacking, evaluation, and model persistence."""

from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import optuna
import pandas as pd
from sklearn.base import clone
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix, f1_score,
    precision_score, recall_score, roc_auc_score,
)
from sklearn.model_selection import cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC
from xgboost import XGBClassifier

from preprocess import PreparedData, prepare_data

optuna.logging.set_verbosity(optuna.logging.WARNING)


def _objective_factory(name: str, data: PreparedData, seed: int, n_trials: int) -> Any:
    def objective(trial: optuna.Trial) -> float:
        if name == "Random Forest":
            model = RandomForestClassifier(
                n_estimators=trial.suggest_int("n_estimators", 150, 500),
                max_depth=trial.suggest_int("max_depth", 4, 25),
                min_samples_split=trial.suggest_int("min_samples_split", 2, 12),
                max_features=trial.suggest_categorical("max_features", ["sqrt", "log2", None]),
                class_weight="balanced",
                random_state=seed, n_jobs=-1,
            )
        elif name == "XGBoost":
            model = XGBClassifier(
                n_estimators=trial.suggest_int("n_estimators", 100, 500),
                max_depth=trial.suggest_int("max_depth", 2, 8),
                learning_rate=trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
                subsample=trial.suggest_float("subsample", 0.7, 1.0),
                colsample_bytree=trial.suggest_float("colsample_bytree", 0.7, 1.0),
                objective="multi:softprob", num_class=3, eval_metric="mlogloss",
                random_state=seed, n_jobs=-1,
            )
        else:
            model = Pipeline([
                ("classifier", SVC(
                    C=trial.suggest_float("C", 0.1, 100, log=True),
                    gamma=trial.suggest_float("gamma", 1e-4, 1, log=True),
                    kernel=trial.suggest_categorical("kernel", ["rbf", "poly"]),
                    probability=True, class_weight="balanced", random_state=seed,
                ))
            ])
        score = cross_val_predict(
            model, data.X_train, data.y_train, cv=data.cv, method="predict_proba", n_jobs=1
        )
        return roc_auc_score(data.y_train, score, multi_class="ovr", average="macro")
    return objective


def tune_models(
    data: PreparedData, n_trials: int = 25, random_state: int = 42
) -> dict[str, Any]:
    """Tune each base learner using 5-fold stratified CV and return fitted models."""
    models: dict[str, Any] = {}
    for name in ("Random Forest", "XGBoost", "SVM"):
        study = optuna.create_study(
            direction="maximize", sampler=optuna.samplers.TPESampler(seed=random_state)
        )
        study.optimize(_objective_factory(name, data, random_state, n_trials), n_trials=n_trials)
        best = study.best_params
        if name == "Random Forest":
            model = RandomForestClassifier(**best, class_weight="balanced", random_state=random_state, n_jobs=-1)
        elif name == "XGBoost":
            model = XGBClassifier(**best, objective="multi:softprob", num_class=3, eval_metric="mlogloss", random_state=random_state, n_jobs=-1)
        else:
            model = Pipeline([("classifier", SVC(**best, probability=True, class_weight="balanced", random_state=random_state))])
        model.fit(data.X_train, data.y_train)
        models[name] = model
    return models


def specificity(y_true: pd.Series, predictions: np.ndarray) -> float:
    """Macro-average one-vs-rest specificity."""
    matrix = confusion_matrix(y_true, predictions, labels=[0, 1, 2])
    values = []
    for index in range(matrix.shape[0]):
        tp = matrix[index, index]
        fn = matrix[index, :].sum() - tp
        fp = matrix[:, index].sum() - tp
        tn = matrix.sum() - tp - fn - fp
        values.append(tn / (tn + fp) if tn + fp else 0.0)
    return float(np.mean(values))


def evaluate_model(name: str, model: Any, data: PreparedData) -> tuple[dict[str, float], np.ndarray]:
    probabilities = model.predict_proba(data.X_test)
    predictions = model.classes_[np.argmax(probabilities, axis=1)]
    metrics = {
        "Accuracy": accuracy_score(data.y_test, predictions),
        "Precision (Macro)": precision_score(data.y_test, predictions, average="macro", zero_division=0),
        "Precision (Weighted)": precision_score(data.y_test, predictions, average="weighted", zero_division=0),
        "Recall (Macro)": recall_score(data.y_test, predictions, average="macro", zero_division=0),
        "Recall (Weighted)": recall_score(data.y_test, predictions, average="weighted", zero_division=0),
        "Specificity": specificity(data.y_test, predictions),
        "F1 (Macro)": f1_score(data.y_test, predictions, average="macro", zero_division=0),
        "F1 (Weighted)": f1_score(data.y_test, predictions, average="weighted", zero_division=0),
        "ROC-AUC (OvR)": roc_auc_score(data.y_test, probabilities, multi_class="ovr", average="macro"),
    }
    return metrics, confusion_matrix(data.y_test, predictions, labels=[0, 1, 2])


def build_stacking(models: dict[str, Any], data: PreparedData, random_state: int = 42) -> StackingClassifier:
    """Fit a Logistic Regression meta-classifier on leakage-safe OOF probabilities."""
    estimators = [(key.lower().replace(" ", "_"), clone(value)) for key, value in models.items()]
    stack = StackingClassifier(
        estimators=estimators, final_estimator=LogisticRegression(max_iter=2000, class_weight="balanced"),
        stack_method="predict_proba", cv=data.cv, passthrough=False, n_jobs=-1
    )
    stack.fit(data.X_train, data.y_train)
    return stack


def train_and_save(
    dataset_path: str | None = None, output_dir: str = "artifacts", n_trials: int | None = None
) -> tuple[pd.DataFrame, dict[str, Any], dict[str, np.ndarray]]:
    """Train all models, print publication-style metrics, and persist artifacts."""
    data = prepare_data(dataset_path)
    models = tune_models(data, n_trials=n_trials or int(os.getenv("OPTUNA_TRIALS", "25")))
    models["Stacking Ensemble"] = build_stacking(models, data)
    rows, matrices = [], {}
    for name, model in models.items():
        metric_row, matrix = evaluate_model(name, model, data)
        metric_row["Model"] = name
        rows.append(metric_row)
        matrices[name] = matrix
    table = pd.DataFrame(rows).set_index("Model")
    print(table.to_markdown(floatfmt=".4f"))
    print("\nClassification reports:")
    for name, model in models.items():
        print(f"\n{name}\n", classification_report(data.y_test, model.predict(data.X_test), zero_division=0))
    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    joblib.dump({"models": models, "scaler": data.scaler, "feature_names": data.feature_names}, destination / "ctg_models.joblib")
    joblib.dump({"metrics": table, "confusion_matrices": matrices, "correlation": data.correlation_matrix}, destination / "evaluation.joblib")
    return table, models, matrices


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default=None)
    parser.add_argument("--output", default="artifacts")
    parser.add_argument("--trials", type=int, default=None)
    args = parser.parse_args()
    train_and_save(args.data, args.output, args.trials)
