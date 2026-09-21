# Backend API (Person 5)

FastAPI service that serves ocean data to the 3D frontend.
The response shape is defined in [`DATA_CONTRACT.md`](../DATA_CONTRACT.md) (repo root).

**Status: Day 1** — `GET /data` returns a **fake, deterministic** dataset in the contract shape.
Day 2 adds depth filtering; Day 3 swaps in Person 4's real parsed data (same response shape).

## Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows      (Linux/macOS: source .venv/bin/activate)
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

- Swagger docs: http://localhost:8000/docs
- Tests: `pytest`

The frontend (`frontend/src/api.js`) already calls `http://localhost:8000/data`, and CORS is
enabled for the Vite dev server, so `npm run dev` + this server works out of the box.

## Endpoints

| Method | Path      | Description                                             |
|--------|-----------|---------------------------------------------------------|
| GET    | `/health` | Liveness check → `{"status": "ok"}`                     |
| GET    | `/data`   | Ocean data in the canonical schema (fake data for now)  |

## `GET /data` response

```json
{
  "time": "2024-01-15T00:00:00Z",
  "grid": { "lat": [15.0, 15.05, "..."], "lon": [75.0, 75.05, "..."], "depth": [0, 50, "...", 450] },
  "temperature": "[depth][lat][lon]  (10 x 20 x 20, degC)",
  "salinity":    "[depth][lat][lon]  (10 x 20 x 20, PSU)",
  "minTemp": 13, "maxTemp": 31, "minSal": 34, "maxSal": 36
}
```

A saved copy is in [`docs/sample_response.json`](docs/sample_response.json) for mocking without the server.

### Notes / decisions

- **Same grid as `frontend/src/mockData.js`** (20 × 20 × 10, lat 15.00–15.95, lon 75.00–75.95,
  depth 0–450 m), so the frontend can switch from mock to API without other changes.
  This is smaller than the 100 × 100 × 50 example in `DATA_CONTRACT.md` on purpose (payload size / points renderer).
- **One timestep per response.** Arrays are indexed `[depth][lat][lon]`, which is what
  `frontend/src/renderer.js` reads. (`DATA_CONTRACT.md` mentions `[time][depth][lat][lon]` in a comment,
  but its own example has a single `time` string.)
- `minTemp/maxTemp/minSal/maxSal` are colorbar limits, computed from the data.
- Not implemented yet: `GET /timeseries?lat=&lon=` (called by `fetchTimeSeriesAt` in `api.js`).

## Roadmap

- [x] Day 1 — `GET /data` with fake data
- [ ] Day 2 — query params, e.g. `/data?minDepth=0&maxDepth=100`
- [ ] Day 3 — use Person 4's real parsed output, same response shape

## Layout

```
backend/
├── app/
│   ├── main.py         # FastAPI app, routes, CORS
│   ├── models.py       # Pydantic models = DATA_CONTRACT.md
│   └── sample_data.py  # fake dataset; get_dataset() is what Day 3 replaces
├── tests/test_data.py
├── docs/sample_response.json
└── requirements.txt / requirements-dev.txt
```
