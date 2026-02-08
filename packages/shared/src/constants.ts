export const ZAI_BASE_URL = "https://api.z.ai/api/anthropic";
export const ZAI_TIMEOUT_MS = 3_000_000;

export const SESSION_STEPS = ["create", "prompt", "spec", "review", "execute"] as const;

export const SESSION_STEP_LABELS: Record<(typeof SESSION_STEPS)[number], string> = {
  create: "Create",
  prompt: "Prompt",
  spec: "Spec",
  review: "Review",
  execute: "Execute",
};

export const REPO_CLONE_DIR = ".devgentic/repos";

export const IDB_NAME = "devgentic";
export const IDB_VERSION = 1;
export const IDB_SESSIONS_STORE = "sessions";
