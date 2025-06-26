from fastapi import FastAPI, File, UploadFile, Form
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
import itertools
import requests
from fastapi.responses import JSONResponse
import logging

logging.basicConfig(level=logging.DEBUG)

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

import requests
import logging

store_locations = {
    "282001": [27.1767, 78.0081],
    "143001": [31.633979, 74.872264],
    "431001": [19.876165, 75.343315],
    "560001": [12.9716, 77.5946],
    "462001": [23.259933, 77.412615],
    "160017": [30.7333, 76.7794],
    "600001": [13.0827, 80.2707],
    "641001": [11.0168, 76.9558],
    "110001": [28.6139, 77.2090],
    "522002": [16.3067, 80.4365],
    "781001": [26.1445, 91.7362],
    "500001": [17.3850, 78.4867],
    "452001": [22.719568, 75.857728],
    "144001": [31.3260, 75.5762],
    "302001": [26.9124, 75.7873],
    "700001": [22.5726, 88.3639],
    "226001": [26.8467, 80.9462],
    "141001": [30.900965, 75.857276],
    "250001": [28.9845, 77.7064],
    "400001": [19.0760, 72.8777],
    "440001": [21.1458, 79.0882],
    "533101": [17.0005, 81.8040],
    "492001": [21.2514, 81.6296],
    "444601": [20.9333, 77.7513],
    "834001": [23.3441, 85.3099],
    "520001": [16.5062, 80.6480],
    "530001": [17.6868, 83.2185],
    "632001": [12.9165, 79.1325],
}

def get_coords_for_store(store_string):
    """Return [lat, lng] for a given Store (Region) value (extract pincode)."""
    pincode = str(store_string).split('(')[-1].split(')')[0] if '(' in str(store_string) else str(store_string)
    return store_locations.get(pincode, None)

def get_distance(store_a_string, store_b_string):
    """Get road distance using OSRM public API (using pincode as approximation)."""
    coords = get_coords_for_store(store_a_string), get_coords_for_store(store_b_string)

    if not coords[0] or not coords[1]:
        logging.warning(f"No coordinates found for one or both stores: {store_a_string}, {store_b_string}")
        return 10  # Fallback distance

    url = (
        f"http://router.project-osrm.org/route/v1/driving/"
        f"{coords[0][1]},{coords[0][0]};{coords[1][1]},{coords[1][0]}"
        "?overview=false"
    )
    resp = requests.get(url)

    try:
        data = resp.json()
    except Exception as e:
        logging.error(f"Error parsing OSRM response for {store_a_string} -> {store_b_string}: {e}")
        return 10

    logging.debug(f"OSRM Response for {store_a_string} -> {store_b_string}: {data}")

    if "routes" in data and data["routes"]:
        distance = data["routes"][0]["distance"] / 1000.0  # meters -> km
        return distance
    else:
        logging.warning(f"No route found for {store_a_string} -> {store_b_string}. Response: {data}")
        return 10


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
        "dates": sorted(df["date"].unique().tolist()),
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

        if region != "All" and prediction_pincode != str(region):
            continue

        inv_match = inventory_df[
            (inventory_df["product_id"].astype(str) == str(row["product_id"])) &
            (inventory_df["region"].astype(str).str.contains(prediction_pincode))
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


@app.post("/optimize-transport/")
async def optimize_transport(stock_file: UploadFile = File(...),
                             cost_rate: float = Form(...),
                             min_quantity: int = Form(...)):
    """Optimize transportation of surplus units (supports multi-stop routing)."""
    print("\n✅ Route is being called.")
    import re
    import itertools

    path = os.path.join("uploads", stock_file.filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(stock_file.file, f)

    df = pd.read_csv(path)

    #  DEBUG STEP 1: Inspect columns
    print("\n[DEBUG] All columns:", df.columns.tolist())
    for column in df.columns:
        sample_values = df[column].head(5).to_list()
        print(f"[DEBUG] {column} sample:", sample_values)

    #  CLEAN COLUMN NAMES
    df.columns = [col.strip() for col in df.columns]

    required_columns = ["Product", "Final Stock Count"]
    if not all(col in df.columns for col in required_columns):
        return {"error": f"Missing required columns. Found columns: {list(df.columns)}. Required columns: {required_columns}"}

    
    df["Final Stock Count"] = (
        df["Final Stock Count"]
        .astype(str)
        .str.replace('+', '', regex=False)  
        .str.replace(',', '', regex=False)  
        .str.strip()
    )
    df["Final Stock Count"] = pd.to_numeric(df["Final Stock Count"], errors="coerce").fillna(0).astype(int)

    if "Store (Pincode)" in df.columns:
        df["Pincode"] = df["Store (Pincode)"].astype(str).str.strip()
    elif "Store (Region)" in df.columns:
        df["Pincode"] = df["Store (Region)"].apply(
            lambda x: str(x).split('(')[-1].split(')')[0] if '(' in str(x) else str(x)
        )
    else:
        return {"error": "Missing 'Store (Pincode)' or 'Store (Region)' column in the uploaded file."}

    surplus_rows = df[df["Final Stock Count"] > 0].to_dict(orient="records")
    deficit_rows = df[df["Final Stock Count"] < 0].to_dict(orient="records")

    print("\n[DEBUG] Surplus Rows:", surplus_rows)
    print("[DEBUG] Deficit Rows:", deficit_rows)

    results = []
    for surplus in surplus_rows:
        surplus_amount = surplus["Final Stock Count"]
        surplus_store = surplus["Pincode"]
        surplus_item = surplus["Product"]

        eligible_deficits = [
            d for d in deficit_rows
            if d["Product"] == surplus_item and abs(d["Final Stock Count"]) >= min_quantity
        ]

        print("\n[DEBUG] Surplus:", surplus_item, surplus_store, surplus_amount)
        print("[DEBUG] Eligible Deficits:", [
            (d["Product"], d["Pincode"], d["Final Stock Count"])
            for d in eligible_deficits
        ])

        if not eligible_deficits:
            continue

        best_sequence = None
        best_total_cost = float("inf")
        best_total_distance = None

        for route in itertools.permutations(eligible_deficits):
            total_cost = 0
            total_distance = 0
            total_time = 0
            available_stock = surplus_amount
            route_sequence = []
            last_location = surplus_store

            for deficit in route:
                units_needed = abs(deficit["Final Stock Count"])
                units_to_transport = min(available_stock, units_needed)

                if units_to_transport < min_quantity:
                    continue

                distance = get_distance(last_location, deficit["Pincode"])
                cost = units_to_transport * distance * cost_rate
                time_in_minutes = distance * 1.25

                route_sequence.append({
                    "from_store": last_location,
                    "to_store": deficit["Pincode"],
                    "item": surplus_item,
                    "units": units_to_transport,
                    "distance": round(distance, 2),
                    "cost": round(cost, 2),
                    "time": round(time_in_minutes, 2),
                })

                total_distance += distance
                total_cost += cost
                total_time += time_in_minutes
                available_stock -= units_to_transport
                last_location = deficit["Pincode"]

                if available_stock <= 0:
                    break

            if total_cost < best_total_cost and route_sequence:
                best_total_cost = total_cost
                best_total_distance = total_distance
                best_sequence = route_sequence

        if best_sequence and len(best_sequence) > 0:
            results.append({
                "from_store": surplus_store,
                "item": surplus_item,
                "total_distance": round(best_total_distance, 2),
                "total_cost": round(best_total_cost, 2),
                "estimated_total_time": round(sum(r["time"] for r in best_sequence), 2),
                "stops": best_sequence,
            })

    return results
