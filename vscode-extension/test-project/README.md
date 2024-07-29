# Puredit Test Project

This test project contains a series of Python scripts to test the Puredit projectional editor as well as a set of declarative projections defined in JSON and YAML files.

All Python scripts are executable if they are executed **from the root folder** of this project and the required dependencies are installed.

## Project Structure

- `data/`: Folder to store data files required by the Python scripts.
- `declarative-projections/`: Contains declarative projections for Polars and Python defined in YAML and JSON.
- `tutorial/`: Contains Python scripts from the [Polars tutorial on realpython.com](https://realpython.com/polars-python/) to test projections.
- `test-file.py`: Sample file using Polars on a weather dataset to test projections.

## Setup instructions for the Python scripts

- Create a virtual environment: `python -m venv ./venv `
- Activate the virtual environment: `source venv/bin/activate`
- Install the dependencies: `python -m pip install -r requirements.txt`
- Run a script: `python tutorial/aggregate_data.py`
