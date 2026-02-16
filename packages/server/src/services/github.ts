import { Octokit } from "octokit";
import simpleGit from "simple-git";
import { AppError } from "../lib/errors.js";

interface CreatePROptions {
  repoDir: string;
  head: string;
  base: string;
  title: string;
  body: string;
  githubToken: string;
}

export function parseGitHubUrl(remoteUrl: string): { owner: string; repo: string } {
  // Handle HTTPS and SSH URLs
  const httpsMatch = remoteUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
  if (httpsMatch) return { owner: httpsMatch[1], repo: httpsMatch[2] };

  const sshMatch = remoteUrl.match(/github\.com:([^/]+)\/([^/.]+)/);
  if (sshMatch) return { owner: sshMatch[1], repo: sshMatch[2] };

  throw new Error(`Cannot parse GitHub URL from remote: ${remoteUrl}`);
}

export async function createPullRequest(options: CreatePROptions): Promise<string> {
  const { repoDir, head, base, title, body, githubToken } = options;

  const git = simpleGit(repoDir);
  const remotes = await git.getRemotes(true);
  const origin = remotes.find((r) => r.name === "origin");
  if (!origin) throw new Error("No origin remote found");

  const { owner, repo } = parseGitHubUrl(origin.refs.fetch || origin.refs.push);

  const octokit = new Octokit({ auth: githubToken });

  try {
    const { data } = await octokit.rest.pulls.create({
      owner,
      repo,
      head,
      base,
      title,
      body,
    });
    return data.html_url;
  } catch (err: unknown) {
    // If PR already exists, find and return it
    if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 422) {
      const { data: pulls } = await octokit.rest.pulls.list({
        owner,
        repo,
        head: `${owner}:${head}`,
        base,
        state: "open",
      });
      if (pulls.length > 0) return pulls[0].html_url;
    }
    throw err;
  }
}

export async function checkRepoAccess(url: string, githubToken: string): Promise<void> {
  if (!githubToken) {
    throw new AppError("GitHub token is not configured. Please add it in Settings.", 400);
  }

  const { owner, repo } = parseGitHubUrl(url);
  const octokit = new Octokit({ auth: githubToken });

  try {
    await octokit.rest.repos.get({ owner, repo });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err) {
      const status = (err as { status: number }).status;
      if (status === 404 || status === 403) {
        throw new AppError(
          `Cannot access repository ${owner}/${repo}. It may not exist or your GitHub token may lack permission.`,
          status === 403 ? 403 : 404
        );
      }
    }
    throw err;
  }
}
