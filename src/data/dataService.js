import { adaptGridDataset } from "./dataAdapter.js";

const DATA_URL = "/data/ocean_grid.json";

export async function loadOceanData() {
  const response = await fetch(DATA_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to load ocean data: HTTP ${response.status}`
    );
  }

  const rawDataset = await response.json();

  return adaptGridDataset(rawDataset);
}