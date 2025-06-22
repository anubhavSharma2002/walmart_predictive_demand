import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os


sales = pd.read_csv("app/sample_data/sales_train_validation.csv")
calendar = pd.read_csv("app/sample_data/calendar.csv")


days = [f"d_{i}" for i in range(1907, 1914)]  # last 7 days in training data


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
