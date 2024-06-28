import polars as pl
from utils import get_buildings_data

buildings_data = get_buildings_data(500)
buildings_lazy = pl.LazyFrame(buildings_data)

lazy_query = (
   buildings_lazy
   .with_columns(
       (pl.col("price") / pl.col("sqft")).alias("price_per_sqft")
   )
   .filter(pl.col("price_per_sqft") > 100)
   .filter(pl.col("year") < 2010)
)
lazy_query.show_graph()
print(lazy_query.explain())

lazy_result = (lazy_query.collect()
    .select(pl.col("price_per_sqft"), "year")
    .describe())