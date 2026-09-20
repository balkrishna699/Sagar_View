   # Data Contract: Ocean Visualization API

   ## Canonical JSON Schema
   Person 5's `/data` endpoint returns:
   
   {
     "time": "2024-01-15T00:00:00Z",
     "grid": {
       "lat": [15.0, 15.1, 15.2, ...],      // length: 100
       "lon": [75.0, 75.1, 75.2, ...],      // length: 100
       "depth": [0, 10, 20, ..., 500]       // length: 50
     },
     "temperature": [[[value, ...], ...], ...],  // shape: [time][depth][lat][lon]
     "salinity": [[[value, ...], ...], ...],
     "minTemp": -2, "maxTemp": 32,
     "minSal": 30, "maxSal": 36
   }

   ## Events Person 3 Emits
   - `timeChanged`: { timestamp: "...", value: 0-100 (%) }
   - `depthChanged`: { depthIndex: 0-50 }
   - `colorbarChanged`: { variable: "temperature"|"salinity", scale: "linear"|"log" }
   - `markerClicked`: { lat, lon, depth } (sent by Person 2 via raycasting)