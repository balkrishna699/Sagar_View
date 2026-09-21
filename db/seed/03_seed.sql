-- 03_seed.sql
-- Small sample dataset (~77 rows) for development and testing.
-- Run AFTER 01_schema.sql and 02_indexes.sql.
--
-- * All timestamps are UTC.
-- * location is always built as
--     ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
-- * Idempotent per source: a source's rows are only inserted if that source
--   has no rows yet, so re-running this file will not duplicate data.
-- * Values are realistic-looking sample data, NOT real measurements.
--   For 'csv', only the first row (10.03, 70.04, 10 m, 28.4, 35.1) comes from
--   the datasets/test_ocean.csv example; the other csv rows are illustrative.

-- ---------------------------------------------------------------------------
-- csv (5 rows), Arabian Sea near the CSV sample point. No currents.
-- argo (10 rows), one float, two profiles. No currents.
-- glider (8 rows), one sawtooth transect. Depth-averaged currents on some rows.
-- ---------------------------------------------------------------------------
INSERT INTO ocean_observations
    (latitude, longitude, location, depth, time,
     temperature, salinity, u_current, v_current, source)
SELECT
    v.latitude::double precision,
    v.longitude::double precision,
    ST_SetSRID(ST_MakePoint(v.longitude::double precision,
                            v.latitude::double precision), 4326)::geography,
    v.depth::double precision,
    v.time::timestamptz,
    v.temperature::double precision,
    v.salinity::double precision,
    v.u_current::double precision,
    v.v_current::double precision,
    v.source
FROM (VALUES
    -- csv
    ('csv',   10.03, 70.04,  10, '2026-09-20T12:00:00Z', 28.4, 35.1, NULL, NULL),
    ('csv',   10.03, 70.04,  50, '2026-09-20T12:00:00Z', 27.5, 35.3, NULL, NULL),
    ('csv',   10.13, 70.14,  10, '2026-09-20T12:00:00Z', 28.3, 35.2, NULL, NULL),
    ('csv',   10.13, 70.14,  50, '2026-09-20T12:00:00Z', 27.4, 35.3, NULL, NULL),
    ('csv',   10.03, 70.04,  10, '2026-09-21T00:00:00Z', 28.2, 35.1, NULL, NULL),
    -- argo: profile 1 (2026-09-18)
    ('argo',  14.82, 68.35,   5, '2026-09-18T05:30:00Z', 29.0, 35.9, NULL, NULL),
    ('argo',  14.82, 68.35,  50, '2026-09-18T05:30:00Z', 27.6, 35.8, NULL, NULL),
    ('argo',  14.82, 68.35, 100, '2026-09-18T05:30:00Z', 22.4, 35.7, NULL, NULL),
    ('argo',  14.82, 68.35, 200, '2026-09-18T05:30:00Z', 15.6, 35.6, NULL, NULL),
    ('argo',  14.82, 68.35, 500, '2026-09-18T05:30:00Z',  9.4, 35.3, NULL, NULL),
    -- argo: profile 2 (2026-09-20)
    ('argo',  14.91, 68.42,   5, '2026-09-20T05:40:00Z', 29.2, 35.9, NULL, NULL),
    ('argo',  14.91, 68.42,  50, '2026-09-20T05:40:00Z', 27.9, 35.8, NULL, NULL),
    ('argo',  14.91, 68.42, 100, '2026-09-20T05:40:00Z', 23.0, 35.7, NULL, NULL),
    ('argo',  14.91, 68.42, 200, '2026-09-20T05:40:00Z', 15.9, 35.6, NULL, NULL),
    ('argo',  14.91, 68.42, 500, '2026-09-20T05:40:00Z',  9.5, 35.3, NULL, NULL),
    -- glider: one transect, u/v only on some rows
    ('glider', 15.20, 72.90,   5, '2026-09-20T06:00:00Z', 29.1, 35.6, 0.18, -0.05),
    ('glider', 15.21, 72.92,  50, '2026-09-20T06:20:00Z', 27.8, 35.7, NULL,  NULL),
    ('glider', 15.22, 72.94, 100, '2026-09-20T06:40:00Z', 23.9, 35.8, 0.12, -0.03),
    ('glider', 15.23, 72.96, 150, '2026-09-20T07:00:00Z', 19.3, 35.7, NULL,  NULL),
    ('glider', 15.24, 72.98, 100, '2026-09-20T07:20:00Z', 23.7, 35.8, 0.11, -0.02),
    ('glider', 15.25, 73.00,  50, '2026-09-20T07:40:00Z', 27.6, 35.7, NULL,  NULL),
    ('glider', 15.26, 73.02,   5, '2026-09-20T08:00:00Z', 29.0, 35.6, 0.17, -0.04),
    ('glider', 15.27, 73.04,  50, '2026-09-20T08:20:00Z', 27.7, 35.7, NULL,  NULL)
) AS v (source, latitude, longitude, depth, time,
        temperature, salinity, u_current, v_current)
WHERE NOT EXISTS (
    SELECT 1 FROM ocean_observations o WHERE o.source = v.source
);

-- ---------------------------------------------------------------------------
-- model (54 rows): a small regular grid in the Bay of Bengal,
--   3 lat (15.0-15.2) x 3 lon (82.0-82.2) x 3 depths (0, 50, 100 m)
--   x 2 timestamps, with currents on every row.
-- Mimics the kind of gridded data the future /data API would return, at a
-- tiny fraction of the contract's 100 x 100 x 50 grid.
-- ---------------------------------------------------------------------------
INSERT INTO ocean_observations
    (latitude, longitude, location, depth, time,
     temperature, salinity, u_current, v_current, source)
SELECT
    g.lat,
    g.lon,
    ST_SetSRID(ST_MakePoint(g.lon, g.lat), 4326)::geography,
    g.depth::double precision,
    g.time,
    round(g.t0 + 0.05 * g.i - 0.03 * g.j + g.dt, 2),
    round(g.s0 - 0.02 * g.i + 0.03 * g.j, 2),
    round(0.25 - 0.001 * g.depth + 0.02 * g.j, 3),
    round(0.10 - 0.0005 * g.depth + 0.02 * g.i, 3),
    'model'
FROM (
    SELECT
        (15.0 + a.i * 0.1)::double precision AS lat,
        (82.0 + b.j * 0.1)::double precision AS lon,
        a.i, b.j,
        dp.depth, dp.t0, dp.s0,
        tv.time, tv.dt
    FROM generate_series(0, 2) AS a (i)
    CROSS JOIN generate_series(0, 2) AS b (j)
    CROSS JOIN (VALUES (0,   28.6, 33.6),
                       (50,  27.4, 34.2),
                       (100, 22.8, 35.0)) AS dp (depth, t0, s0)
    CROSS JOIN (VALUES ('2026-09-20T12:00:00Z'::timestamptz,  0.0),
                       ('2026-09-21T00:00:00Z'::timestamptz, -0.1)) AS tv (time, dt)
) AS g
WHERE NOT EXISTS (
    SELECT 1 FROM ocean_observations o WHERE o.source = 'model'
);
