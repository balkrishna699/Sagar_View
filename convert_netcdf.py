"""
Person 2 — NetCDF to JSON Converter

Adapted from Person 2's `person2-instruments` branch.
Converts NetCDF ocean data files (.nc) to the JSON format
that the frontend can load directly.

Usage:
    python convert_netcdf.py <input.nc> [output.json]

If output is not specified, writes to <input>_grid.json

Requirements:
    pip install netCDF4 numpy

Output format matches DATA_CONTRACT.md:
    {
        "schema_version": "1.0",
        "grid": { "time": [...], "depth": [...], "latitude": [...], "longitude": [...] },
        "variables": {
            "temperature": [time][depth][lat][lon],
            "salinity": [time][depth][lat][lon],
            "u_current": [time][depth][lat][lon],
            "v_current": [time][depth][lat][lon]
        }
    }
"""

import json
import sys
import os

import netCDF4
import numpy as np


# Variable name mapping: NetCDF name → output name
VARIABLE_MAP = {
    "TEMP": "temperature",
    "temperature": "temperature",
    "temp": "temperature",

    "SALN": "salinity",
    "salinity": "salinity",
    "salt": "salinity",

    "UVEL": "u_current",
    "u_current": "u_current",
    "u": "u_current",

    "VVEL": "v_current",
    "v_current": "v_current",
    "v": "v_current",
}

COORDINATE_MAP = {
    "TIME": "time",
    "time": "time",

    "DEPTH": "depth",
    "depth": "depth",
    "lev": "depth",

    "LAT": "latitude",
    "latitude": "latitude",
    "lat": "latitude",

    "LON": "longitude",
    "longitude": "longitude",
    "lon": "longitude",
}


def find_variable(ds, candidates):
    """Find first matching variable name in the dataset."""
    for name in candidates:
        if name in ds.variables:
            return name
    return None


def convert_netcdf(input_file, output_file=None):
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        sys.exit(1)

    if output_file is None:
        base = os.path.splitext(input_file)[0]
        output_file = f"{base}_grid.json"

    print(f"Opening NetCDF file: {input_file}")
    ds = netCDF4.Dataset(input_file, "r")

    # Read coordinates
    grid = {}
    for nc_name, out_name in COORDINATE_MAP.items():
        if nc_name in ds.variables and out_name not in grid:
            values = ds.variables[nc_name][:]
            grid[out_name] = np.nan_to_num(values, nan=0.0).tolist()
            print(f"  {out_name}: {len(grid[out_name])} values")

    # Read variables
    variables = {}
    for nc_name, out_name in VARIABLE_MAP.items():
        if nc_name in ds.variables and out_name not in variables:
            data = ds.variables[nc_name][:]
            # Replace NaN/masked with 0.0 for JSON compatibility
            if hasattr(data, 'filled'):
                data = data.filled(0.0)
            data = np.nan_to_num(data, nan=0.0)
            variables[out_name] = data.tolist()
            print(f"  {out_name}: shape {data.shape}")

    ds.close()

    # Assemble output
    ocean_data = {
        "schema_version": "1.0",
        "source": {
            "file": os.path.basename(input_file),
            "description": f"Converted from {os.path.basename(input_file)}",
        },
        "dimensions": {k: len(v) for k, v in grid.items()},
        "grid": grid,
        "variables": variables,
    }

    print(f"\nWriting JSON: {output_file}")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(ocean_data, f, indent=2, allow_nan=False)

    size_mb = os.path.getsize(output_file) / (1024 * 1024)
    print(f"Done! Output: {output_file} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_netcdf.py <input.nc> [output.json]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    convert_netcdf(input_path, output_path)
