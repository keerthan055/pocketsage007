from sklearn.ensemble import IsolationForest
import numpy as np
import pandas as pd

class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(contamination=0.05, random_state=42)
    
    def train(self, data: pd.DataFrame):
        # Feature engineering for transactions: amount and frequency (per category)
        if data.empty:
            return
        
        features = data[['amount']].values
        self.model.fit(features)
    
    def predict(self, amount: float) -> bool:
        # Returns True if anomaly
        pred = self.model.predict([[amount]])
        return pred[0] == -1

detector = AnomalyDetector()
