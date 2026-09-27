from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .models import OceanData

# Day 3: serve Person 4's real parsed dataset. If it's not available in this
# checkout (missing datasets/ or parsers/, e.g. a teammate hasn't pulled them yet),
# fall back to the Day 1/2 synthetic data so the server still boots and the
# frontend still has something to render, rather than crashing on startup.
try:
    from . import real_data as data_source

    data_source.get_full_depth_range()  # forces the dataset to open now, not on first request
    USING_REAL_DATA = True
except (ImportError, FileNotFoundError) as exc:  # pragma: no cover - environment-dependent
    from . import sample_data as data_source

    USING_REAL_DATA = False
    _FALLBACK_REASON = str(exc)

app = FastAPI(
    title="SAGAR-VIEW Backend API",
    description="Serves ocean data to the 3D visualization frontend. Schema: DATA_CONTRACT.md",
    version="0.3.0",
)

# The Vite dev server (http://localhost:5173) is a different origin from this API (:8000),
# so the browser blocks requests unless CORS is enabled. Tighten before public deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def health() -> dict[str, str | bool]:
    body: dict[str, str | bool] = {"status": "ok", "usingRealData": USING_REAL_DATA}
    if not USING_REAL_DATA:
        body["fallbackReason"] = _FALLBACK_REASON
    return body


@app.get("/data", response_model=OceanData, tags=["data"])
def get_data(
    minDepth: float = Query(
        None, ge=0, description="Keep only depth levels >= this value (metres). Default: shallowest."
    ),
    maxDepth: float = Query(
        None, ge=0, description="Keep only depth levels <= this value (metres). Default: deepest."
    ),
) -> OceanData:
    """Ocean data in the canonical schema from DATA_CONTRACT.md.

    Backed by Person 4's parsed dataset (datasets/synthetic_deep_ocean_5000m.nc) when
    available; falls back to the earlier fake grid otherwise (see GET /health).
    Supports ?minDepth= and ?maxDepth= (metres) to return a depth subset.
    """
    full_min, full_max = data_source.get_full_depth_range()
    lo = full_min if minDepth is None else minDepth
    hi = full_max if maxDepth is None else maxDepth

    if lo > hi:
        raise HTTPException(
            status_code=400,
            detail=f"minDepth ({lo}) must be <= maxDepth ({hi})",
        )

    dataset = data_source.get_dataset(min_depth=lo, max_depth=hi)

    if not dataset.grid.depth:
        raise HTTPException(
            status_code=400,
            detail=f"No depth levels between {lo} and {hi}m. Dataset range is "
            f"{full_min}-{full_max}m.",
        )

    return dataset
