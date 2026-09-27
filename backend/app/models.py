"""Response models for the backend API.

These mirror the "Canonical JSON Schema" in DATA_CONTRACT.md (repo root).
The frontend (frontend/src/api.js, renderer.js, raycasting.js) reads exactly these fields.

Array convention (matches frontend/src/renderer.js):
    temperature[depth_index][lat_index][lon_index]   -> one timestep per response
"""
from datetime import datetime

from pydantic import BaseModel


class Grid(BaseModel):
    lat: list[float]
    lon: list[float]
    depth: list[float]  # metres, positive down, increasing


class OceanData(BaseModel):
    time: datetime  # serialised as ISO-8601 UTC, e.g. "2024-01-15T00:00:00Z"
    grid: Grid
    temperature: list[list[list[float]]]  # degC,      [depth][lat][lon]
    salinity: list[list[list[float]]]  # PSU,          [depth][lat][lon]
    currentSpeed: list[list[list[float]]]  # m/s,       [depth][lat][lon] - sqrt(u^2+v^2)
    # Colorbar limits (camelCase on purpose - the contract uses these exact key names,
    # and frontend/src/renderer.js's getColorbarRange() reads minSpeed/maxSpeed directly)
    minTemp: float
    maxTemp: float
    minSal: float
    maxSal: float
    minSpeed: float
    maxSpeed: float
