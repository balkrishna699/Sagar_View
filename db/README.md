# Database (PostgreSQL + PostGIS)

## Purpose

`ocean_observations` stores **point observations** of ocean variables, aligned
with the Python `OceanDataset` model. Each row is one measurement at a
latitude/longitude, depth and time, from a given data source.

`DATA_CONTRACT.md` describes a regular grid returned by the future `/data`
API. The database does not store that grid; the API is expected to query rows
(by time, depth and bounding box) and transform them into the contract format.

## Files

| File | Contents |
|------|----------|
| `init/01_schema.sql` | PostGIS extension, `ocean_observations` table, CHECK constraints |
| `init/02_indexes.sql` | Indexes |

Files in `init/` run in alphabetical order when a PostgreSQL container
initialises an empty data directory.

## Table: `ocean_observations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `BIGSERIAL` | Primary key |
| `latitude` | `DOUBLE PRECISION NOT NULL` | Degrees, -90 to 90 (CHECK) |
| `longitude` | `DOUBLE PRECISION NOT NULL` | Degrees, -180 to 180 (CHECK) |
| `location` | `GEOGRAPHY(POINT, 4326) NOT NULL` | PostGIS point built from lon/lat |
| `depth` | `DOUBLE PRECISION NOT NULL` | Metres, positive downward, >= 0 (CHECK) |
| `time` | `TIMESTAMPTZ NOT NULL` | Observation time, stored as UTC |
| `temperature` | `DOUBLE PRECISION` | Nullable |
| `salinity` | `DOUBLE PRECISION` | Nullable |
| `u_current` | `DOUBLE PRECISION` | Nullable (not in the current sample CSV) |
| `v_current` | `DOUBLE PRECISION` | Nullable (not in the current sample CSV) |
| `source` | `TEXT NOT NULL` | Data origin, e.g. `argo`, `glider`, `model`, `csv` |

`OceanDataset` fields not stored yet (`pressure`, `sea_surface_height`,
`mixed_layer_depth`, `tropical_cyclone_heat_potential`) can be added later as
nullable columns.

## Conventions

- **Coordinate system:** EPSG:4326 (WGS 84). PostGIS points use
  `(X, Y) = (longitude, latitude)`, so build `location` with
  `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`.
  Loaders must keep `latitude`, `longitude` and `location` consistent.
- **Depth:** metres.
- **Time:** stored as UTC `timestamptz`. Timestamps without a time zone (such
  as those in `datasets/test_ocean.csv`) should be treated as UTC when loaded.
- **Units (current project assumptions):** temperature in °C and salinity in
  PSU (practical salinity units). These are assumptions only.
  `DATA_CONTRACT.md` does **not** explicitly state units; they should be
  confirmed with the team. Current units (`u_current`, `v_current`) are
  assumed m/s, also unconfirmed.
- **Source examples:** `argo`, `glider`, `model`, `csv`. A plain text column
  keeps the prototype simple while allowing new data sources later.

## Why PostGIS

PostGIS provides a spatial type and spatial indexing, so geographic queries
(bounding boxes, radius searches, nearest point) are fast and don't need
hand-written lat/lon math. Using `GEOGRAPHY` also gives distances in metres on
the Earth's surface.

## Indexes

| Index | Supports |
|-------|----------|
| `idx_ocean_obs_location` (GiST on `location`) | Bounding-box, radius (`ST_DWithin`) and nearest-point queries |
| `idx_ocean_obs_time_depth` (B-tree on `time, depth`) | Time-range queries and time + depth slices (the main access pattern for the `/data` API) |
| `idx_ocean_obs_source` (B-tree on `source`) | Filtering by data source |
