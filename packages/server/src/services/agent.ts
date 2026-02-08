import { query, type AgentConfig } from "@anthropic-ai/claude-code";
import { ZAI_BASE_URL, ZAI_TIMEOUT_MS } from "@devgentic/shared";
import type { AgentRole } from "@devgentic/shared";

const SYSTEM_PROMPTS: Record<AgentRole, string> = {
  promptBuilder: `You are an expert prompt engineer helping a developer refine their task description.
You have read-only access to their repository using Read, Glob, and Grep tools.
Help them explore the codebase and craft a clear, detailed prompt for the next phase (spec generation).
Ask clarifying questions, suggest improvements, and point out potential issues.
When the developer is satisfied, help them finalize the prompt.`,

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

  const allowedTools =
    role === "promptBuilder"
      ? ["Read", "Glob", "Grep"]
      : ["Read", "Glob", "Grep", "Write", "Edit", "Bash"];

  const config: AgentConfig = {
    prompt,
    systemPrompt: SYSTEM_PROMPTS[role],
    allowedTools,
    cwd: repoDir,
    env: {
      ANTHROPIC_BASE_URL: ZAI_BASE_URL,
      ANTHROPIC_AUTH_TOKEN: zaiToken,
      API_TIMEOUT_MS: String(ZAI_TIMEOUT_MS),
    },
  };

  onEvent?.({ type: "status", content: `Starting ${role} agent...` });

  try {
    const result = await query(config);

    // Stream the result messages as events
    for (const message of result) {
      if (abortSignal?.aborted) break;

      if (typeof message === "string") {
        onEvent?.({ type: "text", content: message });
      } else if (message && typeof message === "object") {
        const msg = message as Record<string, unknown>;
        if (msg.type === "tool_use") {
          onEvent?.({
            type: "tool_use",
            content: `Using tool: ${msg.name}`,
            metadata: { toolName: String(msg.name || "") },
          });
        } else if (msg.type === "tool_result") {
          onEvent?.({
            type: "tool_result",
            content: String(msg.content || ""),
          });
        } else if (msg.type === "text") {
          onEvent?.({ type: "text", content: String(msg.text || msg.content || "") });
        }
      }
    }

    onEvent?.({ type: "done", content: "Agent completed" });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent failed";
    onEvent?.({ type: "error", content: message });
    throw err;
  }
}
