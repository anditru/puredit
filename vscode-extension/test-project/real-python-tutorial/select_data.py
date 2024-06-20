import polars as pl
from utils import get_buildings_data

buildings_data = get_buildings_data(500)
buildings = pl.DataFrame(buildings_data)

selection = buildings.select("sqft","year")
print(selection.head(5))

selection = buildings.select(
    pl.col("sqft")
)
print(selection.head(5))

selection = buildings.select(
    pl.col("sqft") / 1000
)
print(selection.head(5))

after_2015 = buildings.filter(
    pl.col("year") > 2015
)
print(selection.head(5))
print(selection.shape)

minimum_after_2015 = after_2015.select(
    pl.min("sqft")
)
print(minimum_after_2015.head(5))