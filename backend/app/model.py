import os
import joblib

def load_model():
    model_path = "model/trained_model.pkl"
    if not os.path.exists(model_path):
        raise FileNotFoundError("❌ Trained model not found. Please upload and train first.")
    return joblib.load(model_path)

def predict_demand(model, X):
    return model.predict(X)
