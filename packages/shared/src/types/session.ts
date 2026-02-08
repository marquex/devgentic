export type SessionStep = "create" | "prompt" | "spec" | "review" | "execute";
export type SessionStatus = "active" | "completed" | "archived";
export type ReviewStatus = "pending" | "approved" | "changes_requested";
export type ExecutionPhase = "implement" | "validate" | "document";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ReviewComment {
  id: string;
  filePath: string;
  lineNumber: number | null;
  content: string;
  resolved: boolean;
  createdAt: string;
}

export interface AgentLogEntry {
  id: string;
  phase: ExecutionPhase;
  type: "text" | "tool_use" | "tool_result" | "status" | "error";
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  name: string;
  repoId: string;
  repoName: string;
  currentStep: SessionStep;
  status: SessionStatus;
  chatHistory: ChatMessage[];
  finalPrompt: string | null;
  specBranch: string | null;
  specPrUrl: string | null;
  specContent: string | null;
  reviewComments: ReviewComment[];
  reviewStatus: ReviewStatus;
  executionPhase: ExecutionPhase | null;
  executionBranch: string | null;
  executionPrUrl: string | null;
  executionLog: AgentLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionInput {
  name: string;
  repoId: string;
  repoName: string;
}
