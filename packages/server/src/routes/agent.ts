import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import {
  chatRequestSchema,
  specRequestSchema,
  specFixRequestSchema,
  executeRequestSchema,
} from "@devgentic/shared";
import { runAgent } from "../services/agent.js";
import { getRepoPath } from "../services/git.js";
import { ValidationError } from "../lib/errors.js";

const agent = new Hono();

function getToken(c: { req: { header: (name: string) => string | undefined } }, name: string): string {
  const val = c.req.header(name);
  if (!val) throw new ValidationError(`Missing ${name} header`);
  return val;
}

// POST /api/agent/chat — Prompt-building chat turn (SSE)
agent.post("/chat", async (c) => {
  const body = await c.req.json();
  const parsed = chatRequestSchema.parse(body);
  const zaiToken = getToken(c, "X-Zai-Token");

  const repoDir = await getRepoPath(parsed.repoId);
  if (!repoDir) throw new ValidationError("Repository not found or not cloned");

  // Build full prompt from history + new message
  const historyText = parsed.history
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");
  const fullPrompt = historyText
    ? `${historyText}\n\nUser: ${parsed.message}`
    : parsed.message;

  return streamSSE(c, async (stream) => {
    let eventId = 0;

    await runAgent({
      role: "promptBuilder",
      prompt: fullPrompt,
      repoDir,
      zaiToken,
      onEvent: async (event) => {
        await stream.writeSSE({
          id: String(eventId++),
          event: "message",
          data: JSON.stringify({
            id: String(eventId),
            type: event.type,
            content: event.content,
            metadata: event.metadata,
            timestamp: new Date().toISOString(),
          }),
        });
      },
    });

    await stream.writeSSE({
      id: String(eventId),
      event: "message",
      data: "[DONE]",
    });
  });
});

