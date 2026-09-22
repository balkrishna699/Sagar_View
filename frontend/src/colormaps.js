import * as THREE from 'three';

/**
 * Scientific colormaps for ocean data visualization.
 *
 * Each colormap is defined as an array of [r, g, b] stops (0–1 range).
 * Intermediate values are linearly interpolated between stops.
 *
 * Exported API consumed by:
 *   - renderer.js  (voxel coloring)
 *   - colorbar.js  (gradient drawing)
 *   - Person 3     (dropdown population via getColormapNames())
 */

/* ── Colormap lookup tables (16 stops each, linearly interpolated) ── */

const COLORMAPS = {
  /* Perceptually-uniform sequential — good default for magnitude data */
  viridis: [
    [0.267, 0.004, 0.329],
    [0.282, 0.141, 0.458],
    [0.254, 0.265, 0.530],
    [0.207, 0.372, 0.553],
    [0.164, 0.471, 0.558],
    [0.128, 0.567, 0.551],
    [0.135, 0.659, 0.518],
    [0.210, 0.747, 0.452],
    [0.361, 0.827, 0.348],
    [0.533, 0.891, 0.226],
    [0.741, 0.933, 0.114],
    [0.993, 0.906, 0.144],
  ],

  /* Warm sequential — ideal for temperature */
  plasma: [
    [0.050, 0.030, 0.528],
    [0.221, 0.023, 0.616],
    [0.373, 0.010, 0.658],
    [0.519, 0.030, 0.648],
    [0.648, 0.108, 0.584],
    [0.753, 0.201, 0.498],
    [0.840, 0.311, 0.395],
    [0.907, 0.434, 0.290],
    [0.951, 0.564, 0.190],
    [0.976, 0.700, 0.108],
    [0.976, 0.840, 0.095],
    [0.940, 0.975, 0.131],
  ],

  /* Diverging — centered on zero, good for anomalies */
  coolwarm: [
    [0.230, 0.299, 0.754],
    [0.350, 0.427, 0.840],
    [0.480, 0.558, 0.906],
    [0.610, 0.681, 0.948],
    [0.735, 0.792, 0.966],
    [0.860, 0.882, 0.950],
    [0.957, 0.858, 0.824],
    [0.946, 0.742, 0.664],
    [0.905, 0.606, 0.510],
    [0.834, 0.459, 0.370],
    [0.733, 0.302, 0.244],
    [0.600, 0.140, 0.155],
  ],

  /* Classic rainbow — familiar for oceanography */
  jet: [
    [0.000, 0.000, 0.562],
    [0.000, 0.000, 1.000],
    [0.000, 0.375, 1.000],
    [0.000, 0.688, 1.000],
    [0.000, 1.000, 1.000],
    [0.312, 1.000, 0.688],
    [0.625, 1.000, 0.375],
    [0.938, 1.000, 0.062],
    [1.000, 0.750, 0.000],
    [1.000, 0.438, 0.000],
    [1.000, 0.125, 0.000],
    [0.562, 0.000, 0.000],
  ],

  /* Ocean — dark blue deep, teal mid, warm shallow */
  ocean: [
    [0.024, 0.047, 0.118],
    [0.035, 0.090, 0.200],
    [0.055, 0.165, 0.310],
    [0.078, 0.260, 0.420],
    [0.120, 0.380, 0.490],
    [0.180, 0.500, 0.520],
    [0.280, 0.600, 0.510],
    [0.420, 0.690, 0.460],
    [0.580, 0.760, 0.390],
    [0.750, 0.820, 0.340],
    [0.900, 0.870, 0.350],
    [1.000, 0.920, 0.420],
  ],
};

/** Default colormap used when none is specified */
export const DEFAULT_COLORMAP = 'ocean';

/**
 * Return list of available colormap names (for Person 3's dropdown).
 * @returns {string[]}
 */
export function getColormapNames() {
  return Object.keys(COLORMAPS);
}

/**
 * Sample a colormap at a normalized position t ∈ [0, 1].
 *
 * @param {number} t — normalized value (clamped to [0,1])
 * @param {string} colormapName
 * @returns {THREE.Color}
 */
export function sampleColormap(t, colormapName = DEFAULT_COLORMAP) {
  const stops = COLORMAPS[colormapName] || COLORMAPS[DEFAULT_COLORMAP];
  const clamped = Math.max(0, Math.min(1, t));

  const n = stops.length - 1;
  const idx = clamped * n;
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, n);
  const frac = idx - lo;

  const r = stops[lo][0] + (stops[hi][0] - stops[lo][0]) * frac;
  const g = stops[lo][1] + (stops[hi][1] - stops[lo][1]) * frac;
  const b = stops[lo][2] + (stops[hi][2] - stops[lo][2]) * frac;

  return new THREE.Color(r, g, b);
}

/**
 * Map a data value to a colormap color.
 *
 * @param {number} value — the data value
 * @param {number} min — data range minimum
 * @param {number} max — data range maximum
 * @param {string} colormapName
 * @returns {THREE.Color}
 */
export function getColor(value, min, max, colormapName = DEFAULT_COLORMAP) {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  return sampleColormap(t, colormapName);
}

/**
 * Get the CSS color string for a normalized value (for UI elements).
 *
 * @param {number} t — normalized [0,1]
 * @param {string} colormapName
 * @returns {string} — e.g. "rgb(128, 64, 200)"
 */
export function getCSS(t, colormapName = DEFAULT_COLORMAP) {
  const c = sampleColormap(t, colormapName);
  return `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
}
