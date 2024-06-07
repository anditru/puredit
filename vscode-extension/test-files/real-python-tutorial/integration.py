import numpy as np
import polars as pl
import pandas as pd
from utils import get_buildings_data

buildings_data = get_buildings_data(500)
buildings = pl.DataFrame(buildings_data)

# File formats
buildings.write_csv("data/buildings.csv")
buildings.write_ndjson("data/buildings.json")

data_csv = pl.read_csv("data/buildings.csv")
data_csv_lazy = pl.scan_csv("data/buildings.csv")
print(data_csv_lazy.schema)

data_json = pl.read_ndjson("data/buildings.json")
data_json_lazy = pl.scan_ndjson("data/buildings.json")
print(data_json_lazy.schema)

# Python ecosystem/other libraries
polars_data = pl.DataFrame({
    "A": [1, 2, 3, 4, 5],
    "B": [6, 7, 8, 9, 10]
})
polars_data.to_pandas()
polars_data.to_numpy()

pandas_data = pd.DataFrame({
    "A": [1, 2, 3, 4, 5],
    "B": [6, 7, 8, 9, 10]
})
pandas_df = pl.from_pandas(pandas_data)

numpy_data = np.array([
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10]
]).T
numpy_df = pl.from_numpy(numpy_data, schema={"A": pl.Int64, "B": pl.Int64})

