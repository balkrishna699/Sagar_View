   # Data Contract: Ocean Visualization API

   ## Canonical JSON Schema
   Person 5's `/data` endpoint returns a **single-timestep** response:
   
   ```json
   {
     "time": "2026-09-20T12:00:00Z",
     "grid": {
       "lat": [5.0, 5.5, 6.0, ..., 25.0],      // length: N_LAT (41 in the real dataset)
       "lon": [65.0, 65.5, 66.0, ..., 85.0],   // length: N_LON (41 in the real dataset)
       "depth": [0, 100, 250, ..., 5000]       // length: N_DEPTH (14 in the real dataset)
     },
     "temperature": [[[value, ...], ...], ...],  // shape: [depth][lat][lon], degC
     "salinity": [[[value, ...], ...], ...],     // shape: [depth][lat][lon], PSU
     "currentSpeed": [[[value, ...], ...], ...], // shape: [depth][lat][lon], m/s = sqrt(u^2+v^2)
     "minTemp": -2, "maxTemp": 29,
     "minSal": 34, "maxSal": 36,
     "minSpeed": 0, "maxSpeed": 1
   }
   ```

   > **Important**: The array shape is `[depth][lat][lon]` for a single timestep.
   > For multi-timestep queries, the outer dimension is time: `[time][depth][lat][lon]`.
   > The frontend renderer currently consumes single-timestep shape only.

   ## API Endpoints

   | Endpoint | Method | Params | Status |
   |----------|--------|--------|--------|
   | `/data` | GET | `?minDepth=` `?maxDepth=` | ✅ Implemented (PR #2, filtering PR #3, real data PR #4) |
   | `/health` | GET | – | ✅ Implemented — also reports `usingRealData: bool` |
   | `/timeseries` | GET | `?lat=` `&lon=` | ❌ Not implemented — dead code in `api.js`; the frontend actually derives depth profiles client-side from `/data`'s volume grid (see `raycasting.js`'s `getVerticalProfile`), so this was never wired up. Remove from `api.js`/this doc, or tell Person 5 if you actually need it. |
   | `?time=` | — | — | ❌ Not implemented. Removed from this table (PR #4) since it was listed as done when it wasn't — the real dataset only has one timestep right now anyway. |
   | `/docs` | GET | – | ✅ Swagger UI |

   ### Depth Filtering (Day 2 — PR #3)
   - `minDepth` (float, ≥ 0): Keep only depth levels ≥ this value (metres)
   - `maxDepth` (float, ≥ 0): Keep only depth levels ≤ this value (metres)
   - Both are inclusive and optional (defaults to full range)
   - Returns 400 if `minDepth > maxDepth` or no depth levels match
   - Returns 422 for negative depth values

   ### Real data (Day 3 — PR #4)
   - `/data` is now backed by Person 4's `SyntheticDeepOceanParser` reading
     `datasets/synthetic_deep_ocean_5000m.nc` — still synthetic, not real ocean
     observations, but generated through the real parsing pipeline now.
   - Adds `currentSpeed` (+ `minSpeed`/`maxSpeed`), computed server-side from the
     dataset's `UVEL`/`VVEL` as `sqrt(u^2+v^2)`, to power the frontend's "Current Speed"
     variable selector.
   - If `datasets/` or `parsers/` aren't present in a checkout, the backend automatically
     falls back to the earlier fake grid so it still boots — check `GET /health`'s
     `usingRealData` field to see which one is live.
   - The real grid (41×41×14 ≈ 23.5k points/variable) is bigger than the old fake one
     (20×20×10 = 4k points) — full `/data` response is ~450KB. Flag to Person 1 if this
     is noticeably slower to render than the old mock.

   ## Coordinate Convention (Person 1 ↔ Person 2)

   Both Person 1 and Person 2 import `latLonDepthToScene()` from `coordinates.js`:

   ```
   latLonDepthToScene(lat, lon, depth, grid) → THREE.Vector3
     x = normalized latitude   → [0, 100]
     y = normalized longitude  → [0, 100]
     z = depth (surface=top)   → [0, 50 * exaggeration]
         surface (0m) = z_max, bottom (maxDepth) = z_0
   ```

   Reverse: `sceneToLatLonDepth(pos, grid) → { lat, lon, depth }`

   ## Events (Person 3 Dashboard → Renderer)

   | Event | Payload | Emitter |
   |-------|---------|---------|
   | `depthChanged` | `{ depthIndex: 0–N }` | Person 3 (slider) |
   | `timeChanged` | `{ timeIndex, timestamp }` | Person 1 (time controls) |
   | `colorbarChanged` | `{ variable: "temperature"\|"salinity", scale: "linear"\|"log" }` | Person 3 |
   | `exaggerationChanged` | `{ factor: 1.0–5.0 }` | Person 1 (exag slider) |
   | `markerClicked` | `{ lat, lon, depth }` | Person 2 (raycasting) |