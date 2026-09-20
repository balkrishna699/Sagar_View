from parsers.netcdfparser import NetCDFParser


parser = NetCDFParser(
    "datasets/RSMC_hycom_20260919.nc"
)
ds = parser.parse()

