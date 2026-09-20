from dataclasses import dataclass, field
from typing import Any


@dataclass
class OceanDataset:
    latitude: Any = None
    longitude: Any = None

    depth: Any = None
    pressure: Any = None

    time: Any = None

    temperature: Any = None
    salinity: Any = None

    u_current: Any = None
    v_current: Any = None

    sea_surface_height: Any = None
    mixed_layer_depth: Any = None
    tropical_cyclone_heat_potential: Any = None

    metadata: dict = field(default_factory=dict)