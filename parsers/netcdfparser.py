import xarray as xr

from parsers.base import BaseParser
from model import OceanDataset


class NetCDFParser(BaseParser):

    def __init__(self, filepath):
        self.filepath = filepath

    def parse(self):
        ds = xr.open_dataset(self.filepath)

        print("\n========== DATASET ==========")
        print(ds)

        print("\n========== DIMENSIONS ==========")
        for name, size in ds.sizes.items():
            print(f"{name}: {size}")

        print("\n========== VARIABLES ==========")
        for name, variable in ds.data_vars.items():
            print(f"{name}")
            print(f"    dimensions: {variable.dims}")
            print(f"    units: {variable.attrs.get('units', 'unknown')}")

        return ds