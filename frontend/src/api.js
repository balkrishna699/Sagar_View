/**
 * Fetch ocean data from Person 5's backend
 * Expects endpoint: http://localhost:8000/data
 * Returns JSON matching DATA_CONTRACT.md
 *
 * Supported filters (Day 2):
 *   - time:     ISO-8601 timestamp
 *   - minDepth: metres (>= 0), keep depth levels >= this value
 *   - maxDepth: metres (>= 0), keep depth levels <= this value
 */
export async function fetchOceanData(filters = {}) {
  // Strip undefined/null values so they don't appear as "undefined" in the URL
  const cleanFilters = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') {
      cleanFilters[k] = v;
    }
  }

  const query = new URLSearchParams(cleanFilters).toString();
  const url = `http://localhost:8000/data${query ? '?' + query : ''}`;

  try {
    const response = await fetch(url);

    // Person 5's Day 2: handle 400 (bad depth range) and 422 (validation) gracefully
    if (response.status === 400 || response.status === 422) {
      const err = await response.json().catch(() => ({}));
      console.warn(`⚠️ API ${response.status}:`, err.detail || 'Bad request');
      return null;
    }

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

/**
 * Fetch a depth-filtered subset from the backend.
 * Convenience wrapper using Person 5's Day 2 minDepth/maxDepth params.
 *
 * @param {number} minDepth — metres (inclusive)
 * @param {number} maxDepth — metres (inclusive)
 * @param {object} [extraFilters] — additional query params (e.g. { time })
 * @returns {Promise<object|null>}
 */
export async function fetchOceanDataByDepthRange(minDepth, maxDepth, extraFilters = {}) {
  return fetchOceanData({ ...extraFilters, minDepth, maxDepth });
}

/**
 * Check if the backend is reachable.
 * @returns {Promise<boolean>}
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch('http://localhost:8000/health');
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
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