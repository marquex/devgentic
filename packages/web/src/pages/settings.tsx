import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { SettingsResponse } from "@devgentic/shared";

export function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings } = useQuery<SettingsResponse>({
    queryKey: ["settings"],
    queryFn: () => api.get("/settings"),
  });

  const [zaiToken, setZaiToken] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [e2bApiKey, setE2bApiKey] = useState("");

  useEffect(() => {
    if (settings) {
      setZaiToken(settings.zaiToken ?? "");
      setGithubToken(settings.githubToken ?? "");
      setE2bApiKey(settings.e2bApiKey ?? "");
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (body: { zaiToken?: string; githubToken?: string; e2bApiKey?: string }) =>
      api.put("/settings", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    },
  });

  function handleSave() {
    mutation.mutate({
      zaiToken: zaiToken || undefined,
      githubToken: githubToken || undefined,
      e2bApiKey: e2bApiKey || undefined,
    });
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

      <Button onClick={handleSave} disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
