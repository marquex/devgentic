import { getDb } from "../db/connection.js";

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.query("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | null;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.run(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value]
  );
}

export function getTokens() {
  return {
    zaiToken: getSetting("zai_token") ?? "",
    githubToken: getSetting("github_token") ?? "",
    e2bApiKey: getSetting("e2b_api_key") ?? "",
  };
}
