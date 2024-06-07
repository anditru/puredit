import numpy as np
import polars as pl
import pandas as pd
import pathlib
from downloads import download_file

# Create a data frame
print("=========== Create a dataframe ===========")
num_rows = 5000
rng = np.random.default_rng(seed=7)

buildings_data = {
    "sqft": rng.exponential(scale=1000, size=num_rows),
    "year": rng.integers(low=1995, high=2023, size=num_rows),
    "price": rng.exponential(scale=100_000, size=num_rows),
    "building_type": rng.choice(["A", "B", "C"], size=num_rows)
}

buildings = pl.DataFrame(buildings_data)
print(buildings)

# Inspect a dataframe
print("\n=========== Inspect a dataframe ===========")
print(buildings.schema)
buildings.describe()
buildings.head(5)

# Select data
print("\n=========== Select data ===========")
sqft_column = buildings.select(
    "sqft"
)
print(sqft_column)

sqft_column_2 = buildings.select(
    pl.col("sqft")
)
print(sqft_column_2)

sqft_column_3 = buildings.select(
    pl.col("sqft") / 1000
)
print(sqft_column_3)

after_2015 = buildings.filter(
    pl.col("year") > 2015
)
print(after_2015)
print(after_2015.shape)

minimum_after_2015 = after_2015.select(
    pl.col("year").min()
)
print(minimum_after_2015)

# Aggregate data
print("\n=========== Aggregate data ===========")
building_types = (buildings.group_by("building_type")
.agg(
    pl.mean("sqft").alias("mean_sqft"),
    pl.median("year").alias("median_year"),
    pl.len()
))
print(building_types)

# LazyFrames
print("\n=========== LazyFrames ===========")
buildings_lazy = pl.LazyFrame(buildings_data)


print(lazy_query.show_graph())
print(lazy_query.explain())

lazy_result = (lazy_query.collect()
    .select(pl.col("price_per_sqft", "year"))
    .describe())

# Scan data
print("\n=========== Scan data ===========")
url = "https://data.wa.gov/api/views/f6w7-q2d2/rows.csv?accessType=DOWNLOAD"
local_file_path = pathlib.Path("data/lectric_cars.csv")
download_file(url, local_file_path)

lazy_car_data = pl.scan_csv("data/lectric_cars.csv")
lazy_car_data.schema

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

# Seamless integration
print("\n=========== Seamless integration ===========")
buildings.write_csv("data/buildings.csv")
buildings.write_ndjson("data/buildings.json")

data_csv = pl.read_csv("data/buildings.csv")
data_csv_lazy = pl.scan_csv("data/buildings.csv")
print(data_csv_lazy.schema)

data_json = pl.read_ndjson("data/buildings.json")
data_json_lazy = pl.scan_ndjson("data/buildings.json")
print(data_json_lazy.schema)

# Integration with the Python ecosystem
print("\n=========== Integration with the Python ecosystem ===========")
polars_data = pl.DataFrame({
    "A": [1, 2, 3, 4, 5],
    "B": [6, 7, 8, 9, 10]
})

pandas_data = pd.DataFrame({
    "A": [1, 2, 3, 4, 5],
    "B": [6, 7, 8, 9, 10]
})

numpy_data = np.array([
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10]
]).T

pl.from_pandas(pandas_data)
pl.from_numpy(numpy_data, schema={"A": pl.Int64, "B": pl.Int64})
polars_data.to_pandas()
polars_data.to_numpy()