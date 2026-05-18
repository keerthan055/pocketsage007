import xgboost as xgb
import numpy as np
import pandas as pd

class RiskPredictor:
    def __init__(self):
        self.model = None
        # Mock features: savings_ratio, debt_to_income, expense_volatility, income_stability
        self.feature_names = ['savings_ratio', 'debt_to_income', 'expense_volatility', 'income_stability']

    def train_mock(self):
        # Create a dummy model if none exists
        X = np.random.rand(100, 4)
        y = (X[:, 1] > 0.6).astype(int) # High debt = high risk
        self.model = xgb.XGBClassifier()
        self.model.fit(X, y)

    def predict(self, features: dict) -> tuple:
        if self.model is None:
            self.train_mock()
        
        data = np.array([[features[f] for f in self.feature_names]])
        prob = self.model.predict_proba(data)[0][1]
        
        if prob < 0.3:
            level = "Low"
        elif prob < 0.7:
            level = "Medium"
        else:
            level = "High"
            
        return float(prob), level

risk_predictor = RiskPredictor()
