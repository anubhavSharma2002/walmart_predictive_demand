import pandas as pd
from datetime import datetime, timedelta

def generate_future_data(sales_path):
    sales = pd.read_csv(sales_path)
    products = sales["item_id"].unique()
    stores = sales["store_id"].unique()

    day_columns = [col for col in sales.columns if col.startswith("d_")]
    last_day_col = day_columns[-1]

    calendar_df = pd.read_csv("uploads/calendar.csv")
    calendar_map = calendar_df.set_index("d")["date"].to_dict()
    last_date_str = calendar_map.get(last_day_col)
    start_date = datetime.strptime(last_date_str, "%Y-%m-%d")

    future_dates = [start_date + timedelta(days=i) for i in range(60)]

    data = []
    for date in future_dates:
        for store in stores:
            for product in products:
                data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "region": store,
                    "product_id": product
                })

    df = pd.DataFrame(data)
    df.to_csv("app/sample_data/future_input.csv", index=False)
    print("✅ Created future_input.csv with full date-product-store coverage.")
