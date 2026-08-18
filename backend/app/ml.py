import numpy as np
from sklearn.ensemble import RandomForestRegressor
import pickle
import os

import os
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "risk_model.pkl")

def get_or_train_model():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
            
    # Train a dummy model if it doesn't exist
    # Features: [num_secrets, num_vulnerabilities, cyclomatic_complexity]
    X_train = np.array([
        [0, 0, 10],
        [1, 0, 15],
        [0, 2, 20],
        [3, 5, 50],
        [10, 10, 100]
    ])
    
    # Target risk score (0 to 100)
    y_train = np.array([5, 30, 45, 85, 99])
    
    model = RandomForestRegressor(n_estimators=10, random_state=42)
    model.fit(X_train, y_train)
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
        
    return model

def calculate_risk_score(gitleaks_findings: int, semgrep_findings: int, complexity: int = 10) -> float:
    """Calculates a risk score based on the findings using a trained ML model."""
    model = get_or_train_model()
    features = np.array([[gitleaks_findings, semgrep_findings, complexity]])
    score = model.predict(features)[0]
    return float(score)
