import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const tablas = await client.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
`);

console.log("=== TABLAS ===");
console.log(tablas.rows.map((r) => r.table_name).join("\n") || "(sin tablas)");

for (const { table_name } of tablas.rows) {
  const cols = await client.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position;`,
    [table_name]
  );
  console.log(`\n=== ${table_name} ===`);
  for (const c of cols.rows) {
    console.log(
      `  ${c.column_name}  ${c.data_type}  ${c.is_nullable === "NO" ? "NOT NULL" : "NULL"}  ${c.column_default ?? ""}`
    );
  }
  const count = await client.query(`SELECT COUNT(*) FROM "${table_name}";`);
  console.log(`  -> filas: ${count.rows[0].count}`);
}

await client.end();
