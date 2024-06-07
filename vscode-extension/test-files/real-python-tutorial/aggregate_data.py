import polars as pl
from utils import get_buildings_data

buildings_data = get_buildings_data(500)
buildings = pl.DataFrame(buildings_data)

building_types = (buildings.group_by("building_type")
.agg(
    pl.mean("sqft").alias("mean_sqft"),
    pl.median("year").alias("median_year"),
    pl.len()
))
print(building_types)
