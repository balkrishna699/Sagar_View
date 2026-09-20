from parsers.netcdfparser import NetCDFParser
from parsers.asciiparser import ASCIIParser
from parsers.argoparser import ArgoParser


def test_ascii_parser():

    parser = ASCIIParser(
        "datasets/test_ocean.csv"
    )

    data = parser.parse()

    print("\n========== ASCII PARSER ==========")

    print("Object type:", type(data).__name__)

    print("Latitude:", data.latitude)
    print("Longitude:", data.longitude)
    print("Depth:", data.depth)
    print("Temperature:", data.temperature)
    print("Salinity:", data.salinity)


def test_netcdf_parser():

    parser = NetCDFParser(
        "datasets/RSMC_hycom_20260920.nc"
    )

    data = parser.parse()

    print("\n========== NETCDF PARSER ==========")

    print("Object type:", type(data).__name__)

    print("Latitude:", data.latitude)
    print("Longitude:", data.longitude)
    print("Depth:", data.depth)
    print("Temperature:", data.temperature)
    print("Salinity:", data.salinity)


def test_argo_parser():

    parser = ArgoParser(
        "datasets/synthetic_argo_demo.nc"
    )

    data = parser.parse()

    print("\n========== ARGO PARSER ==========")

    print("Object type:", type(data).__name__)

    print("Latitude:", data.latitude)
    print("Longitude:", data.longitude)
    print("Pressure:", data.pressure)
    print("Time:", data.time)
    print("Temperature:", data.temperature)
    print("Salinity:", data.salinity)

    print("Metadata:", data.metadata)


if __name__ == "__main__":

    test_ascii_parser()
    test_netcdf_parser()
    test_argo_parser()