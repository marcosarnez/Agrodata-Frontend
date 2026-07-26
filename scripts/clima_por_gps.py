"""
Consulta el clima en Open-Meteo usando latitud y longitud.

Uso:
    python scripts/clima_por_gps.py -17.7833 -63.1821

Estas coordenadas deben venir del formulario (mapa / GPS) cuando
el usuario hace clic en "Evaluar Recomendación de Siembra".
En la app Next.js se llama a GET /api/clima?lat=...&lon=...
"""

import json
import sys

import requests


def extraer_clima_total_gps(latitud: float, longitud: float) -> dict | None:
    url = "https://api.open-meteo.com/v1/forecast"
    parametros = {
        "latitude": latitud,
        "longitude": longitud,
        "daily": (
            "temperature_2m_max,temperature_2m_min,precipitation_sum,"
            "precipitation_probability_max,uv_index_max,"
            "et0_fao_evapotranspiration,shortwave_radiation_sum"
        ),
        "hourly": (
            "relative_humidity_2m,dew_point_2m,wind_speed_10m,wind_gusts_10m,"
            "soil_temperature_6cm,soil_moisture_9_to_27cm,vapor_pressure_deficit"
        ),
        "timezone": "auto",
    }

    respuesta = requests.get(url, params=parametros, timeout=60)
    datos = respuesta.json()

    if "error" in datos:
        print("Error de la API:", datos)
        return None

    return datos


def main() -> None:
    if len(sys.argv) < 3:
        print("Uso: python clima_por_gps.py <latitud> <longitud>")
        print("Ejemplo: python clima_por_gps.py -17.7833 -63.1821")
        sys.exit(1)

    latitud = float(sys.argv[1])
    longitud = float(sys.argv[2])

    print(f"Consultando clima para Lat: {latitud}, Lon: {longitud}...")
    datos = extraer_clima_total_gps(latitud, longitud)

    if not datos:
        sys.exit(1)

    print("\nTemperaturas máximas (7 días):")
    print(datos["daily"]["temperature_2m_max"])
    print("\nJSON completo (resumen):")
    print(json.dumps({
        "timezone": datos.get("timezone"),
        "daily_time": datos["daily"]["time"],
        "temperature_2m_max": datos["daily"]["temperature_2m_max"],
        "temperature_2m_min": datos["daily"]["temperature_2m_min"],
        "precipitation_sum": datos["daily"]["precipitation_sum"],
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
