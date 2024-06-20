# CONTEXT: { "city": "string", "date": "string", "temperature": "number" }
aggregated_weather = weather.pivot(
    index=[
        "date"
    ], columns=[
        "city"
    ], values=[
        "temperature"
    ], aggregate_function="mean"
)

unpivoted_weather = (aggregated_weather.melt(
    id_vars=[
        "date"
    ], value_vars=[
        "city"
    ], variable_name="city", value_name="average_temperature"
)
.drop_nulls())

# CONTEXT: { "first_name": "string", "last_name": "string", "age": "number", "semester": "number" }
filtered_students = (students.select(
        pl.col("firstName").alias("first_name"),
        "age",
        "semester",
        name="last_name"
    )
    .filter(age == 24)
    .drop_nulls()
    .group_by("age")
    .agg(
        "last_name",
        pl.col("semster").avg()
    )
    .rename({"last_name": "LastName"})
    .drop("LastName")
)

# CONTEXT: { "item": "string", "item_price": "number", "quantity": "number" }
extended_prices = prices.with_columns(
    (pl.col("item_pice") + pl.col("quantity")).alias("total_price")
)

# CONTEXT: [ "Batches", "Images", "Channels", "Width", "Height" ]
image_data.transpose(0, 1)

# CONTEXT: [ "Batches", "Images", "Channels", "Width", "Height" ]
image_date.permute(2, 3, 0, 1, 4)

# CONTEXT: { "Batches": 200, "Images": 64, "Channels": 3, "Width": 32, "Height": 32 }
slice_1 = image_data[
    50::2,
    :32:1
]

# CONTEXT: { "Batches": 200, "Images": 64, "Channels": 3, "Width": 32, "Height": 32 }
slice_2 = image_data[
    25:50:2,
    1
]

maximum = torch.max(some_tensor)
result = torch.cat((some_tensor, some_othe), 3)