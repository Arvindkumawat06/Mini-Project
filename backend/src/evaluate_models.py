"""Model evaluation and plotting."""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix, f1_score,
    precision_score, recall_score, roc_auc_score, roc_curve, auc,
    precision_recall_curve, average_precision_score
)
from sklearn.preprocessing import label_binarize
from pathlib import Path

def specificity(y_true, predictions):
    matrix = confusion_matrix(y_true, predictions, labels=[0, 1, 2])
    values = []
    for index in range(matrix.shape[0]):
        tp = matrix[index, index]
        fn = matrix[index, :].sum() - tp
        fp = matrix[:, index].sum() - tp
        tn = matrix.sum() - tp - fn - fp
        values.append(tn / (tn + fp) if tn + fp else 0.0)
    return float(np.mean(values))

def evaluate_model(name, model, data):
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
    matrix = confusion_matrix(data.y_test, predictions, labels=[0, 1, 2])
    return metrics, matrix

def plot_confusion_matrix(matrices, output_dir="outputs/figures"):
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    for name, matrix in matrices.items():
        plt.figure(figsize=(6, 5))
        sns.heatmap(matrix, annot=True, fmt="d", cmap="Blues",
                    xticklabels=["Normal", "Suspect", "Pathological"],
                    yticklabels=["Normal", "Suspect", "Pathological"])
        plt.title(f"Confusion Matrix - {name}")
        plt.ylabel("True Class")
        plt.xlabel("Predicted Class")
        plt.tight_layout()
        plt.savefig(Path(output_dir) / f"cm_{name.replace(' ', '_').lower()}.png", dpi=300)
        plt.close()

def plot_roc_curves(models, data, output_dir="outputs/figures"):
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    y_test_bin = label_binarize(data.y_test, classes=[0, 1, 2])
    n_classes = y_test_bin.shape[1]
    
    for name, model in models.items():
        probs = model.predict_proba(data.X_test)
        plt.figure(figsize=(8, 6))
        for i, class_name in enumerate(["Normal", "Suspect", "Pathological"]):
            fpr, tpr, _ = roc_curve(y_test_bin[:, i], probs[:, i])
            roc_auc = auc(fpr, tpr)
            plt.plot(fpr, tpr, lw=2, label=f'{class_name} (AUC = {roc_auc:.2f})')
            
        plt.plot([0, 1], [0, 1], 'k--', lw=2)
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(f'Multiclass ROC - {name}')
        plt.legend(loc="lower right")
        plt.tight_layout()
        plt.savefig(Path(output_dir) / f"roc_{name.replace(' ', '_').lower()}.png", dpi=300)
        plt.close()

def plot_pr_curves(models, data, output_dir="outputs/figures"):
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    y_test_bin = label_binarize(data.y_test, classes=[0, 1, 2])
    
    for name, model in models.items():
        probs = model.predict_proba(data.X_test)
        plt.figure(figsize=(8, 6))
        for i, class_name in enumerate(["Normal", "Suspect", "Pathological"]):
            precision, recall, _ = precision_recall_curve(y_test_bin[:, i], probs[:, i])
            avg_pr = average_precision_score(y_test_bin[:, i], probs[:, i])
            plt.plot(recall, precision, lw=2, label=f'{class_name} (AP = {avg_pr:.2f})')
            
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.title(f'Precision-Recall Curve - {name}')
        plt.legend(loc="lower left")
        plt.tight_layout()
        plt.savefig(Path(output_dir) / f"pr_{name.replace(' ', '_').lower()}.png", dpi=300)
        plt.close()

def plot_model_comparison(table, output_dir="outputs/figures"):
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    metrics_to_plot = ["Accuracy", "F1 (Macro)", "ROC-AUC (OvR)"]
    table_subset = table[metrics_to_plot]
    
    ax = table_subset.plot(kind="bar", figsize=(10, 6), rot=45)
    plt.title("Model Performance Comparison")
    plt.ylabel("Score")
    plt.ylim(0.7, 1.0)
    plt.legend(loc='lower right')
    plt.tight_layout()
    plt.savefig(Path(output_dir) / "model_comparison.png", dpi=300)
    plt.close()
