-- 01_schema.sql
-- Ocean observations schema (PostgreSQL + PostGIS).
-- Files in db/init/ run in alphabetical order on first database initialisation.

CREATE EXTENSION IF NOT EXISTS postgis;

-- One row = one point observation (a single lat/lon/depth/time measurement).
-- The future /data API can pivot these rows into the regular grid described
-- in DATA_CONTRACT.md.
CREATE TABLE IF NOT EXISTS ocean_observations (
    id          BIGSERIAL PRIMARY KEY,

    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    -- Loaders must populate this consistently with latitude/longitude, e.g.
    -- ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    -- (PostGIS point order is X = longitude, Y = latitude).
    location    GEOGRAPHY(POINT, 4326) NOT NULL,

    depth       DOUBLE PRECISION NOT NULL,          -- metres, positive downward
    time        TIMESTAMPTZ NOT NULL,               -- stored as UTC

    temperature DOUBLE PRECISION,                   -- nullable
    salinity    DOUBLE PRECISION,                   -- nullable
    u_current   DOUBLE PRECISION,                   -- nullable (not in current sample data)
    v_current   DOUBLE PRECISION,                   -- nullable (not in current sample data)

    source      TEXT NOT NULL,                      -- e.g. 'argo', 'glider', 'model', 'csv'

    CONSTRAINT ocean_obs_latitude_range  CHECK (latitude  BETWEEN -90  AND 90),
    CONSTRAINT ocean_obs_longitude_range CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT ocean_obs_depth_nonneg    CHECK (depth >= 0)
);
