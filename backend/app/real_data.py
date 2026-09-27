"""Loads Person 4's parsed ocean dataset and serves it in the canonical schema.

This is what Day 3 swaps in for app/sample_data.py's fake data. Same function
signature (get_dataset, get_full_depth_range), so app/main.py barely changes.

Data source: Person 4's SyntheticDeepOceanParser reading
datasets/synthetic_deep_ocean_5000m.nc (repo root). That file is synthetic
(see its own metadata), not real ocean observations - "real" here means
"Person 4's parsed pipeline", not "real measurements".

Import note: parsers/ and datasets/ live at the repo root, one level above
backend/. This module adds the repo root to sys.path at import time so
`from parsers... import ...` works when uvicorn is run from inside backend/.
This assumes backend/ stays a direct child of the repo root - if Person 6
restructures the repo layout, this path needs updating.
"""
import math
import sys
from pathlib import Path

import xarray as xr

from .models import Grid, OceanData

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from parsers.syntheticdeepoceanparser import SyntheticDeepOceanParser  # noqa: E402

DATA_PATH = _REPO_ROOT / "datasets" / "synthetic_deep_ocean_5000m.nc"

_cache: dict | None = None


def _load() -> dict:
    """Open the dataset once and cache its parser + coordinate bounds.

    Re-fetches on every /data call use the cached parser (cheap - xarray lazy-loads),
    so this only pays the file-open cost once per server process.
    """
    global _cache
    if _cache is not None:
        return _cache

    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Expected Person 4's dataset at {DATA_PATH}, but it's not there. "
            "Check that datasets/synthetic_deep_ocean_5000m.nc is committed and that "
            "backend/ is still a direct child of the repo root."
        )

    ds = xr.open_dataset(DATA_PATH)
    _cache = {
        "parser": SyntheticDeepOceanParser(str(DATA_PATH)),
        "lat_min": float(ds["LAT"].min()),
        "lat_max": float(ds["LAT"].max()),
        "lon_min": float(ds["LON"].min()),
        "lon_max": float(ds["LON"].max()),
        "depth_min": float(ds["DEPTH"].min()),
        "depth_max": float(ds["DEPTH"].max()),
        "time": ds["TIME"].values[0],
    }
    ds.close()
    return _cache


def get_full_depth_range() -> tuple[float, float]:
    """(min, max) depth in metres in the real dataset, for validating query params."""
    c = _load()
    return c["depth_min"], c["depth_max"]


def _round3(cube: list) -> list:
    return [[[round(v, 3) for v in row] for row in plane] for plane in cube]


def _flat_min_max(cube: list) -> tuple[float, float]:
    flat = [v for plane in cube for row in plane for v in row]
    return math.floor(min(flat)), math.ceil(max(flat))


def get_dataset(min_depth: float | None = None, max_depth: float | None = None) -> OceanData:
    """Single entry point used by the API - same signature as sample_data.get_dataset().

    min_depth/max_depth (metres, inclusive) select the matching slice of Person 4's
    real DEPTH coordinate (0, 100, 250, ..., 5000m) - not an arbitrary interpolation.
    """
    c = _load()
    lo = c["depth_min"] if min_depth is None else min_depth
    hi = c["depth_max"] if max_depth is None else max_depth

    region = c["parser"].get_3d_region_data(
        min_lat=c["lat_min"],
        max_lat=c["lat_max"],
        min_lon=c["lon_min"],
        max_lon=c["lon_max"],
        min_depth=lo,
        max_depth=hi,
        time=c["time"],
    )

    temperature = _round3(region["temperature"])
    salinity = _round3(region["salinity"])

    n_depth, n_lat, n_lon = len(region["depth"]), len(region["latitude"]), len(region["longitude"])
    u, v = region["u_current"], region["v_current"]
    current_speed = _round3(
        [
            [[math.hypot(u[d][la][lo_], v[d][la][lo_]) for lo_ in range(n_lon)] for la in range(n_lat)]
            for d in range(n_depth)
        ]
    )

    if temperature:
        min_t, max_t = _flat_min_max(temperature)
        min_s, max_s = _flat_min_max(salinity)
        min_sp, max_sp = _flat_min_max(current_speed)
    else:
        # No depth levels matched the filter; OceanData still needs valid floats.
        min_t = max_t = min_s = max_s = min_sp = max_sp = 0.0

    return OceanData(
        time=region["time"],
        grid=Grid(lat=region["latitude"], lon=region["longitude"], depth=region["depth"]),
        temperature=temperature,
        salinity=salinity,
        currentSpeed=current_speed,
        minTemp=min_t,
        maxTemp=max_t,
        minSal=min_s,
        maxSal=max_s,
        minSpeed=min_sp,
        maxSpeed=max_sp,
    )
