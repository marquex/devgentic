import { query } from "@anthropic-ai/claude-code";
import { ZAI_BASE_URL, ZAI_TIMEOUT_MS } from "@devgentic/shared";
import type { AgentRole } from "@devgentic/shared";

const SYSTEM_PROMPTS: Record<AgentRole, string> = {
  specGenerator: `You are a spec generator. Given a task description, create detailed specifications.
Create spec files in a 'specs/' directory on the current branch.
Include: overview, requirements, architecture decisions, file changes, and acceptance criteria.
Use markdown format for all spec files.`,

  specFixer: `You are a spec fixer. Review comments have been provided on the specifications.
Update the spec files to address each comment. Explain what you changed.`,

  implementer: `You are an implementation agent. Follow the specifications exactly.
Implement the code changes described in the specs.
Write clean, well-structured code following existing patterns in the codebase.`,

  validator: `You are a validation agent. Run existing tests and write new ones.
Ensure the implementation matches the specifications.
Fix any failing tests and add missing test coverage.`,

  documenter: `You are a documentation agent. Create and update documentation.
Write clear README updates, API docs, and inline code comments.
Follow existing documentation patterns in the codebase.`,
};

interface AgentRunOptions {
  role: AgentRole;
  prompt: string;
  repoDir: string;
  zaiToken: string;
  onEvent?: (event: { type: string; content: string; metadata?: Record<string, string> }) => void;
  abortSignal?: AbortSignal;
}

export async function runAgent(options: AgentRunOptions) {
  const { role, prompt, repoDir, zaiToken, onEvent, abortSignal } = options;

  onEvent?.({ type: "status", content: `Starting ${role} agent...` });

  try {
    const response = query({
      prompt,
      options: {
        customSystemPrompt: SYSTEM_PROMPTS[role],
        allowedTools: ["Read", "Glob", "Grep", "Write", "Edit", "Bash"],
        cwd: repoDir,
        env: {
          ANTHROPIC_BASE_URL: ZAI_BASE_URL,
          ANTHROPIC_AUTH_TOKEN: zaiToken,
          API_TIMEOUT_MS: String(ZAI_TIMEOUT_MS),
        },
        abortController: abortSignal ? { signal: abortSignal } as unknown as AbortController : undefined,
      },
    });

    // Stream the result messages as events
    for await (const message of response) {
      if (abortSignal?.aborted) break;

      if (typeof message === "string") {
        onEvent?.({ type: "text", content: message });
      } else if (message && typeof message === "object") {
        const msg = message as Record<string, unknown>;
        if (msg.type === "result" && msg.subtype === "success") {
          onEvent?.({ type: "done", content: "Agent completed" });
        } else if (msg.type === "stream_event") {
          const event = msg.event as Record<string, unknown>;
          if (event.type === "tool_use") {
            onEvent?.({
              type: "tool_use",
              content: `Using tool: ${event.name}`,
              metadata: { toolName: String(event.name || "") },
            });
          } else if (event.type === "text") {
            onEvent?.({ type: "text", content: String(event.text || "") });
          } else if (event.type === "tool_result") {
            onEvent?.({ type: "tool_result", content: "Tool completed" });
          }
        } else if (msg.type === "result" && msg.subtype === 'error_during_execution') {
          onEvent?.({ type: "error", content: "Agent encountered an error during execution" });
        }
      }
    }

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent failed";
    onEvent?.({ type: "error", content: message });
    throw err;
  }
}
