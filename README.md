# CTG Fetal Health Classification

This prototype trains Random Forest, XGBoost, SVM, and a logistic-regression
stacking ensemble on the UCI Cardiotocography dataset. It supports publication
metrics, SHAP global explanations, LIME patient explanations, and a Streamlit
continuous-risk simulator.

## Quick start

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python train.py --trials 25
streamlit run app.py
```

The first training run downloads `data/fetal_health.csv` when it is not present.
For reproducibility, retain that downloaded file and set `--trials` explicitly.
Set `OPTUNA_TRIALS` to control the default trial count.

## Outputs

Training writes the persisted model bundle to `artifacts/ctg_models.joblib`,
evaluation metrics and confusion matrices to `artifacts/evaluation.joblib`, and
XAI plots/HTML explanations to `artifacts/`.

The internal labels are zero-based for estimator compatibility; the UI and
monitoring API expose the clinical labels Normal (1), Suspect (2), and
Pathological (3). Scaling is fitted on the training partition only, and all
hyperparameter scoring uses stratified five-fold cross-validation within that
partition.
