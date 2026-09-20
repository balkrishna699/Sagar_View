import xarray as xr

from parsers.base import BaseParser
from model import OceanDataset, DatasetMetadata


class ArgoParser(BaseParser):

    def parse(self):

        ds = xr.open_dataset(self.filepath)

        metadata = DatasetMetadata(
            source="Synthetic",
            dataset_name="Synthetic Argo Demonstration Dataset",
            format="NetCDF",

            description="Synthetic Argo-like dataset for prototype demonstration",

            units={
                "pressure": ds["PRES"].attrs.get("units", ""),
                "temperature": ds["TEMP"].attrs.get("units", ""),
                "salinity": ds["PSAL"].attrs.get("units", ""),
                "latitude": ds["LATITUDE"].attrs.get("units", ""),
                "longitude": ds["LONGITUDE"].attrs.get("units", "")
            },

            source_variables={
                "latitude": "LATITUDE",
                "longitude": "LONGITUDE",
                "pressure": "PRES",
                "time": "JULD",
                "temperature": "TEMP",
                "salinity": "PSAL"
            },

            coordinate_conventions={
                "latitude": "degrees_north",
                "longitude": "degrees_east",
                "pressure": "dbar"
            }
        )

        ocean_data = OceanDataset(
            latitude=ds["LATITUDE"],
            longitude=ds["LONGITUDE"],

            pressure=ds["PRES"],

            time=ds["JULD"],

            temperature=ds["TEMP"],
            salinity=ds["PSAL"],

            metadata=metadata
        )

        return ocean_data