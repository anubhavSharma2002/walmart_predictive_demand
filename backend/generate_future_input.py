import pandas as pd
from datetime import datetime, timedelta

sales = pd.read_csv("app/sample_data/sales_train_validation.csv")
products = sales["item_id"].unique()
stores = sales["store_id"].unique()

start_date = datetime(2016, 3, 25)
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
