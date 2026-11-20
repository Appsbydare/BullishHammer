// Applies SQL files in db/migrations in name order, once each.
// Usage: npm run db:migrate   (reads DATABASE_URL from .env.local)
import { Pool } from "@neondatabase/serverless";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, "..", "db", "migrations");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const { rows } = await client.query("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(dir, file), "utf8");
    process.stdout.write(`Applying ${file} ... `);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log("done");
    } catch (err) {
      await client.query("ROLLBACK");
      console.log("failed");
      throw err;
    }
  }
  console.log("Migrations up to date.");
} finally {
  client.release();
  await pool.end();
}
