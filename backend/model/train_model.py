import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

def train_model(sales_path, calendar_path):
    sales = pd.read_csv(sales_path)
    calendar = pd.read_csv(calendar_path)

    day_columns = [col for col in sales.columns if col.startswith("d_")]
    days = day_columns[-7:]  # adjust range as needed

    df = sales.melt(id_vars=["item_id", "store_id"], value_vars=days,
                    var_name="d", value_name="sales")

    calendar_map = calendar.set_index("d")[["date"]].to_dict()["date"]
    df["date"] = df["d"].map(calendar_map)
    df["date"] = pd.to_datetime(df["date"])

    df["month"] = df["date"].dt.month
    df["day"] = df["date"].dt.day
    df["weekday"] = df["date"].dt.dayofweek
    df["region"] = df["store_id"].astype("category").cat.codes
    df["product_id"] = df["item_id"].astype("category").cat.codes

    X = df[["region", "product_id", "month", "day", "weekday"]]
    y = df["sales"]

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    os.makedirs("model", exist_ok=True)
    joblib.dump(model, "model/trained_model.pkl")
    print("✅ Model trained and saved.")
