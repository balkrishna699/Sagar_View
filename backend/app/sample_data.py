"""Deterministic FAKE ocean data (Day 1-2). Replaced by Person 4's parsed output on Day 3.

The grid deliberately matches frontend/src/mockData.js (20 x 20 x 10, lat 15.00-15.95,
lon 75.00-75.95, depth 0-450 m), so the frontend can swap mock -> API without changes.
Values are smooth and physically plausible, but NOT real measurements.
"""
import math
from datetime import datetime, timezone

from .models import Grid, OceanData

N_LAT, N_LON, N_DEPTH = 20, 20, 10
FAKE_TIME = datetime(2024, 1, 15, tzinfo=timezone.utc)


def _temperature(d: int, la: int, lo: int) -> float:
    base = 28 - (d / N_DEPTH) * 15  # warm surface -> cold deep
    return base + math.sin(la * 0.1) * math.cos(lo * 0.1) * 3


def _salinity(d: int, la: int, lo: int) -> float:
    return 35 + 0.5 * math.sin(la * 0.2) * math.cos(lo * 0.2) + 0.5 * (d / N_DEPTH)


def _cube(fn) -> list[list[list[float]]]:
    return [
        [[round(fn(d, la, lo), 3) for lo in range(N_LON)] for la in range(N_LAT)]
        for d in range(N_DEPTH)
    ]


def _flat_min_max(cube: list[list[list[float]]]) -> tuple[float, float]:
    flat = [v for plane in cube for row in plane for v in row]
    return math.floor(min(flat)), math.ceil(max(flat))


def get_dataset() -> OceanData:
    """Single entry point used by the API. Day 3: return Person 4's real data here."""
    temperature = _cube(_temperature)
    salinity = _cube(_salinity)
    min_t, max_t = _flat_min_max(temperature)
    min_s, max_s = _flat_min_max(salinity)
    return OceanData(
        time=FAKE_TIME,
        grid=Grid(
            lat=[round(15.0 + i * 0.05, 2) for i in range(N_LAT)],
            lon=[round(75.0 + i * 0.05, 2) for i in range(N_LON)],
            depth=[float(i * 50) for i in range(N_DEPTH)],
        ),
        temperature=temperature,
        salinity=salinity,
        minTemp=min_t,
        maxTemp=max_t,
        minSal=min_s,
        maxSal=max_s,
    )
