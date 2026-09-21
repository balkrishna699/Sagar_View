import json
import netCDF4
import numpy as np


# --------------------------------------------------
# FILE PATHS
# --------------------------------------------------

INPUT_FILE = "public/data/synthetic_deep_ocean_5000m.nc"

OUTPUT_FILE = "public/data/ocean_grid.json"


# --------------------------------------------------
# OPEN NETCDF FILE
# --------------------------------------------------

print("Opening NetCDF file...")

ds = netCDF4.Dataset(INPUT_FILE, "r")

print("NetCDF file opened successfully.")


# --------------------------------------------------
# READ GRID COORDINATES
# --------------------------------------------------

time = ds.variables["TIME"][:]

depth = ds.variables["DEPTH"][:]

latitude = ds.variables["LAT"][:]

longitude = ds.variables["LON"][:]


print()
print("Grid:")
print("TIME:", len(time))
print("DEPTH:", len(depth))
print("LAT:", len(latitude))
print("LON:", len(longitude))


# --------------------------------------------------
# READ OCEAN VARIABLES
# --------------------------------------------------

temperature = ds.variables["TEMP"][:]

salinity = ds.variables["SALN"][:]

u_current = ds.variables["UVEL"][:]

v_current = ds.variables["VVEL"][:]


print()
print("Variables loaded:")
print("Temperature shape:", temperature.shape)
print("Salinity shape:", salinity.shape)
print("U current shape:", u_current.shape)
print("V current shape:", v_current.shape)


# --------------------------------------------------
# CONVERT NUMPY ARRAYS TO NORMAL PYTHON LISTS
# --------------------------------------------------

temperature = temperature.tolist()

salinity = salinity.tolist()

u_current = u_current.tolist()

v_current = v_current.tolist()


# --------------------------------------------------
# CREATE STANDARD DATA STRUCTURE
# --------------------------------------------------

ocean_data = {

    "schema_version": "1.0",

    "source": {
        "file": "synthetic_deep_ocean_5000m.nc",
        "description": "Synthetic deep ocean dataset"
    },

    "dimensions": {
        "time": len(time),
        "depth": len(depth),
        "latitude": len(latitude),
        "longitude": len(longitude)
    },

    "grid": {

        "time": time.tolist(),

        "depth": depth.tolist(),

        "latitude": latitude.tolist(),

        "longitude": longitude.tolist()

    },

    "variables": {

        "temperature": temperature,

        "salinity": salinity,

        "u_current": u_current,

        "v_current": v_current

    }

}


# --------------------------------------------------
# WRITE JSON FILE
# --------------------------------------------------

print()
print("Writing JSON file...")


with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        ocean_data,
        file,
        indent=2,
        allow_nan=False
    )


# --------------------------------------------------
# CLOSE NETCDF
# --------------------------------------------------

ds.close()


print()
print("SUCCESS!")
print()
print("Created:")
print(OUTPUT_FILE)