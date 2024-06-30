import torch
import polars as pl
from tutorial.utils import download_file, get_image_data

download_file("https://corgis-edu.github.io/corgis/datasets/csv/weather/weather.csv", "data/weather.csv")
weather_data = pl.read_csv("data/weather.csv")
print(weather_data)

aggregated_weather = (weather_data.pivot(
    index=[
        "Date.Full"
    ], columns=[
        "Station.City"
    ], values=[
        "Data.Temperature.Avg Temp"
    ], aggregate_function="mean"
)
.drop_nulls())
print(aggregated_weather)

melted_weather = (weather_data.melt(
    id_vars=[
        "Station.City",
        "Date.Full"
    ], value_vars=[
        "Data.Temperature.Min Temp",
        "Data.Temperature.Max Temp",
        "Data.Temperature.Avg Temp"
    ], variable_name="Temperature Variant", value_name="Value"
))
print(melted_weather)

transformed_weather = (weather_data.select(
        pl.col("Date.Full").alias("date"),
        pl.col("Data.Temperature.Max Temp").alias("max_temperature"),
        "Station.City",
        year="Date.Year"
    )
    .drop_nulls()
    .filter(pl.col("year") > 2015)
    .group_by("Station.City")
    .agg(
        pl.max("max_temperature")
    )
    .rename({"Station.City": "city"})
    .sort("max_temperature", descending=True)
)
print(transformed_weather)

image_data = get_image_data()
print(image_data.shape)

# CONTEXT: [ "Batch", "Image", "Gray Scale Value", "Width", "Height" ]
transposed = image_data.transpose(0, 1)
print(transposed.shape)

# CONTEXT: [ "Batch", "Image", "Gray Scale Value", "Width", "Height" ]
permuted = image_data.permute(2, 3, 0, 1, 4)
print(permuted.shape)

# CONTEXT: { "Batch": 10, "Image": 1000, "Gray Scale Value": 1, "Width": 28, "Height": 28 }
slice_1 = image_data[
    5::2,
    :32:1
]
print(slice_1.shape)

#CONTEXT: { "Batch": 10, "Image": 1000, "Gray Scale Value": 1, "Width": 28, "Height": 28 }
slice_2 = image_data[
    2:9:2,
    1
]
print(slice_2.shape)

maximum = torch.max(image_data)
print(maximum)

result = torch.cat((image_data, image_data), 0)
print(result.shape)