import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRepos } from "@/hooks/use-repos";
import { useCreateSession } from "@/hooks/use-sessions";
import { toast } from "sonner";

export function SessionCreatePage() {
  const navigate = useNavigate();
  const { data: repos } = useRepos();
  const createSession = useCreateSession();
  const readyRepos = repos?.filter((r) => r.status === "ready") ?? [];
  const [name, setName] = useState("");
  const [repoId, setRepoId] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const repo = readyRepos.find((r) => r.id === repoId);
    if (!repo) {
      toast.error("Please select a repository");
      return;
    }

    const sessionId = crypto.randomUUID();
    createSession.mutate(
      { id: sessionId, name, repoId: repo.id, repoName: repo.name },
      {
        onSuccess: () => {
          toast.success("Session created");
          navigate({ to: "/sessions/$sessionId/prompt", params: { sessionId } });
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Session</CardTitle>
          <CardDescription>
            Start a new agentic development workflow session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="session-name">Session Name</Label>
              <Input
                id="session-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Add authentication feature"
                required
              />
            </div>
            <div>
              <Label>Repository</Label>
              <Select value={repoId} onValueChange={setRepoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a repository" />
                </SelectTrigger>
                <SelectContent>
                  {readyRepos.map((repo) => (
                    <SelectItem key={repo.id} value={repo.id}>
                      {repo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {readyRepos.length === 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  No ready repositories. Add one in the Repos page.
                </p>
              )}
            </div>
            <Button type="submit" disabled={!name || !repoId}>
              Create Session
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
