from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import shutil
import os
import logging
from datetime import datetime, timedelta
import itertools
import requests

from model.train_model import train_model
from app.model import load_model, predict_demand
from convert_m5_to_input import convert_real_data
from generate_future_input import generate_future_data
from app.utils import preprocess_data


app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3000",
    "https://walmart-predictive-demand.vercel.app"
])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs("exports", exist_ok=True)
os.makedirs("app/sample_data", exist_ok=True)

logging.basicConfig(level=logging.DEBUG)

# Store pin-to-coordinates mapping
store_locations = {
    "282001": [27.1767, 78.0081], "143001": [31.633979, 74.872264],
    "431001": [19.876165, 75.343315], "560001": [12.9716, 77.5946],
    "462001": [23.259933, 77.412615], "160017": [30.7333, 76.7794],
    "600001": [13.0827, 80.2707], "641001": [11.0168, 76.9558],
    "110001": [28.6139, 77.2090], "522002": [16.3067, 80.4365],
    "781001": [26.1445, 91.7362], "500001": [17.3850, 78.4867],
    "452001": [22.719568, 75.857728], "144001": [31.3260, 75.5762],
    "302001": [26.9124, 75.7873], "700001": [22.5726, 88.3639],
    "226001": [26.8467, 80.9462], "141001": [30.900965, 75.857276],
    "250001": [28.9845, 77.7064], "400001": [19.0760, 72.8777],
    "440001": [21.1458, 79.0882], "533101": [17.0005, 81.8040],
    "492001": [21.2514, 81.6296], "444601": [20.9333, 77.7513],
    "834001": [23.3441, 85.3099], "520001": [16.5062, 80.6480],
    "530001": [17.6868, 83.2185], "632001": [12.9165, 79.1325],
}

def get_coords_for_store(store_string):
    pincode = str(store_string).split('(')[-1].split(')')[0] if '(' in str(store_string) else str(store_string)
    return store_locations.get(pincode, None)

def get_distance(store_a_string, store_b_string):
    coords = get_coords_for_store(store_a_string), get_coords_for_store(store_b_string)
    if not coords[0] or not coords[1]:
        return 10
    try:
        url = f"http://router.project-osrm.org/route/v1/driving/{coords[0][1]},{coords[0][0]};{coords[1][1]},{coords[1][0]}?overview=false"
        data = requests.get(url).json()
        return data["routes"][0]["distance"] / 1000.0 if "routes" in data and data["routes"] else 10
    except:
        return 10

@app.route("/status")
def status():
    return jsonify({
        "model_trained": os.path.exists("model/trained_model.pkl"),
        "input_ready": os.path.exists("app/sample_data/future_input.csv"),
        "ready": os.path.exists("model/trained_model.pkl") and os.path.exists("app/sample_data/future_input.csv")
    })

@app.route("/predict")
def auto_predict():
    try:
        model = load_model()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)})

    if not os.path.exists("app/sample_data/future_input.csv"):
        return jsonify({"error": "❌ Prediction input not found. Please upload data and train the model first."})

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
    return jsonify(output.to_dict(orient="records"))

@app.route("/meta")
def meta_info():
    df = pd.read_csv("exports/prediction.csv")
    return jsonify({
        "products": df["product_id"].unique().tolist(),
        "regions": df["region"].unique().tolist(),
        "dates": sorted(df["date"].unique().tolist()),
    })

@app.route("/download")
def download():
    return send_file("exports/prediction.csv", as_attachment=True)

@app.route("/upload-data/", methods=["POST"])
def upload_data():
    sales_file = request.files.get("sales_file")
    calendar_file = request.files.get("calendar_file")
    if not sales_file or not calendar_file:
        return jsonify({"error": "❌ Both sales and calendar files are required."})

    sales_path = os.path.join(UPLOAD_DIR, sales_file.filename)
    calendar_path = os.path.join(UPLOAD_DIR, calendar_file.filename)
    sales_file.save(sales_path)
    calendar_file.save(calendar_path)

    try:
        train_model(sales_path, calendar_path)
        convert_real_data(sales_path, calendar_path)
        generate_future_data(sales_path)

        df = pd.read_csv("app/sample_data/future_input.csv")
        df["region_original"] = df["region"]
        df["product_id_original"] = df["product_id"]
        processed = preprocess_data(df)
        df["predicted_demand"] = predict_demand(load_model(), processed)
        df["region"] = df["region_original"]
        df["product_id"] = df["product_id_original"]
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
        df[["date", "region", "product_id", "predicted_demand"]].to_csv("exports/prediction.csv", index=False)

        return jsonify({"message": "✅ Data uploaded, model retrained, and prediction updated successfully."})
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/upload-inventory/", methods=["POST"])
def upload_inventory():
    inventory_file = request.files.get("inventory_file")
    if not inventory_file:
        return jsonify({"error": "No inventory file uploaded."})
    inventory_file.save("uploads/inventory.csv")
    return jsonify({"message": "✅ Inventory uploaded successfully."})

