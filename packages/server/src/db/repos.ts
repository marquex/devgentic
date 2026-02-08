import type { Repo, RepoStatus } from "@devgentic/shared";
import { getDb } from "./connection.js";

interface RepoRow {
  id: string;
  name: string;
  url: string;
  local_path: string | null;
  status: string;
  error: string | null;
  default_branch: string;
  created_at: string;
  updated_at: string;
}

function rowToRepo(row: RepoRow): Repo {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    localPath: row.local_path,
    status: row.status as RepoStatus,
    error: row.error,
    defaultBranch: row.default_branch,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listRepos(): Repo[] {
  const db = getDb();
  const rows = db.query("SELECT * FROM repos ORDER BY created_at DESC").all() as RepoRow[];
  return rows.map(rowToRepo);
}

export function getRepo(id: string): Repo | null {
  const db = getDb();
  const row = db.query("SELECT * FROM repos WHERE id = ?").get(id) as RepoRow | null;
  return row ? rowToRepo(row) : null;
}

export function createRepo(id: string, name: string, url: string): Repo {
  const db = getDb();
  db.query(
    "INSERT INTO repos (id, name, url, status) VALUES (?, ?, ?, 'pending')"
  ).run(id, name, url);
  return getRepo(id)!;
}

export function updateRepo(
  id: string,
  updates: Partial<{
    name: string;
    localPath: string;
    status: RepoStatus;
    error: string | null;
    defaultBranch: string;
  }>
): Repo | null {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    sets.push("name = ?");
    values.push(updates.name);
  }
  if (updates.localPath !== undefined) {
    sets.push("local_path = ?");
    values.push(updates.localPath);
  }
  if (updates.status !== undefined) {
    sets.push("status = ?");
    values.push(updates.status);
  }
  if (updates.error !== undefined) {
    sets.push("error = ?");
    values.push(updates.error);
  }
  if (updates.defaultBranch !== undefined) {
    sets.push("default_branch = ?");
    values.push(updates.defaultBranch);
  }

  if (sets.length === 0) return getRepo(id);

  sets.push("updated_at = datetime('now')");
  values.push(id);

  db.query(`UPDATE repos SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return getRepo(id);
}

export function deleteRepo(id: string): boolean {
  const db = getDb();
  const result = db.query("DELETE FROM repos WHERE id = ?").run(id);
  return result.changes > 0;
}
