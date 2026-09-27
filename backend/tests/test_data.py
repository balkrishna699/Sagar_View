import math
from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["usingRealData"] is True


def test_data_has_exactly_the_contract_keys():
    r = client.get("/data")
    assert r.status_code == 200
    body = r.json()
    assert set(body) == {
        "time", "grid", "temperature", "salinity", "currentSpeed",
        "minTemp", "maxTemp", "minSal", "maxSal",
        "minSpeed", "maxSpeed",
    }
    assert set(body["grid"]) == {"lat", "lon", "depth"}


def test_time_is_iso_string():
    value = client.get("/data").json()["time"]
    datetime.fromisoformat(value.replace("Z", "+00:00"))


def test_arrays_are_depth_lat_lon_and_match_grid():
    body = client.get("/data").json()
    n_depth, n_lat, n_lon = (
        len(body["grid"][k]) for k in ("depth", "lat", "lon")
    )

    for name in ("temperature", "salinity", "currentSpeed"):
        cube = body[name]
        assert len(cube) == n_depth, name
        assert all(len(plane) == n_lat for plane in cube), name
        assert all(
            len(row) == n_lon for plane in cube for row in plane
        ), name


def test_grid_axes_are_sane():
    grid = client.get("/data").json()["grid"]
    assert grid["depth"][0] == 0
    for axis in ("lat", "lon", "depth"):
        assert grid[axis] == sorted(grid[axis]), axis


def test_index_order_is_depth_then_lat_then_lon():
    body = client.get("/data").json()

    for name in ("temperature", "salinity", "currentSpeed"):
        cube = body[name]
        assert len(cube) == len(body["grid"]["depth"])
        assert len(cube[0]) == len(body["grid"]["lat"])
        assert len(cube[0][0]) == len(body["grid"]["lon"])


def test_colorbar_limits_bound_the_data():
    body = client.get("/data").json()

    for var, lo, hi in (
        ("temperature", "minTemp", "maxTemp"),
        ("salinity", "minSal", "maxSal"),
        ("currentSpeed", "minSpeed", "maxSpeed"),
    ):
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
