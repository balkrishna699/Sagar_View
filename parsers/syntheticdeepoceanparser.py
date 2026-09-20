import xarray as xr

from parsers.base import BaseParser
from model import OceanDataset, DatasetMetadata


class SyntheticDeepOceanParser(BaseParser):

    def __init__(self, filepath):
        self.filepath = filepath

    def parse(self):

        ds = xr.open_dataset(self.filepath)

        metadata = DatasetMetadata(
            source="Synthetic",
            dataset_name="Synthetic Deep Ocean Prototype Dataset",
            format="NetCDF",

            description=(
                "Synthetic deep-ocean dataset generated "
                "for 3D prototype visualization. "
                "Values are not real ocean observations."
            ),

            units={
                "temperature": ds["TEMP"].attrs.get("units", ""),
                "salinity": ds["SALN"].attrs.get("units", ""),
                "u_current": ds["UVEL"].attrs.get("units", ""),
                "v_current": ds["VVEL"].attrs.get("units", ""),
            },

            source_variables={
                "temperature": "TEMP",
                "salinity": "SALN",
                "u_current": "UVEL",
                "v_current": "VVEL"
            },

            coordinate_conventions={
                "latitude": "degrees_north",
                "longitude": "degrees_east",
                "depth": "meters",
                "depth_positive": "down"
            }
        )

        ocean_data = OceanDataset(
            latitude=ds["LAT"],
            longitude=ds["LON"],

            depth=ds["DEPTH"],
            time=ds["TIME"],

            temperature=ds["TEMP"],
            salinity=ds["SALN"],

            u_current=ds["UVEL"],
            v_current=ds["VVEL"],

            metadata=metadata
        )

        return ocean_data

    # ==================================================
    # SINGLE POINT QUERY
    # ==================================================

    def get_point(
        self,
        latitude,
        longitude,
        depth,
        time
    ):

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
            "v_current": float(point.VVEL.values)
        }

        ds.close()

        return result

    # ==================================================
    # SINGLE DEPTH REGION QUERY
    # ==================================================

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

    # ==================================================
    # SINGLE DEPTH REGION AS DICTIONARY
    # ==================================================

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

            "depth": float(region["DEPTH"].values),
            "time": str(region["TIME"].values)
        }

        return result

    # ==================================================
    # FULL 3D REGION QUERY
    # ==================================================

    def get_3d_region_data(
        self,
        min_lat,
        max_lat,
        min_lon,
        max_lon,
        min_depth,
        max_depth,
        time
    ):

        ds = xr.open_dataset(self.filepath)

        region = ds.sel(
            LAT=slice(min_lat, max_lat),
            LON=slice(min_lon, max_lon),
            DEPTH=slice(min_depth, max_depth),
            TIME=time
        )

        result = {
            "latitude": region["LAT"].values.tolist(),

            "longitude": region["LON"].values.tolist(),

            "depth": region["DEPTH"].values.tolist(),

            "time": str(region["TIME"].values),

            "temperature": (
                region["TEMP"].values.tolist()
            ),

            "salinity": (
                region["SALN"].values.tolist()
            ),

            "u_current": (
                region["UVEL"].values.tolist()
            ),

            "v_current": (
                region["VVEL"].values.tolist()
            )
        }

        ds.close()

        return result