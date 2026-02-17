export type AgentEventType =
  | "text"
  | "tool_use"
  | "tool_result"
  | "status"
  | "branch_created"
  | "pr_created"
  | "phase_complete"
  | "done"
  | "error";

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  content: string;
  metadata?: {
    toolName?: string;
    branchName?: string;
    prUrl?: string;
    phase?: string;
  };
  timestamp: string;
}

export type AgentRole =
  | "specGenerator"
  | "specFixer"
  | "implementer"
  | "validator"
  | "documenter";

export interface SpecRequest {
  sessionId: string;
  repoId: string;
  prompt: string;
  baseBranch: string;
}

export interface SpecFixRequest {
  sessionId: string;
  repoId: string;
  specBranch: string;
  comments: Array<{ filePath: string; content: string }>;
}

export interface ExecuteRequest {
  sessionId: string;
  repoId: string;
  phase: "implement" | "validate" | "document";
  specBranch: string;
  executionBranch?: string;
}
