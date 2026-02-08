export type RepoStatus = "pending" | "cloning" | "ready" | "error";

export interface Repo {
  id: string;
  name: string;
  url: string;
  localPath: string | null;
  status: RepoStatus;
  error: string | null;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRepoInput {
  name: string;
  url: string;
}

export interface UpdateRepoInput {
  name?: string;
  defaultBranch?: string;
}
