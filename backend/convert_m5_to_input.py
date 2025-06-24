import pandas as pd

def convert_real_data(sales_path, calendar_path):
    sales = pd.read_csv(sales_path)
    calendar = pd.read_csv(calendar_path)

    day_columns = [col for col in sales.columns if col.startswith("d_")]
    days = day_columns[-7:]

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
    print("✅ Converted real sales data for analysis.")