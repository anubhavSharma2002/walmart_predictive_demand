import joblib

def load_model():
    return joblib.load("model/trained_model.pkl")

def predict_demand(model, df):
    return model.predict(df)
