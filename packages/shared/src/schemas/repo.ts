import { z } from "zod";

export const createRepoSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  url: z
    .string()
    .url("Must be a valid URL")
    .regex(/github\.com|gitlab\.com|bitbucket\.org/i, "Must be a Git hosting URL"),
});

export const updateRepoSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  defaultBranch: z.string().min(1).max(100).optional(),
});

export type CreateRepoSchema = z.infer<typeof createRepoSchema>;
export type UpdateRepoSchema = z.infer<typeof updateRepoSchema>;
