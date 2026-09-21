export function createOceanPoint({
  latitude,
  longitude,
  depth = null,
  pressure = null,
  time = null,
  temperature = null,
  salinity = null,
  u_current = null,
  v_current = null,
  sea_surface_height = null,
  mixed_layer_depth = null,
  tropical_cyclone_heat_potential = null,
  source = null,
  dataset_name = null
}) {
  const current_speed =
    u_current !== null && v_current !== null
      ? Math.sqrt(u_current ** 2 + v_current ** 2)
      : null

  const current_direction =
    u_current !== null && v_current !== null
      ? Math.atan2(v_current, u_current) * (180 / Math.PI)
      : null

  return {
    latitude,
    longitude,
    depth,
    pressure,
    time,

    temperature,
    salinity,

    u_current,
    v_current,

    current_speed,
    current_direction,

    sea_surface_height,
    mixed_layer_depth,
    tropical_cyclone_heat_potential,

    source,
    dataset_name
  }
}