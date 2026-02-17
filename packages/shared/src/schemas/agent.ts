import { z } from "zod";

export const specRequestSchema = z.object({
  sessionId: z.string().min(1),
  repoId: z.string().min(1),
  prompt: z.string().min(1),
  branchName: z.string().min(1),
});

export const specFixRequestSchema = z.object({
  sessionId: z.string().min(1),
  repoId: z.string().min(1),
  specBranch: z.string().min(1),
  comments: z.array(
    z.object({
      filePath: z.string(),
      content: z.string(),
    })
  ),
});

export const executeRequestSchema = z.object({
  sessionId: z.string().min(1),
  repoId: z.string().min(1),
  phase: z.enum(["implement", "validate", "document"]),
  specBranch: z.string().min(1),
  executionBranch: z.string().optional(),
});
