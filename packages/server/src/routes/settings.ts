import { Hono } from "hono";
import { updateSettingsSchema } from "@devgentic/shared";
import { getSetting, setSetting } from "../services/settings.js";

const settings = new Hono();

function mask(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 4) return "****";
  return value.slice(0, 4) + "****" + value.slice(-4);
}

// GET /api/settings — returns current token values (masked)
settings.get("/", (c) => {
  return c.json({
    zaiToken: mask(getSetting("zai_token")),
    githubToken: mask(getSetting("github_token")),
    e2bApiKey: mask(getSetting("e2b_api_key")),
  });
});

// PUT /api/settings — stores tokens in DB
settings.put("/", async (c) => {
  const body = await c.req.json();
  const parsed = updateSettingsSchema.parse(body);

  if (parsed.zaiToken !== undefined) {
    if (parsed.zaiToken) setSetting("zai_token", parsed.zaiToken);
  }
  if (parsed.githubToken !== undefined) {
    if (parsed.githubToken) setSetting("github_token", parsed.githubToken);
  }
  if (parsed.e2bApiKey !== undefined) {
    if (parsed.e2bApiKey) setSetting("e2b_api_key", parsed.e2bApiKey);
  }

  return c.json({ ok: true });
});

export default settings;
