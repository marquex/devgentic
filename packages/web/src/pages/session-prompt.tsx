import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { SessionStepper } from "@/components/session/session-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession, useUpdateSession } from "@/hooks/use-sessions";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export function SessionPromptPage() {
  const { sessionId } = useParams({ from: "/sessions/$sessionId/prompt" });
  const navigate = useNavigate();
  const { data: session } = useSession(sessionId);
  const updateSession = useUpdateSession();

  const [prompt, setPrompt] = useState(session?.prompt ?? "");
  const [branchName, setBranchName] = useState(session?.branchName ?? `devgentic-${sessionId.slice(0, 8)}`);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    if (!branchName.trim()) {
      toast.error("Please enter a branch name");
      return;
    }

    updateSession.mutate(
      {
        id: sessionId,
        prompt,
        branchName,
        currentStep: "plan",
      },
      {
        onSuccess: () => {
          toast.success("Prompt saved");
          navigate({
            to: "/sessions/$sessionId/actions",
            params: { sessionId },
          });
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  if (!session) {
    return <div className="text-muted-foreground">Loading session...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <SessionStepper currentStep="prompt" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Define Your Task</CardTitle>
          <CardDescription>
            Describe what you want the AI agent to work on and specify the branch name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="prompt">Task Description</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the task you want the agent to work on..."
                rows={8}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="branch">Branch Name</Label>
              <Input
                id="branch"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="devgentic-feature-name"
                className="mt-1.5"
                required
              />
            </div>
            <Button type="submit" disabled={!prompt.trim() || !branchName.trim()}>
              Continue to Actions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
