import polars as pl
from utils import get_buildings_data

buildings_data = get_buildings_data(500)
buildings = pl.DataFrame(buildings_data)

print(f"Schema of buildings dataframe buildings: {buildings.schema}")
buildings.describe()
buildings.head(5)