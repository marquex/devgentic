import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { ZodError } from "zod";
import { AppError } from "./lib/errors.js";
import health from "./routes/health.js";
import repos from "./routes/repos.js";
import agent from "./routes/agent.js";

export function createApp() {
  const app = new Hono();

  // Middleware
  app.use("*", logger());
  app.use(
    "*",
    cors({
      origin: ["http://localhost:5173"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "X-Zai-Token", "X-Github-Token", "X-E2b-Key"],
    })
  );

  // Routes
  app.route("/api/health", health);
  app.route("/api/repos", repos);
  app.route("/api/agent", agent);

  // Error handler
  app.onError((err, c) => {
    if (err instanceof ZodError) {
      return c.json(
        { error: "Validation failed", details: err.errors },
        400
      );
    }
    if (err instanceof AppError) {
      return c.json(
        { error: err.message, code: err.code },
        err.statusCode as any
      );
    }
    console.error("Unhandled error:", err);
    return c.json({ error: "Internal server error" }, 500);
  });

  return app;
}
