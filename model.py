from dataclasses import dataclass
from typing import Any


@dataclass
class OceanDataset:
    latitude: Any = None
    longitude: Any = None
    depth: Any = None
    time: Any = None

    temperature: Any = None
    salinity: Any = None

    u_current: Any = None
    v_current: Any = None

    chlorophyll: Any = None

    metadata: dict = None   