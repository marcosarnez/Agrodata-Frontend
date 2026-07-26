import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const r = await client.query(`
  SELECT id, nombre_lote, superhectareas, cultivo, latitud, longitud,
         humedad_suelo, ph_suelo, materia_organica, fecha_registro
  FROM lotes_agricolas
  ORDER BY id DESC
  LIMIT 20;
`);

console.log(`Últimos ${r.rows.length} lotes registrados:\n`);
console.table(r.rows);

await client.end();
