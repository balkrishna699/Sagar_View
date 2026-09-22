import numpy as np
import xarray as xr
from pathlib import Path


def generate_dataset():

    # ==================================================
    # GRID
    # ==================================================

    latitudes = np.linspace(5, 25, 41)
    longitudes = np.linspace(65, 85, 41)

    depths = np.array([
        0,
        100,
        250,
        500,
        750,
        1000,
        1500,
        2000,
        2500,
        3000,
        3500,
        4000,
        4500,
        5000
    ])

    times = np.array(
        ["2026-09-20T12:00:00"],
        dtype="datetime64[ns]"
    )

    # ==================================================
    # CREATE 4D GRID
    # ==================================================

    time_grid, depth_grid, lat_grid, lon_grid = np.meshgrid(
        times,
        depths,
        latitudes,
        longitudes,
        indexing="ij"
    )

    # ==================================================
    # TEMPERATURE
    # ==================================================

    temperature = (
        28
        - 0.006 * depth_grid
        + 1.5 * np.sin(np.radians(lat_grid))
        + 0.5 * np.cos(np.radians(lon_grid))
    )

    temperature += (
        0.3
        * np.sin(np.radians(lat_grid * 3))
        * np.cos(np.radians(lon_grid * 2))
    )

    # ==================================================
    # SALINITY
    # ==================================================

    salinity = (
        34.5
        + 0.00008 * depth_grid
        + 0.2 * np.sin(np.radians(lat_grid))
        + 0.05 * np.cos(np.radians(lon_grid))
    )

    # ==================================================
    # U CURRENT
    # ==================================================

    u_current = (
        0.3
        * np.sin(np.radians(lat_grid * 2))
        * np.exp(-depth_grid / 2000)
    )

    # ==================================================
    # V CURRENT
    # ==================================================

    v_current = (
        0.25
        * np.cos(np.radians(lon_grid * 2))
        * np.exp(-depth_grid / 1800)
    )

    # ==================================================
    # CREATE XARRAY DATASET
    # ==================================================

    dataset = xr.Dataset(

        data_vars={

            "TEMP": (
                ["TIME", "DEPTH", "LAT", "LON"],
                temperature.astype(np.float32),
                {
                    "units": "degC",
                    "long_name": "Synthetic seawater temperature"
                }
            ),

            "SALN": (
                ["TIME", "DEPTH", "LAT", "LON"],
                salinity.astype(np.float32),
                {
                    "units": "PSU",
                    "long_name": "Synthetic seawater salinity"
                }
            ),

            "UVEL": (
                ["TIME", "DEPTH", "LAT", "LON"],
                u_current.astype(np.float32),
                {
                    "units": "m/s",
                    "long_name": "Synthetic eastward current"
                }
            ),

            "VVEL": (
                ["TIME", "DEPTH", "LAT", "LON"],
                v_current.astype(np.float32),
                {
                    "units": "m/s",
                    "long_name": "Synthetic northward current"
                }
            )
        },

        coords={

            "TIME": times,

            "DEPTH": (
                "DEPTH",
                depths,
                {
                    "units": "meters",
                    "positive": "down"
                }
            ),

            "LAT": (
                "LAT",
                latitudes,
                {
                    "units": "degrees_north"
                }
            ),

            "LON": (
                "LON",
                longitudes,
                {
                    "units": "degrees_east"
                }
            )
        },

        attrs={
            "source": "Synthetic",
            "dataset_name": "Synthetic Deep Ocean Prototype Dataset",
            "description": (
                "Synthetic deep-ocean data generated "
                "for 3D prototype visualization. "
                "Values are not real observations."
            ),
            "synthetic": "true"
        }
    )

    return dataset


def main():

    output_directory = Path("datasets")

    output_directory.mkdir(
        exist_ok=True
    )

    output_file = (
        output_directory
        / "synthetic_deep_ocean_5000m.nc"
    )

    dataset = generate_dataset()

    dataset.to_netcdf(output_file)

    print("Synthetic deep-ocean dataset created.")
    print(f"File: {output_file}")

    print()
    print("Dimensions:")
    print(dataset.sizes)

    print()
    print("Depth range:")
    print(
        f"{dataset.DEPTH.min().item()} m "
        f"to "
        f"{dataset.DEPTH.max().item()} m"
    )

    print()
    print("Variables:")
    print(list(dataset.data_vars))

    print()
    print("IMPORTANT:")
    print(
        "This dataset contains SYNTHETIC values "
        "for prototype visualization."
    )


if __name__ == "__main__":
    main()