// POST /api/agent/spec — Generate specs (SSE)
agent.post("/spec", async (c) => {
  const body = await c.req.json();
  const parsed = specRequestSchema.parse(body);
  const zaiToken = getToken(c, "X-Zai-Token");
  const githubToken = c.req.header("X-Github-Token") ?? "";

  const repoDir = await getRepoPath(parsed.repoId);
  if (!repoDir) throw new ValidationError("Repository not found or not cloned");

  return streamSSE(c, async (stream) => {
    let eventId = 0;
    const sendEvent = async (event: { type: string; content: string; metadata?: Record<string, string> }) => {
      await stream.writeSSE({
        id: String(eventId++),
        event: "message",
        data: JSON.stringify({
          id: String(eventId),
          type: event.type,
          content: event.content,
          metadata: event.metadata,
          timestamp: new Date().toISOString(),
        }),
      });
    };

    // Import git/github services for branch/PR operations
    const { createBranch, pushBranch } = await import("../services/git.js");
    const branchName = `devgentic/spec-${parsed.sessionId.slice(0, 8)}`;

    try {
      await createBranch(repoDir, branchName, parsed.baseBranch);
      await sendEvent({
        type: "branch_created",
        content: `Branch ${branchName} created`,
        metadata: { branchName },
      });
    } catch (err) {
      // Branch may already exist
      await sendEvent({ type: "status", content: `Using existing branch ${branchName}` });
    }

    await runAgent({
      role: "specGenerator",
      prompt: `Generate specifications for the following task:\n\n${parsed.prompt}\n\nCreate spec files in a 'specs/' directory.`,
      repoDir,
      zaiToken,
      onEvent: sendEvent,
    });

    // Push and create PR
    try {
      await pushBranch(repoDir, branchName);
      await sendEvent({ type: "status", content: "Pushed specs to remote" });

      if (githubToken) {
        const { createPullRequest } = await import("../services/github.js");
        const prUrl = await createPullRequest({
          repoDir,
          head: branchName,
          base: parsed.baseBranch,
          title: `[Devgentic] Specs: ${parsed.prompt.slice(0, 60)}`,
          body: "Auto-generated specifications by Devgentic agent.",
          githubToken,
        });
        await sendEvent({
          type: "pr_created",
          content: `PR created: ${prUrl}`,
          metadata: { prUrl },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Push/PR failed";
      await sendEvent({ type: "error", content: msg });
    }

    await stream.writeSSE({
      id: String(eventId),
      event: "message",
      data: "[DONE]",
    });
  });
});

// POST /api/agent/spec-fix — Fix specs from review comments (SSE)
agent.post("/spec-fix", async (c) => {
  const body = await c.req.json();
  const parsed = specFixRequestSchema.parse(body);
  const zaiToken = getToken(c, "X-Zai-Token");

  const repoDir = await getRepoPath(parsed.repoId);
  if (!repoDir) throw new ValidationError("Repository not found or not cloned");

  const commentsText = parsed.comments
    .map((cm) => `File: ${cm.filePath}\nComment: ${cm.content}`)
    .join("\n\n");

  return streamSSE(c, async (stream) => {
    let eventId = 0;
    const sendEvent = async (event: { type: string; content: string; metadata?: Record<string, string> }) => {
      await stream.writeSSE({
        id: String(eventId++),
        event: "message",
        data: JSON.stringify({
          id: String(eventId),
          type: event.type,
          content: event.content,
          metadata: event.metadata,
          timestamp: new Date().toISOString(),
        }),
      });
    };

    // Checkout the spec branch
    const simpleGit = (await import("simple-git")).default;
    const git = simpleGit(repoDir);
    await git.checkout(parsed.specBranch);

    await runAgent({
      role: "specFixer",
      prompt: `Fix the specifications based on these review comments:\n\n${commentsText}`,
      repoDir,
      zaiToken,
      onEvent: sendEvent,
    });

    // Push fixes
    try {
      const { pushBranch } = await import("../services/git.js");
      await pushBranch(repoDir, parsed.specBranch);
      await sendEvent({ type: "status", content: "Pushed spec fixes" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Push failed";
      await sendEvent({ type: "error", content: msg });
    }

    await stream.writeSSE({
      id: String(eventId),
      event: "message",
      data: "[DONE]",
    });
  });
});

// POST /api/agent/execute — Run implement/validate/document phase (SSE)
agent.post("/execute", async (c) => {
  const body = await c.req.json();
  const parsed = executeRequestSchema.parse(body);
  const zaiToken = getToken(c, "X-Zai-Token");
  const githubToken = c.req.header("X-Github-Token") ?? "";

  const repoDir = await getRepoPath(parsed.repoId);
  if (!repoDir) throw new ValidationError("Repository not found or not cloned");

  const roleMap = {
    implement: "implementer",
    validate: "validator",
    document: "documenter",
  } as const;

  const promptMap = {
    implement: "Implement the code changes described in the specs/ directory.",
    validate: "Run and write tests for the implementation. Fix any failures.",
    document: "Create and update documentation based on the specs and implementation.",
  };

  return streamSSE(c, async (stream) => {
    let eventId = 0;
    const sendEvent = async (event: { type: string; content: string; metadata?: Record<string, string> }) => {
      await stream.writeSSE({
        id: String(eventId++),
        event: "message",
        data: JSON.stringify({
          id: String(eventId),
          type: event.type,
          content: event.content,
          metadata: event.metadata,
          timestamp: new Date().toISOString(),
        }),
      });
    };

    // Setup execution branch
    const branchName = parsed.executionBranch ?? `devgentic/exec-${parsed.sessionId.slice(0, 8)}`;
    const simpleGit = (await import("simple-git")).default;
    const git = simpleGit(repoDir);

    try {
      const { createBranch } = await import("../services/git.js");
      await createBranch(repoDir, branchName, parsed.specBranch);
      await sendEvent({
        type: "branch_created",
        content: `Execution branch ${branchName} created`,
        metadata: { branchName },
      });
    } catch {
      await git.checkout(branchName);
      await sendEvent({ type: "status", content: `Using existing branch ${branchName}` });
    }

    await runAgent({
      role: roleMap[parsed.phase],
      prompt: promptMap[parsed.phase],
      repoDir,
      zaiToken,
      onEvent: sendEvent,
    });

    await sendEvent({
      type: "phase_complete",
      content: `${parsed.phase} phase completed`,
      metadata: { phase: parsed.phase },
    });

    // Push after each phase
    try {
      const { pushBranch } = await import("../services/git.js");
      await pushBranch(repoDir, branchName);
      await sendEvent({ type: "status", content: "Pushed changes" });

      // Create PR on final phase
      if (parsed.phase === "document" && githubToken) {
        const { createPullRequest } = await import("../services/github.js");
        const prUrl = await createPullRequest({
          repoDir,
          head: branchName,
          base: parsed.specBranch,
          title: `[Devgentic] Implementation`,
          body: "Auto-generated implementation by Devgentic agent.",
          githubToken,
        });
        await sendEvent({
          type: "pr_created",
          content: `PR created: ${prUrl}`,
          metadata: { prUrl },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Push failed";
      await sendEvent({ type: "error", content: msg });
    }

    await stream.writeSSE({
      id: String(eventId),
      event: "message",
      data: "[DONE]",
    });
  });
});

export default agent;
