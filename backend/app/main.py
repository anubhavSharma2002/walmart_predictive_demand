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
from datetime import datetime, timedelta

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
    

@app.get("/compare")
def compare(product_id: str = "All", region: str = "All"):
    prediction_file = "exports/prediction.csv"
    if not os.path.exists(prediction_file):
        return {"error": "Prediction data not available"}

    df = pd.read_csv(prediction_file)

    today = datetime.today()
    next_7_days = [(today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]

    future_df = df[df["date"].isin(next_7_days)]

    if product_id != "All":
        future_df = future_df[future_df["product_id"].astype(str) == str(product_id)]

    if future_df.empty:
        return {"error": f"No prediction available for selected filter(s) in the next 7 days."}

    summary = future_df.groupby(["product_id", "region"])["predicted_demand"].sum().reset_index()
    summary.columns = ["product_id", "region", "sum_predicted"]

    inventory_file = "uploads/inventory.csv"
    if not os.path.exists(inventory_file):
        return {"error": "Inventory data not available. Please upload it first."}
    inventory_df = pd.read_csv(inventory_file)

    results = []
    for _, row in summary.iterrows():
        prediction_region = str(row["region"])
        prediction_pincode = prediction_region.split('_')[1] if '_' in prediction_region else prediction_region

        if region != "All" and prediction_pincode != region:
            continue

        inv_match = inventory_df[
            (inventory_df["product_id"].astype(str) == str(row["product_id"]))
            & (inventory_df["region"].astype(str).str.contains(prediction_pincode))
        ]
        inventory_count = inv_match["inventory"].sum() if not inv_match.empty else 0

        status = (
            "Overstock" if inventory_count > row["sum_predicted"]
            else "Understock" if inventory_count < row["sum_predicted"]
            else "As required"
        )
        results.append({
            "product_id": row["product_id"],
            "region": prediction_pincode,
            "sum_predicted": round(row["sum_predicted"], 2),
            "inventory": int(inventory_count),
            "status": status
        })

    results = sorted(results, key=lambda x: x["sum_predicted"], reverse=True)

    return results



@app.post("/upload-inventory/")
async def upload_inventory(inventory_file: UploadFile = File(...)):
    path = os.path.join(UPLOAD_DIR, "inventory.csv")
    with open(path, "wb") as f:
        shutil.copyfileobj(inventory_file.file, f)

    return {"message": "✅ Inventory uploaded successfully."}