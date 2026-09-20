import numpy as np
import xarray as xr


# Number of synthetic Argo profiles
num_profiles = 5

# Maximum number of measurements per profile
num_levels = 10


# Profile locations
latitude = np.array([
    10.03,
    10.50,
    11.00,
    11.50,
    12.00
], dtype=np.float32)

longitude = np.array([
    70.04,
    70.50,
    71.00,
    71.50,
    72.00
], dtype=np.float32)


# Observation time for each profile
juld = np.array([
    "2026-09-20T00:00:00",
    "2026-09-20T06:00:00",
    "2026-09-20T12:00:00",
    "2026-09-20T18:00:00",
    "2026-09-21T00:00:00"
], dtype="datetime64[ns]")


# Pressure levels in dbar
pressure = np.array([
    0,
    10,
    20,
    50,
    100,
    200,
    300,
    400,
    500,
    600
], dtype=np.float32)


# Create synthetic temperature profiles
temperature = np.array([
    [29.0, 28.8, 28.5, 27.8, 26.5, 24.0, 21.5, 19.5, 18.0, 16.5],
    [28.9, 28.7, 28.4, 27.7, 26.4, 23.9, 21.4, 19.4, 17.9, 16.4],
    [28.8, 28.6, 28.3, 27.6, 26.3, 23.8, 21.3, 19.3, 17.8, 16.3],
    [28.7, 28.5, 28.2, 27.5, 26.2, 23.7, 21.2, 19.2, 17.7, 16.2],
    [28.6, 28.4, 28.1, 27.4, 26.1, 23.6, 21.1, 19.1, 17.6, 16.1]
], dtype=np.float32)


# Create synthetic salinity profiles
salinity = np.array([
    [35.1, 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8, 35.9],
    [35.1, 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8, 35.9],
    [35.0, 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8, 35.9],
    [35.0, 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8, 35.9],
    [35.0, 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8, 35.9]
], dtype=np.float32)


# Build an Argo-like xarray Dataset
ds = xr.Dataset(
    data_vars={
        "PRES": (
            ("N_PROF", "N_LEVELS"),
            np.tile(pressure, (num_profiles, 1))
        ),

        "TEMP": (
            ("N_PROF", "N_LEVELS"),
            temperature
        ),

        "PSAL": (
            ("N_PROF", "N_LEVELS"),
            salinity
        ),
    },

    coords={
        "LATITUDE": ("N_PROF", latitude),
        "LONGITUDE": ("N_PROF", longitude),
        "JULD": ("N_PROF", juld),
    },

    attrs={
        "title": "Synthetic Argo Demonstration Dataset",
        "source": "Synthetic data generated for prototype demonstration",
        "Conventions": "Argo-like structure",
        "warning": "This dataset contains synthetic data and is not real oceanographic observations."
    }
)


# Add variable metadata
ds["PRES"].attrs = {
    "long_name": "Sea water pressure",
    "units": "dbar"
}

ds["TEMP"].attrs = {
    "long_name": "Sea water temperature",
    "units": "degree_Celsius"
}

ds["PSAL"].attrs = {
    "long_name": "Practical salinity",
    "units": "psu"
}

ds["LATITUDE"].attrs = {
    "long_name": "Profile latitude",
    "units": "degrees_north"
}

ds["LONGITUDE"].attrs = {
    "long_name": "Profile longitude",
    "units": "degrees_east"
}

ds["JULD"].attrs = {
    "long_name": "Julian observation date"
}


# Save the dataset
output_file = "datasets/synthetic_argo_demo.nc"

ds.to_netcdf(output_file)

print(f"Synthetic Argo dataset created: {output_file}")
print()
print(ds)