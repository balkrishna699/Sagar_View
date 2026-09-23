/**
 * Generate realistic mock ocean data matching DATA_CONTRACT.md
 * (Based on your model.py structure)
 */
export function generateMockOceanData() {
  const nLat = 20;
  const nLon = 20;
  const nDepth = 10;
  
  const lat = Array.from({length: nLat}, (_, i) => 15.0 + i * 0.05);
  const lon = Array.from({length: nLon}, (_, i) => 75.0 + i * 0.05);
  const depth = Array.from({length: nDepth}, (_, i) => i * 50);
  
  // Temperature: realistic gradient (warm surface → cold deep)
  const temperature = [];
  for (let d = 0; d < nDepth; d++) {
    const depthLayer = [];
    for (let la = 0; la < nLat; la++) {
      const latRow = [];
      for (let lo = 0; lo < nLon; lo++) {
        const baseTemp = 28 - (d / nDepth) * 15;
        const variation = Math.sin(la * 0.1) * Math.cos(lo * 0.1) * 3;
        latRow.push(baseTemp + variation);
      }
      depthLayer.push(latRow);
    }
    temperature.push(depthLayer);
  }
  
  // Salinity: slight variation
  const salinity = temperature.map(depthLayer =>
    depthLayer.map(latRow =>
      latRow.map(() => 34 + Math.random() * 2)
    )
  );

  // Current Speed: vector generation
  const u_current = [];
  const v_current = [];
  const currentSpeed = [];
  for (let d = 0; d < nDepth; d++) {
    const depthLayerU = [];
    const depthLayerV = [];
    const depthLayerSpeed = [];
    for (let la = 0; la < nLat; la++) {
      const latRowU = [];
      const latRowV = [];
      const latRowSpeed = [];
      for (let lo = 0; lo < nLon; lo++) {
        // Mock current vectors (decreasing speed with depth)
        const u = Math.sin(la * 0.2) * (1 - d / nDepth) * 1.2;
        const v = Math.cos(lo * 0.2) * (1 - d / nDepth) * 1.2;
        const speed = Math.sqrt(u * u + v * v);
        latRowU.push(u);
        latRowV.push(v);
        latRowSpeed.push(speed);
      }
      depthLayerU.push(latRowU);
      depthLayerV.push(latRowV);
      depthLayerSpeed.push(latRowSpeed);
    }
    u_current.push(depthLayerU);
    v_current.push(depthLayerV);
    currentSpeed.push(depthLayerSpeed);
  }
  
  return {
    time: new Date().toISOString(),
    grid: { lat, lon, depth },
    temperature,
    salinity,
    u_current,
    v_current,
    currentSpeed,
    minTemp: 10, maxTemp: 32,
    minSal: 30, maxSal: 36,
    minSpeed: 0, maxSpeed: 1.7
  };
}