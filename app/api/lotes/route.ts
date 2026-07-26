import { Pool } from "pg";

// Pool compartido entre peticiones (se reutiliza en dev gracias a globalThis)
const globalForPg = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });

globalForPg.pgPool = pool;

interface LotePayload {
  nombre: string;
  superficie: number;
  cultivo: string;
  humedadSuelo?: number;
  phSuelo?: number;
  materiaOrganica?: string;
  latitud: number;
  longitud: number;
}

export async function POST(request: Request) {
  let body: LotePayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  if (
    !body.nombre ||
    typeof body.superficie !== "number" ||
    !body.cultivo ||
    typeof body.latitud !== "number" ||
    typeof body.longitud !== "number"
  ) {
    return Response.json(
      { error: "Faltan campos obligatorios (nombre, superficie, cultivo, latitud, longitud)" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `INSERT INTO lotes_agricolas
         (nombre_lote, superhectareas, cultivo, latitud, longitud,
          humedad_suelo, ph_suelo, materia_organica)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, fecha_registro;`,
      [
        body.nombre,
        body.superficie,
        body.cultivo,
        body.latitud,
        body.longitud,
        body.humedadSuelo ?? null,
        body.phSuelo ?? null,
        body.materiaOrganica ?? null,
      ]
    );

    const { id, fecha_registro } = result.rows[0];
    return Response.json({ id_lote: id, fecha_registro });
  } catch (error) {
    console.error("Error al insertar lote:", error);
    return Response.json(
      { error: "No se pudo guardar el lote en la base de datos" },
      { status: 500 }
    );
  }
}
