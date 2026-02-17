export const ZAI_BASE_URL = "https://api.z.ai/api/anthropic";
export const ZAI_TIMEOUT_MS = 3_000_000;

export const SESSION_STEPS = ["prompt", "plan", "implement", "validate", "document"] as const;

export const SESSION_STEP_LABELS: Record<(typeof SESSION_STEPS)[number], string> = {
  prompt: "Prompt",
  plan: "Plan",
  implement: "Implement",
  validate: "Validate",
  document: "Document",
};

export const REPO_CLONE_DIR = "repos";

export const IDB_NAME = "devgentic";
export const IDB_VERSION = 1;
export const IDB_SESSIONS_STORE = "sessions";
