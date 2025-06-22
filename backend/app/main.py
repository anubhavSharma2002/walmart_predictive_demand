from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware 
import pandas as pd
from .model import load_model, predict_demand
from .utils import preprocess_data
import os

os.makedirs("exports", exist_ok=True)

app = FastAPI()
model = load_model()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/predict")
def auto_predict():
    df = pd.read_csv("app/sample_data/future_input.csv")
    df["region_original"] = df["region"]
    df["product_id_original"] = df["product_id"]

    processed = preprocess_data(df)
    df["predicted_demand"] = predict_demand(model, processed)

    df["region"] = df["region_original"]
    df["product_id"] = df["product_id_original"]
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")

    output = df[["date", "region", "product_id", "predicted_demand"]]
    output.to_csv("exports/prediction.csv", index=False)

    return output.to_dict(orient="records")

@app.get("/meta")
def meta_info():
    df = pd.read_csv("exports/prediction.csv")
    return {
        "products": df["product_id"].unique().tolist(),
        "regions": df["region"].unique().tolist(),
        "dates": sorted(df["date"].unique().tolist())
    }

@app.get("/download")
def download():
    return FileResponse("exports/prediction.csv", filename="predicted_demand.csv", media_type="text/csv")
