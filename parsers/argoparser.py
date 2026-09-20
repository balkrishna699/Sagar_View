import xarray as xr

from parsers.base import BaseParser
from model import OceanDataset


class ArgoParser(BaseParser):

    def parse(self):

        ds = xr.open_dataset(self.filepath)

        ocean_data = OceanDataset(
            latitude=ds["LATITUDE"],
            longitude=ds["LONGITUDE"],

            pressure=ds["PRES"],

            time=ds["JULD"],

            temperature=ds["TEMP"],
            salinity=ds["PSAL"],

            metadata=dict(ds.attrs)
        )

        return ocean_data