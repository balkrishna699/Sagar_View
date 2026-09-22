   # Data Contract: Ocean Visualization API

   ## Canonical JSON Schema
   Person 5's `/data` endpoint returns a **single-timestep** response:
   
   ```json
   {
     "time": "2024-01-15T00:00:00Z",
     "grid": {
       "lat": [15.0, 15.05, 15.10, ...],   // length: N_LAT (e.g., 20)
       "lon": [75.0, 75.05, 75.10, ...],   // length: N_LON (e.g., 20)
       "depth": [0, 50, 100, ..., 450]     // length: N_DEPTH (e.g., 10)
     },
     "temperature": [[[value, ...], ...], ...],  // shape: [depth][lat][lon]
     "salinity": [[[value, ...], ...], ...],     // shape: [depth][lat][lon]
     "minTemp": 10, "maxTemp": 32,
     "minSal": 30, "maxSal": 36
   }
   ```

   > **Important**: The array shape is `[depth][lat][lon]` for a single timestep.
   > For multi-timestep queries, the outer dimension is time: `[time][depth][lat][lon]`.
   > The frontend renderer currently consumes single-timestep shape only.

   ## API Endpoints

   | Endpoint | Method | Params | Status |
   |----------|--------|--------|--------|
   | `/data` | GET | `?time=ISO` `?minDepth=` `?maxDepth=` | ✅ Implemented (PR #2, depth filtering PR #3) |
   | `/health` | GET | – | ✅ Implemented |
   | `/timeseries` | GET | `?lat=` `&lon=` | ⏳ Planned |
   | `/docs` | GET | – | ✅ Swagger UI |

   ### Depth Filtering (Day 2 — PR #3)
   - `minDepth` (float, ≥ 0): Keep only depth levels ≥ this value (metres)
   - `maxDepth` (float, ≥ 0): Keep only depth levels ≤ this value (metres)
   - Both are inclusive and optional (defaults to full range)
   - Returns 400 if `minDepth > maxDepth` or no depth levels match
   - Returns 422 for negative depth values

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