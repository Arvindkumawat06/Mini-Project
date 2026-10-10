"""Stacking ensemble model."""
from sklearn.ensemble import StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.base import clone

def build_stacking(models, data, random_state=42):
    """Fit a Logistic Regression meta-classifier on leakage-safe OOF probabilities."""
    estimators = [(key.lower().replace(" ", "_"), clone(value)) for key, value in models.items()]
    stack = StackingClassifier(
        estimators=estimators, 
        final_estimator=LogisticRegression(max_iter=2000, class_weight="balanced"),
        stack_method="predict_proba", 
        cv=data.cv, 
        passthrough=False, 
        n_jobs=-1
    )
    stack.fit(data.X_train, data.y_train)
    return stack
