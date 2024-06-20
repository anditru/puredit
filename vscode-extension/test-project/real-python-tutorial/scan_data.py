import polars as pl
from utils import download_file

url = "https://data.wa.gov/api/views/f6w7-q2d2/rows.csv?accessType=DOWNLOAD"
download_file(url, "data/electric_cars.csv")

lazy_car_data = pl.scan_csv("data/electric_cars.csv")
print(lazy_car_data.schema)

lazy_car_query = (lazy_car_data.filter((pl.col("Model Year") >= 2018))
    .filter(
        pl.col("Electric Vehicle Type") == "Battery Electric Vehicle (BEV)"
    )
    .group_by(
        "State",
        "Make"
    )
    .agg(
        pl.mean("Electric Range").alias("Average Electric Range"),
        pl.min("Model Year").alias("Oldest Model Year"),
        pl.len().alias("Number of Cars"),
    )
    .filter(pl.col("Average Electric Range") > 0)
    .filter(pl.col("Number of Cars") > 5)
    .sort(pl.col("Number of Cars"), descending=True)
)

lazy_car_result = lazy_car_query.collect()
print(lazy_car_result)