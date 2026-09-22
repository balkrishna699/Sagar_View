import json
from pathlib import Path

from parsers.syntheticdeepoceanparser import (
    SyntheticDeepOceanParser
)


def main():

    # ==================================================
    # CREATE PARSER
    # ==================================================

    parser = SyntheticDeepOceanParser(
        "datasets/synthetic_deep_ocean_5000m.nc"
    )

    # ==================================================
    # REQUEST 3D REGION
    # ==================================================

    data = parser.get_3d_region_data(
        min_lat=10,
        max_lat=15,
        min_lon=70,
        max_lon=75,
        min_depth=0,
        max_depth=5000,
        time="2026-09-20T12:00:00"
    )

    # ==================================================
    # ADD METADATA
    # ==================================================

    output = {

        "schema_version": "1.0",

        "source": "Synthetic",

        "dataset_name": (
            "Synthetic Deep Ocean "
            "Prototype Dataset"
        ),

        "description": (
            "Synthetic 3D ocean data generated "
            "for prototype visualization. "
            "Values are not real ocean observations."
        ),

        "synthetic": True,

        "coordinate_conventions": {
            "latitude": "degrees_north",
            "longitude": "degrees_east",
            "depth": "meters",
            "depth_positive": "down"
        },

        "region": {
            "min_latitude": 10,
            "max_latitude": 15,
            "min_longitude": 70,
            "max_longitude": 75,
            "min_depth": 0,
            "max_depth": 5000
        },

        "time": data["time"],

        "latitude": data["latitude"],

        "longitude": data["longitude"],

        "depth": data["depth"],

        "temperature": data["temperature"],

        "salinity": data["salinity"],

        "u_current": data["u_current"],

        "v_current": data["v_current"]
    }

    # ==================================================
    # CREATE OUTPUT DIRECTORY
    # ==================================================

    output_directory = Path("examples")

    output_directory.mkdir(
        exist_ok=True
    )

    output_file = (
        output_directory
        / "synthetic_3d_ocean_sample.json"
    )

    # ==================================================
    # WRITE JSON
    # ==================================================

    with open(
        output_file,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            output,
            file,
            indent=2,
            allow_nan=False
        )

    # ==================================================
    # SUMMARY
    # ==================================================

    print(
        "3D sample JSON created successfully."
    )

    print(
        f"File: {output_file}"
    )

    print()

    print(
        "Latitude points:",
        len(data["latitude"])
    )

    print(
        "Longitude points:",
        len(data["longitude"])
    )

    print(
        "Depth levels:",
        len(data["depth"])
    )

    print(
        "Total grid points:",
        (
            len(data["latitude"])
            * len(data["longitude"])
            * len(data["depth"])
        )
    )

    print()

    print(
        "Variables:"
    )

    print(
        " - temperature"
    )

    print(
        " - salinity"
    )

    print(
        " - u_current"
    )

    print(
        " - v_current"
    )

    print()

    print(
        "IMPORTANT:"
    )

    print(
        "This JSON contains SYNTHETIC "
        "prototype data."
    )


if __name__ == "__main__":
    main()