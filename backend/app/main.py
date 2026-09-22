from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import OceanData
from .sample_data import get_dataset

app = FastAPI(
    title="SAGAR-VIEW Backend API",
    description="Serves ocean data to the 3D visualization frontend. Schema: DATA_CONTRACT.md",
    version="0.1.0",
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
def get_data() -> OceanData:
    """Ocean data in the canonical schema from DATA_CONTRACT.md (currently fake data)."""
    return get_dataset()
