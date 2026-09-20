/**
 * Fetch ocean data from Person 5's backend
 * Expects endpoint: http://localhost:8000/data
 * Returns JSON matching DATA_CONTRACT.md
 */
export async function fetchOceanData(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const url = `http://localhost:8000/data${query ? '?' + query : ''}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log('✅ Real ocean data fetched:', data);
    return data;
  } catch (error) {
    console.error('❌ API error:', error);
    console.warn('Falling back to mock data');
    return null;
  }
}

// Cache for time series (from Person 2's profile charts)
let timeSeriesCache = {};

export async function fetchTimeSeriesAt(lat, lon) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  if (timeSeriesCache[key]) return timeSeriesCache[key];
  
  try {
    const response = await fetch(
      `http://localhost:8000/timeseries?lat=${lat}&lon=${lon}`
    );
    const data = await response.json();
    timeSeriesCache[key] = data;
    return data;
  } catch (error) {
    console.error('Failed to fetch time series:', error);
    return null;
  }
}