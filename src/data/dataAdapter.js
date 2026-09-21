import { createOceanPoint } from "./dataTypes.js"

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

export function adaptRecord(record) {
  if (!record) return null

  const metadata = record.metadata ?? {}

  return createOceanPoint({
    latitude: toNumber(record.latitude),
    longitude: toNumber(record.longitude),

    depth: toNumber(record.depth),
    pressure: toNumber(record.pressure),

    time: record.time ?? null,

    temperature: toNumber(record.temperature),
    salinity: toNumber(record.salinity),

    u_current: toNumber(record.u_current),
    v_current: toNumber(record.v_current),

    sea_surface_height: toNumber(record.sea_surface_height),
    mixed_layer_depth: toNumber(record.mixed_layer_depth),
    tropical_cyclone_heat_potential:
      toNumber(record.tropical_cyclone_heat_potential),

    source: metadata.source ?? null,
    dataset_name: metadata.dataset_name ?? null
  })
}

export function adaptDataset(rawDataset) {
  if (!rawDataset || !Array.isArray(rawDataset.records)) {
    throw new Error(
      "Invalid ocean dataset: expected a records array."
    )
  }

  return rawDataset.records
    .map(adaptRecord)
    .filter(record => record !== null)
}
// ============================================================
// GRID DATA ADAPTER
// Used for ocean_grid.json
// ============================================================

export function adaptGridDataset(rawDataset) {

  if (!rawDataset) {
    throw new Error("No grid dataset was provided.");
  }

  if (!rawDataset.grid || !rawDataset.variables) {
    throw new Error(
      "Invalid grid dataset: expected grid and variables."
    );
  }


  const grid = rawDataset.grid;
  const variables = rawDataset.variables;


  // ----------------------------------------------------------
  // Remove the TIME dimension from the scientific variables.
  //
  // Original:
  // [TIME][DEPTH][LAT][LON]
  //
  // Our dataset currently has only one time point,
  // so [0] gives us:
  //
  // [DEPTH][LAT][LON]
  // ----------------------------------------------------------

  const temperature = variables.temperature[0];

  const salinity = variables.salinity[0];

  const uCurrent = variables.u_current[0];

  const vCurrent = variables.v_current[0];


  // ----------------------------------------------------------
  // Standardized grid object
  // ----------------------------------------------------------

  return {

    schemaVersion:
      rawDataset.schema_version ?? "1.0",

    time: grid.time,

    depth: grid.depth,

    latitude: grid.latitude,

    longitude: grid.longitude,


    temperature,

    salinity,

    uCurrent,

    vCurrent,


    dimensions: {

      depth: grid.depth.length,

      latitude: grid.latitude.length,

      longitude: grid.longitude.length

    },


    // --------------------------------------------------------
    // Get value using array indices
    // --------------------------------------------------------

    getTemperature(depthIndex, latIndex, lonIndex) {

      return temperature[
        depthIndex
      ][
        latIndex
      ][
        lonIndex
      ];

    },


    getSalinity(depthIndex, latIndex, lonIndex) {

      return salinity[
        depthIndex
      ][
        latIndex
      ][
        lonIndex
      ];

    },


    getUCurrent(depthIndex, latIndex, lonIndex) {

      return uCurrent[
        depthIndex
      ][
        latIndex
      ][
        lonIndex
      ];

    },


    getVCurrent(depthIndex, latIndex, lonIndex) {

      return vCurrent[
        depthIndex
      ][
        latIndex
      ][
        lonIndex
      ];

    }

  };

}
// ============================================================
// GRID LOOKUP FUNCTIONS
// ============================================================

function findNearestIndex(values, target) {

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Grid coordinate array is empty.");
  }

  let nearestIndex = 0;
  let smallestDifference =
    Math.abs(values[0] - target);

  for (let i = 1; i < values.length; i++) {

    const difference =
      Math.abs(values[i] - target);

    if (difference < smallestDifference) {

      smallestDifference = difference;
      nearestIndex = i;

    }

  }

  return nearestIndex;
}


// ------------------------------------------------------------
// Find nearest latitude
// ------------------------------------------------------------

export function findNearestLatitude(oceanData, latitude) {

  return findNearestIndex(
    oceanData.latitude,
    latitude
  );

}


// ------------------------------------------------------------
// Find nearest longitude
// ------------------------------------------------------------

export function findNearestLongitude(oceanData, longitude) {

  return findNearestIndex(
    oceanData.longitude,
    longitude
  );

}


// ------------------------------------------------------------
// Find nearest depth
// ------------------------------------------------------------

export function findNearestDepth(oceanData, depth) {

  return findNearestIndex(
    oceanData.depth,
    depth
  );

}


// ============================================================
// TEMPERATURE AT REAL COORDINATES
// ============================================================

export function getTemperatureAt(
  oceanData,
  latitude,
  longitude,
  depth
) {

  const latIndex =
    findNearestLatitude(
      oceanData,
      latitude
    );

  const lonIndex =
    findNearestLongitude(
      oceanData,
      longitude
    );

  const depthIndex =
    findNearestDepth(
      oceanData,
      depth
    );


  return {

    value:
      oceanData.getTemperature(
        depthIndex,
        latIndex,
        lonIndex
      ),

    latitude:
      oceanData.latitude[latIndex],

    longitude:
      oceanData.longitude[lonIndex],

    depth:
      oceanData.depth[depthIndex],

    latitudeIndex: latIndex,

    longitudeIndex: lonIndex,

    depthIndex: depthIndex

  };

}


// ============================================================
// SALINITY AT REAL COORDINATES
// ============================================================

export function getSalinityAt(
  oceanData,
  latitude,
  longitude,
  depth
) {

  const latIndex =
    findNearestLatitude(
      oceanData,
      latitude
    );

  const lonIndex =
    findNearestLongitude(
      oceanData,
      longitude
    );

  const depthIndex =
    findNearestDepth(
      oceanData,
      depth
    );


  return {

    value:
      oceanData.getSalinity(
        depthIndex,
        latIndex,
        lonIndex
      ),

    latitude:
      oceanData.latitude[latIndex],

    longitude:
      oceanData.longitude[lonIndex],

    depth:
      oceanData.depth[depthIndex],

    latitudeIndex: latIndex,

    longitudeIndex: lonIndex,

    depthIndex: depthIndex

  };

}


// ============================================================
// CURRENT AT REAL COORDINATES
// ============================================================

export function getCurrentAt(
  oceanData,
  latitude,
  longitude,
  depth
) {

  const latIndex =
    findNearestLatitude(
      oceanData,
      latitude
    );

  const lonIndex =
    findNearestLongitude(
      oceanData,
      longitude
    );

  const depthIndex =
    findNearestDepth(
      oceanData,
      depth
    );


  const u =
    oceanData.getUCurrent(
      depthIndex,
      latIndex,
      lonIndex
    );

  const v =
    oceanData.getVCurrent(
      depthIndex,
      latIndex,
      lonIndex
    );


  const magnitude =
    Math.sqrt(
      u * u + v * v
    );


  const directionRadians =
    Math.atan2(v, u);


  const directionDegrees =
    directionRadians * 180 / Math.PI;


  return {

    u,

    v,

    magnitude,

    directionDegrees,

    latitude:
      oceanData.latitude[latIndex],

    longitude:
      oceanData.longitude[lonIndex],

    depth:
      oceanData.depth[depthIndex],

    latitudeIndex: latIndex,

    longitudeIndex: lonIndex,

    depthIndex: depthIndex

  };

}