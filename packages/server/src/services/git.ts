import simpleGit, { type SimpleGit } from "simple-git";
import { join, resolve } from "path";
import { mkdir, rm } from "fs/promises";
import { REPO_CLONE_DIR } from "@devgentic/shared";
import * as repoDb from "../db/repos.js";

// Resolve to monorepo root: this file is at packages/server/src/services/git.ts
const PROJECT_ROOT = resolve(import.meta.dir, "../../../..");

function getCloneDir(): string {
  return join(PROJECT_ROOT, REPO_CLONE_DIR);
}

function getRepoDir(repoId: string): string {
  return join(getCloneDir(), repoId);
}

export async function cloneRepo(repoId: string, url: string, githubToken?: string): Promise<string> {
  const cloneDir = getCloneDir();
  const repoDir = getRepoDir(repoId);

  await mkdir(cloneDir, { recursive: true });

  repoDb.updateRepo(repoId, { status: "cloning" });

  try {
    // Inject GitHub token into HTTPS URL for authentication
    let cloneUrl = url;
    if (githubToken && url.includes("github.com") && url.startsWith("https://")) {
      cloneUrl = url.replace("https://github.com", `https://x-access-token:${githubToken}@github.com`);
      console.log(`[git] Cloning repo ${repoId} with GitHub token authentication`);
    } else {
      console.log(`[git] Cloning repo ${repoId} without token (token: ${githubToken ? "present" : "missing"}, url: ${url})`);
    }

    const git: SimpleGit = simpleGit();
    await git.clone(cloneUrl, repoDir);

    const repoGit = simpleGit(repoDir);
    const branch = (await repoGit.branchLocal()).current;

    repoDb.updateRepo(repoId, {
      status: "ready",
      localPath: repoDir,
      defaultBranch: branch,
      error: null,
    });

    return repoDir;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Clone failed";
    repoDb.updateRepo(repoId, { status: "error", error: message });
    throw err;
  }
}

export async function deleteClone(repoId: string): Promise<void> {
  const repoDir = getRepoDir(repoId);
  try {
    await rm(repoDir, { recursive: true, force: true });
  } catch {
    // ignore if directory doesn't exist
  }
}

export async function createBranch(
  repoDir: string,
  branchName: string,
  baseBranch: string
): Promise<void> {
  const git = simpleGit(repoDir);
  await git.checkout(baseBranch);
  await git.pull("origin", baseBranch);
  await git.checkoutLocalBranch(branchName);
}

export async function pushBranch(
  repoDir: string,
  branchName: string
): Promise<void> {
  const git = simpleGit(repoDir);
  await git.push("origin", branchName, ["--set-upstream"]);
}

export async function getRepoPath(repoId: string): Promise<string | null> {
  const repo = repoDb.getRepo(repoId);
  return repo?.localPath ?? null;
}

export async function getDefaultBranch(repoId: string): Promise<string> {
  const repo = repoDb.getRepo(repoId);
  if (!repo?.defaultBranch) {
    throw new Error(`Repository ${repoId} not found or has no default branch`);
  }
  return repo.defaultBranch;
}
