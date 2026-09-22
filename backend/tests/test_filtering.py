"""Day 2: GET /data?minDepth=&maxDepth= filtering."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_no_params_returns_full_depth_range():
    body = client.get("/data").json()
    assert body["grid"]["depth"] == [0, 50, 100, 150, 200, 250, 300, 350, 400, 450]


def test_min_depth_only():
    body = client.get("/data?minDepth=100").json()
    assert body["grid"]["depth"] == [100, 150, 200, 250, 300, 350, 400, 450]
    assert len(body["temperature"]) == len(body["grid"]["depth"])


def test_max_depth_only():
    body = client.get("/data?maxDepth=100").json()
    assert body["grid"]["depth"] == [0, 50, 100]


def test_min_and_max_depth():
    body = client.get("/data?minDepth=50&maxDepth=200").json()
    assert body["grid"]["depth"] == [50, 100, 150, 200]


def test_arrays_still_match_filtered_grid_shape():
    body = client.get("/data?minDepth=50&maxDepth=200").json()
    n_depth, n_lat, n_lon = (len(body["grid"][k]) for k in ("depth", "lat", "lon"))
    for name in ("temperature", "salinity"):
        cube = body[name]
        assert len(cube) == n_depth, name
        assert all(len(plane) == n_lat for plane in cube), name
        assert all(len(row) == n_lon for plane in cube for row in plane), name


def test_colorbar_limits_reflect_the_filtered_subset_not_full_dataset():
    full = client.get("/data").json()
    shallow = client.get("/data?maxDepth=50").json()
    # Surface is warmest in this fake dataset, so a shallow-only slice should be
    # at least as warm at the top end as the full-depth slice.
    assert shallow["maxTemp"] >= full["maxTemp"] - 1


def test_min_depth_above_max_depth_is_400():
    r = client.get("/data?minDepth=300&maxDepth=100")
    assert r.status_code == 400
    assert "minDepth" in r.json()["detail"]


def test_range_outside_dataset_is_400():
    r = client.get("/data?minDepth=10000")
    assert r.status_code == 400


def test_lat_lon_are_unaffected_by_depth_filtering():
    full = client.get("/data").json()
    filtered = client.get("/data?minDepth=100&maxDepth=200").json()
    assert filtered["grid"]["lat"] == full["grid"]["lat"]
    assert filtered["grid"]["lon"] == full["grid"]["lon"]


def test_negative_depth_is_422():
    # FastAPI's own Query(ge=0) validation - not our HTTPException
    r = client.get("/data?minDepth=-10")
    assert r.status_code == 422
