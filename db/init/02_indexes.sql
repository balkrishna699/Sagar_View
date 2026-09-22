-- 02_indexes.sql
-- Indexes for ocean_observations. Kept minimal on purpose.

-- Spatial queries: bounding box (&&, ST_Intersects), ST_DWithin, nearest point (<->).
CREATE INDEX IF NOT EXISTS idx_ocean_obs_location
    ON ocean_observations USING GIST (location);

-- Time/depth slices, e.g. "all observations at time T and depth D",
-- and time-range queries (leading column is time).
CREATE INDEX IF NOT EXISTS idx_ocean_obs_time_depth
    ON ocean_observations (time, depth);

-- Filtering by data source (argo, glider, model, csv).
CREATE INDEX IF NOT EXISTS idx_ocean_obs_source
    ON ocean_observations (source);
