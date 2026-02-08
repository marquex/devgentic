import { Hono } from "hono";
import { createRepoSchema, updateRepoSchema } from "@devgentic/shared";
import * as repoDb from "../db/repos.js";
import { cloneRepo, deleteClone } from "../services/git.js";
import { NotFoundError } from "../lib/errors.js";

const repos = new Hono();

// List all repos
repos.get("/", (c) => {
  const allRepos = repoDb.listRepos();
  return c.json(allRepos);
});

// Get single repo
repos.get("/:id", (c) => {
  const repo = repoDb.getRepo(c.req.param("id"));
  if (!repo) throw new NotFoundError("Repo", c.req.param("id"));
  return c.json(repo);
});

// Create repo + start async clone
repos.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createRepoSchema.parse(body);

  const id = crypto.randomUUID();
  const repo = repoDb.createRepo(id, parsed.name, parsed.url);

  // Start async clone — don't await
  cloneRepo(id, parsed.url).catch((err) => {
    console.error(`Clone failed for ${id}:`, err);
  });

  return c.json(repo, 201);
});

// Update repo
repos.put("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = repoDb.getRepo(id);
  if (!existing) throw new NotFoundError("Repo", id);

  const body = await c.req.json();
  const parsed = updateRepoSchema.parse(body);

  const updated = repoDb.updateRepo(id, parsed);
  return c.json(updated);
});

// Delete repo + local clone
repos.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = repoDb.getRepo(id);
  if (!existing) throw new NotFoundError("Repo", id);

  await deleteClone(id);
  repoDb.deleteRepo(id);

  return c.json({ ok: true });
});

export default repos;
