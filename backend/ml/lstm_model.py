import torch
import torch.nn as nn
import numpy as np
from typing import List

class LSTMForecaster(nn.Module):
    def __init__(self, input_size=1, hidden_layer_size=50, output_size=1):
        super().__init__()
        self.hidden_layer_size = hidden_layer_size
        self.lstm = nn.LSTM(input_size, hidden_layer_size)
        self.linear = nn.Linear(hidden_layer_size, output_size)
        self.hidden_cell = (torch.zeros(1,1,self.hidden_layer_size),
                            torch.zeros(1,1,self.hidden_layer_size))

    def forward(self, input_seq):
        lstm_out, self.hidden_cell = self.lstm(input_seq.view(len(input_seq), 1, -1), self.hidden_cell)
        predictions = self.linear(lstm_out.view(len(input_seq), -1))
        return predictions[-1]

class ForecastService:
    def __init__(self):
        self.model = LSTMForecaster()
        # In a real app, we'd load weights here
        # self.model.load_state_dict(torch.load('model.pth'))
        self.model.eval()

    def predict_next_30_days(self, history: List[float]) -> List[float]:
        # simplified forecast logic
        if len(history) < 7:
            # Fallback for low data: simple linear trend or repeat last
            last = history[-1] if history else 0
            return [last + (i * 0.01) for i in range(30)]
            
        test_inputs = torch.FloatTensor(history[-7:]).view(-1)
        predictions = []
        
        # Real forecasting would involve an iterative loop
        # For this MVP, we return a simulated trend based on history
        avg_change = np.mean(np.diff(history)) if len(history) > 1 else 0
        last_val = history[-1]
        
        for i in range(30):
            last_val += avg_change + np.random.normal(0, last_val * 0.02)
            predictions.append(float(last_val))
            
        return predictions

forecast_service = ForecastService()
