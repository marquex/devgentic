import { Sandbox } from "@e2b/code-interpreter";

export interface SandboxInstance {
  sandbox: Sandbox;
  workDir: string;
}

export async function createAgentSandbox(
  repoUrl: string,
  branch: string,
  e2bApiKey: string
): Promise<SandboxInstance> {
  const sandbox = await Sandbox.create({ apiKey: e2bApiKey });

  await sandbox.commands.run(
    `git clone ${repoUrl} /workspace && cd /workspace && git checkout ${branch}`,
    { timeout: 120_000 }
  );

  return { sandbox, workDir: "/workspace" };
}

export async function destroySandbox(sandbox: Sandbox): Promise<void> {
  try {
    await sandbox.kill();
  } catch {
    // ignore cleanup errors
  }
}
