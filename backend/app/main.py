from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .models import OceanData
from .sample_data import get_dataset, get_full_depth_range

app = FastAPI(
    title="SAGAR-VIEW Backend API",
    description="Serves ocean data to the 3D visualization frontend. Schema: DATA_CONTRACT.md",
    version="0.2.0",
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
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/data", response_model=OceanData, tags=["data"])
def get_data(
    minDepth: float = Query(
        None, ge=0, description="Keep only depth levels >= this value (metres). Default: shallowest."
    ),
    maxDepth: float = Query(
        None, ge=0, description="Keep only depth levels <= this value (metres). Default: deepest."
    ),
) -> OceanData:
    """Ocean data in the canonical schema from DATA_CONTRACT.md (currently fake data).

    Day 2: supports ?minDepth= and ?maxDepth= (metres) to return a depth subset.
    Day 3: same shape, backed by Person 4's real parsed data.
    """
    full_min, full_max = get_full_depth_range()
    lo = full_min if minDepth is None else minDepth
    hi = full_max if maxDepth is None else maxDepth

    if lo > hi:
        raise HTTPException(
            status_code=400,
            detail=f"minDepth ({lo}) must be <= maxDepth ({hi})",
        )

    dataset = get_dataset(min_depth=lo, max_depth=hi)

    if not dataset.grid.depth:
        raise HTTPException(
            status_code=400,
            detail=f"No depth levels between {lo} and {hi}m. Dataset range is "
            f"{full_min}-{full_max}m.",
        )

    return dataset
