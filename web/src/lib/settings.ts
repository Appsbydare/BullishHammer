import "server-only";
import { query } from "@/lib/db";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const [row] = await query<{ value: T }>("SELECT value FROM settings WHERE key = $1", [key]);
  return row ? row.value : fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, JSON.stringify(value)],
  );
}
