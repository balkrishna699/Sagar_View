import xarray as xr

from parsers.base import BaseParser
from model import OceanDataset


class NetCDFParser(BaseParser):

    def __init__(self, filepath):
        self.filepath = filepath

    def parse(self):

        ds = xr.open_dataset(self.filepath)

        ocean_data = OceanDataset(
            latitude=ds["LAT"],
            longitude=ds["LON"],
            depth=ds["DEPTH"],
            time=ds["TIME"],

            temperature=ds["TEMP"],
            salinity=ds["SALN"],

            u_current=ds["UVEL"],
            v_current=ds["VVEL"],

            sea_surface_height=ds["SSH"],
            mixed_layer_depth=ds["MLD"],
            tropical_cyclone_heat_potential=ds["TCHP"],

            metadata=dict(ds.attrs)
        )

        return ocean_data

    def get_point(self, latitude, longitude, depth, time):

        ds = xr.open_dataset(self.filepath)

        point = ds.sel(
            LAT=latitude,
            LON=longitude,
            DEPTH=depth,
            TIME=time,
            method="nearest"
        )

        result = {
            "latitude": float(point.LAT.values),
            "longitude": float(point.LON.values),
            "depth": float(point.DEPTH.values),
            "time": str(point.TIME.values),

            "temperature": float(point.TEMP.values),
            "salinity": float(point.SALN.values),

            "u_current": float(point.UVEL.values),
            "v_current": float(point.VVEL.values),

            "sea_surface_height": float(point.SSH.values),
            "mixed_layer_depth": float(point.MLD.values),
            "tchp": float(point.TCHP.values)
        }

        ds.close()

        return result

    def get_region(
        self,
        min_lat,
        max_lat,
        min_lon,
        max_lon,
        depth,
        time
    ):

        ds = xr.open_dataset(self.filepath)

        region = ds.sel(
            LAT=slice(min_lat, max_lat),
            LON=slice(min_lon, max_lon),
            DEPTH=depth,
            TIME=time
        )

        return region

    def get_region_data(
        self,
        min_lat,
        max_lat,
        min_lon,
        max_lon,
        depth,
        time
    ):

        region = self.get_region(
            min_lat,
            max_lat,
            min_lon,
            max_lon,
            depth,
            time
        )

        result = {
            "latitude": region["LAT"].values.tolist(),
            "longitude": region["LON"].values.tolist(),

            "temperature": region["TEMP"].values.tolist(),
            "salinity": region["SALN"].values.tolist(),

            "u_current": region["UVEL"].values.tolist(),
            "v_current": region["VVEL"].values.tolist(),

            "sea_surface_height": region["SSH"].values.tolist(),
            "mixed_layer_depth": region["MLD"].values.tolist(),
            "tchp": region["TCHP"].values.tolist(),

            "depth": float(region["DEPTH"].values),
            "time": str(region["TIME"].values)
        }

        return result