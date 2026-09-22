import math

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_data_has_exactly_the_contract_keys():
    r = client.get("/data")
    assert r.status_code == 200
    body = r.json()
    assert set(body) == {
        "time", "grid", "temperature", "salinity",
        "minTemp", "maxTemp", "minSal", "maxSal",
    }
    assert set(body["grid"]) == {"lat", "lon", "depth"}


def test_time_is_iso_utc_string():
    assert client.get("/data").json()["time"] == "2024-01-15T00:00:00Z"


def test_arrays_are_depth_lat_lon_and_match_grid():
    body = client.get("/data").json()
    n_depth, n_lat, n_lon = (len(body["grid"][k]) for k in ("depth", "lat", "lon"))
    for name in ("temperature", "salinity"):
        cube = body[name]
        assert len(cube) == n_depth, name
        assert all(len(plane) == n_lat for plane in cube), name
        assert all(len(row) == n_lon for plane in cube for row in plane), name


def test_grid_axes_are_sane():
    grid = client.get("/data").json()["grid"]
    assert grid["depth"][0] == 0
    for axis in ("lat", "lon", "depth"):
        assert grid[axis] == sorted(grid[axis]), axis


def test_index_order_is_depth_then_lat_then_lon():
    # temperature = 28 - (d/10)*15 + sin(la*0.1)*cos(lo*0.1)*3 ; check one asymmetric cell
    cube = client.get("/data").json()["temperature"]
    d, la, lo = 2, 3, 5
    expected = 28 - (d / 10) * 15 + math.sin(la * 0.1) * math.cos(lo * 0.1) * 3
    assert cube[d][la][lo] == round(expected, 3)


def test_colorbar_limits_bound_the_data():
    body = client.get("/data").json()
    for var, lo, hi in (("temperature", "minTemp", "maxTemp"), ("salinity", "minSal", "maxSal")):
        flat = [v for plane in body[var] for row in plane for v in row]
        assert body[lo] <= min(flat) and max(flat) <= body[hi], var


def test_warmer_at_surface_than_at_depth():
    cube = client.get("/data").json()["temperature"]
    assert cube[0][0][0] > cube[-1][0][0]


def test_response_is_deterministic():
    assert client.get("/data").json() == client.get("/data").json()


def test_cors_allows_vite_dev_origin():
    r = client.get("/data", headers={"Origin": "http://localhost:5173"})
    assert r.headers.get("access-control-allow-origin") == "*"
