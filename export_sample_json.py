import json
import math
from dataclasses import asdict

from parsers.netcdfparser import NetCDFParser
from parsers.argoparser import ArgoParser


def clean_value(value):
    """
    Convert NumPy values into JSON-safe Python values.
    Convert NaN values to None.
    """

    if hasattr(value, "item"):
        value = value.item()

    if isinstance(value, float) and math.isnan(value):
        return None

    return value


def clean_record(record):
    """
    Make every value in a record JSON-safe.
    """

    for key, value in record.items():
        record[key] = clean_value(value)

    return record


def main():

    # ==================================================
    # INCOIS / HYCOM
    # ==================================================

    netcdf_parser = NetCDFParser(
        "datasets/RSMC_hycom_20260920.nc"
    )

    # These are real points from the INCOIS dataset.
    # We use points that contain valid ocean data.
    incois_queries = [
        {
            "latitude": 10,
            "longitude": 70,
            "depth": 10,
            "time": "2026-09-20T12:00:00"
        },

        {
            "latitude": 12,
            "longitude": 72,
            "depth": 50,
            "time": "2026-09-20T12:00:00"
        },

        {
            "latitude": 14,
            "longitude": 74,
            "depth": 100,
            "time": "2026-09-20T12:00:00"
        }
    ]

    incois_points = []

    for query in incois_queries:

        point = netcdf_parser.get_point(
            latitude=query["latitude"],
            longitude=query["longitude"],
            depth=query["depth"],
            time=query["time"]
        )

        # Rename "tchp" to match OceanDataset.
        point["tropical_cyclone_heat_potential"] = point.pop(
            "tchp"
        )

        # Argo uses pressure, while HYCOM uses depth.
        point["pressure"] = None

        incois_points.append(
            clean_record(point)
        )


    # ==================================================
    # INCOIS METADATA
    # ==================================================

    incois_data = netcdf_parser.parse()

    incois_metadata = asdict(
        incois_data.metadata
    )

    for point in incois_points:
        point["metadata"] = incois_metadata


    # ==================================================
    # SYNTHETIC ARGO
    # ==================================================

    argo_parser = ArgoParser(
        "datasets/synthetic_argo_demo.nc"
    )

    argo_data = argo_parser.parse()

    argo_metadata = asdict(
        argo_data.metadata
    )

    argo_records = []

    # Take three synthetic Argo profiles.
    for profile in range(3):

        record = {
            "latitude": float(
                argo_data.latitude.values[profile]
            ),

            "longitude": float(
                argo_data.longitude.values[profile]
            ),

            "depth": None,

            "pressure": float(
                argo_data.pressure.values[profile][1]
            ),

            "time": str(
                argo_data.time.values[profile]
            ),

            "temperature": float(
                argo_data.temperature.values[profile][1]
            ),

            "salinity": float(
                argo_data.salinity.values[profile][1]
            ),

            "u_current": None,
            "v_current": None,

            "sea_surface_height": None,

            "mixed_layer_depth": None,

            "tropical_cyclone_heat_potential": None,

            "metadata": argo_metadata
        }

        argo_records.append(
            clean_record(record)
        )


    # ==================================================
    # COMBINE DATA
    # ==================================================

    output = {
        "schema_version": "1.0",

        "description": (
            "Sample normalized ocean data generated "
            "from INCOIS HYCOM and synthetic Argo datasets."
        ),

        "records": (
            incois_points +
            argo_records
        )
    }


    # ==================================================
    # WRITE JSON
    # ==================================================

    output_file = (
        "examples/normalized_ocean_data.json"
    )

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


    print(
        f"JSON sample created: {output_file}"
    )

    print(
        f"Total records: {len(output['records'])}"
    )

    print(
        "INCOIS records: 3"
    )

    print(
        "Synthetic Argo records: 3"
    )


if __name__ == "__main__":
    main()