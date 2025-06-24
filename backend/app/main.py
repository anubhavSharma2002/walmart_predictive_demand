from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import shutil
import os

from model.train_model import train_model
from generate_future_input import generate_future_data
from convert_m5_to_input import convert_real_data
from app.model import load_model, predict_demand
from app.utils import preprocess_data

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs("exports", exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/predict")
def auto_predict():
    try:
        model = load_model()
    except FileNotFoundError as e:
        return {"error": str(e)}
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


@app.post("/upload-data/")
async def upload_data(sales_file: UploadFile = File(...), calendar_file: UploadFile = File(...)):
    sales_path = os.path.join(UPLOAD_DIR, sales_file.filename)
    calendar_path = os.path.join(UPLOAD_DIR, calendar_file.filename)

    with open(sales_path, "wb") as s:
        shutil.copyfileobj(sales_file.file, s)
    with open(calendar_path, "wb") as c:
        shutil.copyfileobj(calendar_file.file, c)

    try:
        train_model(sales_path, calendar_path)

        convert_real_data(sales_path, calendar_path)

        generate_future_data(sales_path)

        model = load_model()
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

        return {"message": "✅ Data uploaded, model retrained, and prediction updated successfully."}

    except Exception as e:
        return {"error": str(e)}
