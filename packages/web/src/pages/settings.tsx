import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConfig } from "@/hooks/use-config";
import { toast } from "sonner";

export function SettingsPage() {
  const { config, updateConfig } = useConfig();
  const [zaiToken, setZaiToken] = useState(config.zaiToken ?? "");
  const [githubToken, setGithubToken] = useState(config.githubToken ?? "");
  const [e2bApiKey, setE2bApiKey] = useState(config.e2bApiKey ?? "");

  function handleSave() {
    updateConfig({
      zaiToken: zaiToken || null,
      githubToken: githubToken || null,
      e2bApiKey: e2bApiKey || null,
    });
    toast.success("Settings saved");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure API tokens for agent execution and GitHub integration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Z.ai Token</CardTitle>
          <CardDescription>
            Authentication token for Z.ai API (GLM models via Anthropic-compatible endpoint).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="zai-token">Token</Label>
          <Input
            id="zai-token"
            type="password"
            value={zaiToken}
            onChange={(e) => setZaiToken(e.target.value)}
            placeholder="Enter your Z.ai token"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GitHub Token</CardTitle>
          <CardDescription>
            Personal access token for creating pull requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="github-token">Token</Label>
          <Input
            id="github-token"
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>E2B API Key</CardTitle>
          <CardDescription>
            API key for E2B sandboxed agent execution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="e2b-key">API Key</Label>
          <Input
            id="e2b-key"
            type="password"
            value={e2bApiKey}
            onChange={(e) => setE2bApiKey(e.target.value)}
            placeholder="e2b_..."
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave}>Save Settings</Button>
    </div>
  );
}
