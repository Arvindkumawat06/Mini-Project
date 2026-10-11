"""Orchestrator for model training, tuning, ensembling, and evaluation."""
import argparse
import os
import joblib
import pandas as pd
from pathlib import Path

from src.preprocessing import prepare_data
from src.tune_models import tune_models
from src.ensemble import build_stacking
from src.evaluate_models import (
    evaluate_model, plot_confusion_matrix, plot_roc_curves, 
    plot_pr_curves, plot_model_comparison
)

def train_and_save(dataset_path=None, output_dir="artifacts", figures_dir="outputs/figures", n_trials=None):
    """Train all models, evaluate, generate charts, and save artifacts."""
    print("Preparing data...")
    data = prepare_data(dataset_path)
    
    trials = n_trials or int(os.getenv("OPTUNA_TRIALS", "25"))
    print(f"Tuning models with {trials} trials...")
    models = tune_models(data, n_trials=trials)
    
    print("Building stacking ensemble...")
    models["Stacking Ensemble"] = build_stacking(models, data)
    
    print("Evaluating models...")
    rows = []
    matrices = {}
    for name, model in models.items():
        metric_row, matrix = evaluate_model(name, model, data)
        metric_row["Model"] = name
        rows.append(metric_row)
        matrices[name] = matrix
        
    table = pd.DataFrame(rows).set_index("Model")
    
    print("\nGenerating publication-quality figures...")
    plot_confusion_matrix(matrices, output_dir=figures_dir)
    plot_roc_curves(models, data, output_dir=figures_dir)
    plot_pr_curves(models, data, output_dir=figures_dir)
    plot_model_comparison(table, output_dir=figures_dir)
    
    print("Saving artifacts...")
    dest = Path(output_dir)
    dest.mkdir(parents=True, exist_ok=True)
    
    joblib.dump({"models": models, "scaler": data.scaler, "feature_names": data.feature_names}, dest / "ctg_models.joblib")
    joblib.dump({"metrics": table, "confusion_matrices": matrices, "correlation": data.correlation_matrix}, dest / "evaluation.joblib")
    
    # Save CSV metrics
    table.to_csv(Path("outputs/reports") / "model_metrics.csv")
    
    print("Training complete!")
    print(table.to_markdown(floatfmt=".4f"))
    return table, models, matrices

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default=None)
    parser.add_argument("--output", default="artifacts")
    parser.add_argument("--trials", type=int, default=None)
    args = parser.parse_args()
    train_and_save(args.data, args.output, n_trials=args.trials)
