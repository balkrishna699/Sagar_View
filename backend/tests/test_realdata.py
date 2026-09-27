"""Tests specific to today's real dataset (datasets/synthetic_deep_ocean_5000m.nc).

If Person 4 changes the dataset later, these are the tests most likely to need
updating - test_data.py / test_filtering.py should keep passing unchanged.
"""
import pytest

from app.main import app, USING_REAL_DATA

pytestmark = pytest.mark.skipif(
    not USING_REAL_DATA,
    reason="datasets/synthetic_deep_ocean_5000m.nc or parsers/ not available in this checkout",
)

from fastapi.testclient import TestClient  # noqa: E402

client = TestClient(app)


def test_health_reports_real_data():
    assert client.get("/health").json() == {"status": "ok", "usingRealData": True}


def test_grid_matches_known_dataset_bounds():
    grid = client.get("/data").json()["grid"]
    assert len(grid["lat"]) == 41
    assert len(grid["lon"]) == 41
    assert len(grid["depth"]) == 14
    assert grid["depth"][0] == 0
    assert grid["depth"][-1] == 5000
    assert grid["lat"][0] == pytest.approx(5.0)
    assert grid["lat"][-1] == pytest.approx(25.0)


def test_temperature_range_is_physically_plausible():
    body = client.get("/data").json()
    # Deep, cold water at high latitude can dip below 0degC; surface tropics ~28-29degC.
    assert -3 <= body["minTemp"] <= 5
    assert 20 <= body["maxTemp"] <= 32
