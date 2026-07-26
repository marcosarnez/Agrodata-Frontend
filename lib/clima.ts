/** Cliente Open-Meteo — recibe lat/lon del formulario */

export interface ClimaDatos {
  latitud: number;
  longitud: number;
  timezone?: string;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    uv_index_max: number[];
    et0_fao_evapotranspiration: number[];
    shortwave_radiation_sum: number[];
  };
  hourly: {
    time: string[];
    relative_humidity_2m: number[];
    dew_point_2m: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    soil_temperature_6cm: number[];
    soil_moisture_9_to_27cm: number[];
    vapor_pressure_deficit: number[];
  };
}

export async function extraerClimaPorGps(
  latitud: number,
  longitud: number
): Promise<ClimaDatos> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitud));
  url.searchParams.set("longitude", String(longitud));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,et0_fao_evapotranspiration,shortwave_radiation_sum"
  );
  url.searchParams.set(
    "hourly",
    "relative_humidity_2m,dew_point_2m,wind_speed_10m,wind_gusts_10m,soil_temperature_6cm,soil_moisture_9_to_27cm,vapor_pressure_deficit"
  );
  url.searchParams.set("timezone", "auto");

  const respuesta = await fetch(url.toString(), { cache: "no-store" });
  const datos = await respuesta.json();

  if (!respuesta.ok || datos.error) {
    throw new Error(datos.reason || "No se pudo obtener el clima");
  }

  return {
    latitud,
    longitud,
    timezone: datos.timezone,
    daily: datos.daily,
    hourly: datos.hourly,
  };
}
