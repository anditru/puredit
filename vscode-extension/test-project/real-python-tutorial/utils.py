import requests
import pathlib
import numpy as np

def get_buildings_data(num_rows):
    rng = np.random.default_rng(seed=7)
    return {
        "sqft": rng.exponential(scale=1000, size=num_rows),
        "year": rng.integers(low=1995, high=2023, size=num_rows),
        "price": rng.exponential(scale=100_000, size=num_rows),
        "building_type": rng.choice(["A", "B", "C"], size=num_rows)
    }

def download_file(file_url: str, local_file_path: str) -> None:
    local_file = pathlib.Path(local_file_path)
    """Download a file and save it with the specified file name."""
    response = requests.get(file_url)
    if response:
        local_file.write_bytes(response.content)
        print(f"File successfully downloaded and stored at: {local_file_path}")
    else:
        raise requests.exceptions.RequestException(
            f"Failed to download the file. Status code: {response.status_code}"
        )
