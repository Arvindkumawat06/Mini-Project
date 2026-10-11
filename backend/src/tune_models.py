"""Hyperparameter optimization using Optuna."""
import optuna
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC
from sklearn.model_selection import cross_val_predict
from sklearn.metrics import roc_auc_score
from xgboost import XGBClassifier

optuna.logging.set_verbosity(optuna.logging.WARNING)

def _objective_factory(name, data, seed, n_trials):
    def objective(trial):
        if name == "Random Forest":
            model = RandomForestClassifier(
                n_estimators=trial.suggest_int("n_estimators", 100, 300),
                max_depth=trial.suggest_int("max_depth", 4, 25),
                min_samples_split=trial.suggest_int("min_samples_split", 2, 10),
                max_features=trial.suggest_categorical("max_features", ["sqrt", "log2", None]),
                class_weight="balanced", random_state=seed, n_jobs=-1,
            )
        elif name == "XGBoost":
            model = XGBClassifier(
                n_estimators=trial.suggest_int("n_estimators", 50, 200),
                max_depth=trial.suggest_int("max_depth", 2, 8),
                learning_rate=trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
                subsample=trial.suggest_float("subsample", 0.7, 1.0),
                colsample_bytree=trial.suggest_float("colsample_bytree", 0.7, 1.0),
                objective="multi:softprob", num_class=3, eval_metric="mlogloss",
                random_state=seed, n_jobs=-1,
            )
        elif name == "SVM":
            model = Pipeline([
                ("classifier", SVC(
                    C=trial.suggest_float("C", 0.1, 100, log=True),
                    gamma=trial.suggest_float("gamma", 1e-4, 1, log=True),
                    kernel=trial.suggest_categorical("kernel", ["rbf", "poly"]),
                    probability=True, class_weight="balanced", random_state=seed,
                ))
            ])
        elif name == "Decision Tree":
            model = DecisionTreeClassifier(
                max_depth=trial.suggest_int("max_depth", 3, 20),
                min_samples_split=trial.suggest_int("min_samples_split", 2, 20),
                class_weight="balanced", random_state=seed
            )
        elif name == "Logistic Regression":
            model = LogisticRegression(
                C=trial.suggest_float("C", 0.01, 100, log=True),
                max_iter=2000, class_weight="balanced", random_state=seed
            )
        
        score = cross_val_predict(
            model, data.X_train, data.y_train, cv=data.cv, method="predict_proba", n_jobs=1
        )
        return roc_auc_score(data.y_train, score, multi_class="ovr", average="macro")
    return objective

def tune_models(data, n_trials=25, random_state=42):
    """Tune models and return fitted best estimators."""
    models = {}
    model_names = ["Logistic Regression", "Decision Tree", "Random Forest", "XGBoost", "SVM"]
    
    for name in model_names:
        study = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=random_state))
        study.optimize(_objective_factory(name, data, random_state, n_trials), n_trials=n_trials)
        best = study.best_params
        
        if name == "Random Forest":
            model = RandomForestClassifier(**best, class_weight="balanced", random_state=random_state, n_jobs=-1)
        elif name == "XGBoost":
            model = XGBClassifier(**best, objective="multi:softprob", num_class=3, eval_metric="mlogloss", random_state=random_state, n_jobs=-1)
        elif name == "SVM":
            model = Pipeline([("classifier", SVC(**best, probability=True, class_weight="balanced", random_state=random_state))])
        elif name == "Decision Tree":
            model = DecisionTreeClassifier(**best, class_weight="balanced", random_state=random_state)
        elif name == "Logistic Regression":
            model = LogisticRegression(**best, max_iter=2000, class_weight="balanced", random_state=random_state)
            
        model.fit(data.X_train, data.y_train)
        models[name] = model
        
    return models
