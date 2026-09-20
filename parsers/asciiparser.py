import pandas as pd

from parsers.base import BaseParser
from model import OceanDataset, DatasetMetadata


class ASCIIParser(BaseParser):

    COLUMN_ALIASES = {
        "latitude": ["latitude", "lat", "LAT", "LATITUDE"],
        "longitude": ["longitude", "lon", "LON", "LONGITUDE"],
        "depth": ["depth", "DEPTH"],
        "time": ["time", "TIME", "datetime", "DATETIME"],
        "temperature": ["temperature", "temp", "TEMP", "Temperature"],
        "salinity": ["salinity", "sal", "SAL", "PSAL", "Salinity"],
        "u_current": ["u_current", "u", "UVEL", "uvel"],
        "v_current": ["v_current", "v", "VVEL", "vvel"],
    }

    def _find_column(self, columns, field):

        for alias in self.COLUMN_ALIASES[field]:
            if alias in columns:
                return alias

        return None

    def parse(self):

        df = pd.read_csv(self.filepath)

        required_fields = [
            "latitude",
            "longitude",
            "depth",
            "temperature",
            "salinity"
        ]

        column_map = {}

        for field in required_fields:

            column = self._find_column(df.columns, field)

            if column is None:
                raise ValueError(
                    f"Required column for '{field}' not found. "
                    f"Available columns: {list(df.columns)}"
                )

            column_map[field] = column

        time_column = self._find_column(df.columns, "time")

        u_column = self._find_column(df.columns, "u_current")
        v_column = self._find_column(df.columns, "v_current")

        metadata = DatasetMetadata(
            source="ASCII/CSV",
            dataset_name="ASCII/CSV Ocean Dataset",
            format="CSV",

            description="Ocean data provided in tabular ASCII/CSV format",

            units={
                "latitude": "degrees_north",
                "longitude": "degrees_east",
                "depth": "meters"
            },

            source_variables={
                field: column_map[field]
                for field in column_map
            },

            coordinate_conventions={
                "latitude": "degrees_north",
                "longitude": "degrees_east",
                "depth": "meters"
            }
        )

        ocean_data = OceanDataset(
            latitude=df[column_map["latitude"]].to_numpy(),
            longitude=df[column_map["longitude"]].to_numpy(),

            depth=df[column_map["depth"]].to_numpy(),

            time=(
                df[time_column].to_numpy()
                if time_column is not None
                else None
            ),

            temperature=df[column_map["temperature"]].to_numpy(),
            salinity=df[column_map["salinity"]].to_numpy(),

            u_current=(
                df[u_column].to_numpy()
                if u_column is not None
                else None
            ),

            v_current=(
                df[v_column].to_numpy()
                if v_column is not None
                else None
            ),

            metadata=metadata
        )

        return ocean_data