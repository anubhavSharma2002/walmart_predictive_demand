import pandas as pd

sales = pd.read_csv("app/sample_data/sales_train_validation.csv")
calendar = pd.read_csv("app/sample_data/calendar.csv")

days = [f"d_{i}" for i in range(1908, 1914)]

df = sales.melt(id_vars=["item_id", "store_id"], value_vars=days,
                var_name="d", value_name="sales")

calendar_map = calendar.set_index("d")["date"].to_dict()
df["date"] = df["d"].map(calendar_map)

df.rename(columns={
    "store_id": "region",
    "item_id": "product_id"
}, inplace=True)

df = df[["date", "region", "product_id", "sales"]]
df.to_csv("app/sample_data/real_input.csv", index=False)

print("✅ real_input.csv has been created.")
