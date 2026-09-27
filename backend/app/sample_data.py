"""Deterministic FAKE ocean data - used only if Person 4's real dataset isn't available
(see app/main.py's fallback logic and GET /health's usingRealData flag).

The grid deliberately matches frontend/src/mockData.js (20 x 20 x 10, lat 15.00-15.95,
lon 75.00-75.95, depth 0-450 m), so the frontend can swap mock -> API without changes.
Values are smooth and physically plausible, but NOT real measurements.
"""
import math
from datetime import datetime, timezone

from .models import Grid, OceanData

N_LAT, N_LON, N_DEPTH = 20, 20, 10
FAKE_TIME = datetime(2024, 1, 15, tzinfo=timezone.utc)
FULL_DEPTH = [float(i * 50) for i in range(N_DEPTH)]  # 0, 50, ..., 450


def get_full_depth_range() -> tuple[float, float]:
    """(min, max) depth in metres in the fake dataset, for validating query params."""
    return FULL_DEPTH[0], FULL_DEPTH[-1]


def _temperature(d: int, la: int, lo: int) -> float:
    base = 28 - (d / N_DEPTH) * 15  # warm surface -> cold deep
    return base + math.sin(la * 0.1) * math.cos(lo * 0.1) * 3


def _salinity(d: int, la: int, lo: int) -> float:
    return 35 + 0.5 * math.sin(la * 0.2) * math.cos(lo * 0.2) + 0.5 * (d / N_DEPTH)


def _u_current(d: int, la: int, lo: int) -> float:
    return 0.15 * math.cos(la * 0.15) * (1 - d / N_DEPTH)


def _v_current(d: int, la: int, lo: int) -> float:
    return 0.15 * math.sin(lo * 0.15) * (1 - d / N_DEPTH)


def _current_speed(d: int, la: int, lo: int) -> float:
    return math.hypot(_u_current(d, la, lo), _v_current(d, la, lo))


def _cube(fn, depth_indices: list[int]) -> list[list[list[float]]]:
    return [
        [[round(fn(d, la, lo), 3) for lo in range(N_LON)] for la in range(N_LAT)]
        for d in depth_indices
    ]


def _flat_min_max(cube: list[list[list[float]]]) -> tuple[float, float]:
    flat = [v for plane in cube for row in plane for v in row]
    return math.floor(min(flat)), math.ceil(max(flat))


def get_dataset(min_depth: float | None = None, max_depth: float | None = None) -> OceanData:
    """Fallback entry point - same signature as real_data.get_dataset().

    min_depth/max_depth (metres, inclusive) keep only matching depth *levels* from the
    fixed grid above - they don't interpolate to arbitrary depths.
    """
    lo = FULL_DEPTH[0] if min_depth is None else min_depth
    hi = FULL_DEPTH[-1] if max_depth is None else max_depth
    depth_indices = [i for i, d in enumerate(FULL_DEPTH) if lo <= d <= hi]
    depth = [FULL_DEPTH[i] for i in depth_indices]

    temperature = _cube(_temperature, depth_indices)
    salinity = _cube(_salinity, depth_indices)
    current_speed = _cube(_current_speed, depth_indices)

    if temperature:
        min_t, max_t = _flat_min_max(temperature)
        min_s, max_s = _flat_min_max(salinity)
        min_sp, max_sp = _flat_min_max(current_speed)
    else:
        # No depth levels matched the filter; OceanData still needs valid floats.
        min_t = max_t = min_s = max_s = min_sp = max_sp = 0.0

    return OceanData(
        time=FAKE_TIME,
        grid=Grid(
            lat=[round(15.0 + i * 0.05, 2) for i in range(N_LAT)],
            lon=[round(75.0 + i * 0.05, 2) for i in range(N_LON)],
            depth=depth,
        ),
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
