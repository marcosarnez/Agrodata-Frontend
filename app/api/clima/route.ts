import { extraerClimaPorGps } from "@/lib/clima";

/**
 * GET /api/clima?lat=-17.78&lon=-63.18
 * Recibe las coordenadas del formulario (mapa / GPS)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return Response.json(
      { error: "Parámetros lat y lon inválidos" },
      { status: 400 }
    );
  }

  try {
    const datos = await extraerClimaPorGps(lat, lon);
    return Response.json(datos);
  } catch (error) {
    console.error("Error clima:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Error al consultar clima" },
      { status: 500 }
    );
  }
}
