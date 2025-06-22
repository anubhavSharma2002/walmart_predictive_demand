import pandas as pd

def preprocess_data(df):
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.month
    df["day"] = df["date"].dt.day
    df["weekday"] = df["date"].dt.dayofweek
    df["region"] = df["region"].astype("category").cat.codes
    df["product_id"] = df["product_id"].astype("category").cat.codes
    
    features = ["region", "product_id", "month", "day", "weekday"]
    if "sales" in df.columns:
        features.append("sales")
    return df[["region", "product_id", "month", "day", "weekday"]]
