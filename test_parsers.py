from parsers.syntheticdeepoceanparser import SyntheticDeepOceanParser


# ==================================================
# TEST SINGLE POINT QUERY
# ==================================================

def test_point_query():

    parser = SyntheticDeepOceanParser(
        "datasets/synthetic_deep_ocean_5000m.nc"
    )

    result = parser.get_point(
        latitude=15,
        longitude=75,
        depth=3000,
        time="2026-09-20T12:00:00"
    )

    print("\n========== 3D POINT QUERY ==========")

    print("Requested:")
    print("Latitude:  15°")
    print("Longitude: 75°")
    print("Depth:     3000 m")

    print("\nReturned data:")

    for key, value in result.items():
        print(f"{key}: {value}")


# ==================================================
# TEST SINGLE DEPTH REGION QUERY
# ==================================================

def test_region_query():

    parser = SyntheticDeepOceanParser(
        "datasets/synthetic_deep_ocean_5000m.nc"
    )

    result = parser.get_region_data(
        min_lat=10,
        max_lat=15,
        min_lon=70,
        max_lon=75,
        depth=3000,
        time="2026-09-20T12:00:00"
    )

    print("\n========== 3D REGION QUERY ==========")

    print("Region:")
    print("Latitude:  10° → 15°")
    print("Longitude: 70° → 75°")
    print("Depth:     3000 m")

    print("\nReturned data:")

    print(
        "Latitude points:",
        len(result["latitude"])
    )

    print(
        "Longitude points:",
        len(result["longitude"])
    )

    print(
        "Temperature rows:",
        len(result["temperature"])
    )

    print(
        "Temperature columns:",
        len(result["temperature"][0])
    )

    print(
        "Depth:",
        result["depth"]
    )

    print(
        "Time:",
        result["time"]
    )


# ==================================================
# TEST FULL 3D REGION QUERY
# ==================================================

def test_3d_region_query():

    parser = SyntheticDeepOceanParser(
        "datasets/synthetic_deep_ocean_5000m.nc"
    )

    result = parser.get_3d_region_data(
        min_lat=10,
        max_lat=15,
        min_lon=70,
        max_lon=75,
        min_depth=0,
        max_depth=5000,
        time="2026-09-20T12:00:00"
    )

    print("\n========== FULL 3D REGION QUERY ==========")

    print("Region:")
    print("Latitude:  10° → 15°")
    print("Longitude: 70° → 75°")
    print("Depth:     0 → 5000 m")

    print("\nReturned data:")

    print(
        "Latitude points:",
        len(result["latitude"])
    )

    print(
        "Longitude points:",
        len(result["longitude"])
    )

    print(
        "Depth levels:",
        len(result["depth"])
    )

    print(
        "Depths:",
        result["depth"]
    )

    print(
        "Temperature dimensions:",
        len(result["temperature"]),
        "x",
        len(result["temperature"][0]),
        "x",
        len(result["temperature"][0][0])
    )

    print(
        "Salinity dimensions:",
        len(result["salinity"]),
        "x",
        len(result["salinity"][0]),
        "x",
        len(result["salinity"][0][0])
    )

    print(
        "U-current dimensions:",
        len(result["u_current"]),
        "x",
        len(result["u_current"][0]),
        "x",
        len(result["u_current"][0][0])
    )

    print(
        "V-current dimensions:",
        len(result["v_current"]),
        "x",
        len(result["v_current"][0]),
        "x",
        len(result["v_current"][0][0])
    )

    print(
        "Time:",
        result["time"]
    )


# ==================================================
# RUN ALL TESTS
# ==================================================

if __name__ == "__main__":

    test_point_query()

    test_region_query()

    test_3d_region_query()