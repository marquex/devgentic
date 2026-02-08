import simpleGit, { type SimpleGit } from "simple-git";
import { join } from "path";
import { homedir } from "os";
import { mkdir, rm } from "fs/promises";
import { REPO_CLONE_DIR } from "@devgentic/shared";
import * as repoDb from "../db/repos.js";

function getCloneDir(): string {
  return join(homedir(), REPO_CLONE_DIR);
}

function getRepoDir(repoId: string): string {
  return join(getCloneDir(), repoId);
}

export async function cloneRepo(repoId: string, url: string): Promise<string> {
  const cloneDir = getCloneDir();
  const repoDir = getRepoDir(repoId);

  await mkdir(cloneDir, { recursive: true });

  repoDb.updateRepo(repoId, { status: "cloning" });

  try {
    const git: SimpleGit = simpleGit();
    await git.clone(url, repoDir);

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