@app.route("/compare")
def compare():
    product_id = request.args.get("product_id", "All")
    region = request.args.get("region", "All")

    if not os.path.exists("exports/prediction.csv"):
        return jsonify({"error": "Prediction data not available"})

    df = pd.read_csv("exports/prediction.csv")
    next_30_days = [(datetime.today() + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(30)]
    df = df[df["date"].isin(next_30_days)]
    if product_id != "All":
        df = df[df["product_id"].astype(str) == str(product_id)]
    if df.empty:
        return jsonify({"error": "No prediction available for selected filters."})

    summary = df.groupby(["product_id", "region"])["predicted_demand"].sum().reset_index()
    inventory_file = "uploads/inventory.csv"
    if not os.path.exists(inventory_file):
        return jsonify({"error": "Inventory data not available. Please upload it first."})
    inventory_df = pd.read_csv(inventory_file)

    results = []
    for _, row in summary.iterrows():
        prediction_pincode = str(row["region"]).split('_')[1] if '_' in row["region"] else row["region"]
        if region != "All" and prediction_pincode != str(region):
            continue
        inv_match = inventory_df[
            (inventory_df["product_id"].astype(str) == str(row["product_id"])) &
            (inventory_df["region"].astype(str).str.contains(prediction_pincode))
        ]
        inventory_count = inv_match["inventory"].sum() if not inv_match.empty else 0
        status = "Overstock" if inventory_count > row["predicted_demand"] else (
            "Understock" if inventory_count < row["predicted_demand"] else "As required"
        )
        stock_end_date = None

        if status == "Understock":
            prediction_subset = df[
                (df["product_id"] == row["product_id"]) &
                (df["region"] == row["region"])
            ].sort_values("date")
            
            stock_left = inventory_count
            for _, pred_row in prediction_subset.iterrows():
                stock_left -= pred_row["predicted_demand"]
                if stock_left <= 0:
                    stock_end_date = pred_row["date"]
                    break

        results.append({
            "product_id": row["product_id"],
            "region": prediction_pincode,
            "sum_predicted": round(row["predicted_demand"], 2),
            "inventory": int(inventory_count),
            "status": status,
            "stock_end_date": stock_end_date  # ✅ Add this
        })


    return jsonify(sorted(results, key=lambda x: x["sum_predicted"], reverse=True))

@app.route("/optimize-transport/", methods=["POST"])
def optimize_transport():
    print("Request received for transport optimization")  # Add this
    stock_file = request.files.get("stock_file")
    cost_rate = float(request.form.get("cost_rate", 0))
    min_quantity = int(request.form.get("min_quantity", 0))

    path = os.path.join("uploads", stock_file.filename)
    stock_file.save(path)

    df = pd.read_csv(path)
    df.columns = [col.strip() for col in df.columns]

    if "Store (Pincode)" in df.columns:
        df["Pincode"] = df["Store (Pincode)"].astype(str).str.strip()
    elif "Store (Region)" in df.columns:
        df["Pincode"] = df["Store (Region)"].apply(lambda x: str(x).split('(')[-1].split(')')[0] if '(' in str(x) else str(x))
    else:
        return jsonify({"error": "Missing store location column."})

    df["Final Stock Count"] = (
        df["Final Stock Count"].astype(str)
        .str.replace('+', '', regex=False)
        .str.replace(',', '', regex=False)
        .str.strip()
    )
    df["Final Stock Count"] = pd.to_numeric(df["Final Stock Count"], errors="coerce").fillna(0).astype(int)

    surplus_rows = df[df["Final Stock Count"] > 0].to_dict(orient="records")
    deficit_rows = df[df["Final Stock Count"] < 0].to_dict(orient="records")

    results = []
    for surplus in surplus_rows:
        surplus_amount = surplus["Final Stock Count"]
        surplus_store = surplus["Pincode"]
        surplus_item = surplus["Product"]
        eligible_deficits = [d for d in deficit_rows if d["Product"] == surplus_item and abs(d["Final Stock Count"]) >= min_quantity]

        best_sequence = None
        best_total_cost = float("inf")
        best_total_distance = None

        for route in itertools.permutations(eligible_deficits):
            total_cost = 0
            total_distance = 0
            available_stock = surplus_amount
            route_sequence = []
            last_location = surplus_store

            for deficit in route:
                units_to_transport = min(available_stock, abs(deficit["Final Stock Count"]))
                if units_to_transport < min_quantity:
                    continue
                distance = get_distance(last_location, deficit["Pincode"])
                cost = units_to_transport * distance * cost_rate
                route_sequence.append({
                    "from_store": last_location,
                    "to_store": deficit["Pincode"],
                    "item": surplus_item,
                    "units": units_to_transport,
                    "distance": round(distance, 2),
                    "cost": round(cost, 2),
                    "time": round(distance * 1.25, 2)
                })
                total_distance += distance
                total_cost += cost
                available_stock -= units_to_transport
                last_location = deficit["Pincode"]
                if available_stock <= 0:
                    break

            if total_cost < best_total_cost and route_sequence:
                best_total_cost = total_cost
                best_total_distance = total_distance
                best_sequence = route_sequence

        if best_sequence:
            results.append({
                "from_store": surplus_store,
                "item": surplus_item,
                "total_distance": round(best_total_distance, 2),
                "total_cost": round(best_total_cost, 2),
                "estimated_total_time": round(sum(r["time"] for r in best_sequence), 2),
                "stops": best_sequence,
            })

    return jsonify(results)

@app.route("/reset", methods=["POST"])
def reset_backend():
    deleted = []
    files_to_remove = [
        "model/trained_model.pkl",
        "app/sample_data/future_input.csv",
        "exports/prediction.csv",
    ]
    for path in files_to_remove:
        if os.path.exists(path):
            os.remove(path)
            deleted.append(path)
    for f in os.listdir("uploads"):
        full_path = os.path.join("uploads", f)
        if os.path.isfile(full_path):
            os.remove(full_path)
            deleted.append(full_path)
    return jsonify({"message": "🧹 Backend reset successfully.", "files_deleted": deleted})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)