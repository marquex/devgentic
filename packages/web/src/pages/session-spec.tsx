import { useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { SessionStepper } from "@/components/session/session-stepper";
import { AgentOutput } from "@/components/agent/agent-output";
import { AgentStatus } from "@/components/agent/agent-status";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession, useUpdateSession } from "@/hooks/use-sessions";
import { useAgentStream } from "@/hooks/use-agent-stream";
import { toast } from "sonner";
import { Play, ArrowRight, StopCircle, GitBranch, ExternalLink } from "lucide-react";

export function SessionSpecPage() {
  const { sessionId } = useParams({ from: "/sessions/$sessionId/spec" });
  const navigate = useNavigate();
  const { data: session } = useSession(sessionId);
  const updateSession = useUpdateSession();
  const { events, isStreaming, error, start, abort } = useAgentStream();

  const isDone = events.some((e) => e.type === "done");
  const branchEvent = events.find((e) => e.type === "branch_created");
  const prEvent = events.find((e) => e.type === "pr_created");

  const branchName = branchEvent?.metadata?.branchName ?? session?.specBranch;
  const prUrl = prEvent?.metadata?.prUrl ?? session?.specPrUrl;

  async function handleGenerate() {
    if (!session?.finalPrompt) {
      toast.error("No finalized prompt found. Go back to the Prompt step.");
      return;
    }

    await start("/agent/spec", {
      sessionId,
      repoId: session.repoId,
      prompt: session.finalPrompt,
      baseBranch: "main",
    });
  }

  // Save branch/PR info when done
  useMemo(() => {
    if (isDone && (branchName || prUrl)) {
      updateSession.mutate({
        id: sessionId,
        specBranch: branchName ?? null,
        specPrUrl: prUrl ?? null,
      });
    }
  }, [isDone, branchName, prUrl]);

  function handleProceed() {
    updateSession.mutate(
      { id: sessionId, currentStep: "review" },
      {
        onSuccess: () =>
          navigate({
            to: "/sessions/$sessionId/review",
            params: { sessionId },
          }),
      }
    );
  }

  if (!session) {
    return <div className="text-muted-foreground">Loading session...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SessionStepper currentStep="spec" />
        <AgentStatus isStreaming={isStreaming} error={error} isDone={isDone} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spec Generation</CardTitle>
          <CardDescription>
            Generate specifications from your finalized prompt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {session.finalPrompt && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium text-muted-foreground">Prompt:</p>
              <p className="mt-1 whitespace-pre-wrap">{session.finalPrompt}</p>
            </div>
          )}

          <div className="flex gap-2">
            {!isStreaming && !isDone && (
              <Button onClick={handleGenerate}>
                <Play className="mr-1 h-4 w-4" />
                Generate Specs
              </Button>
            )}
            {isStreaming && (
              <Button variant="outline" onClick={abort}>
                <StopCircle className="mr-1 h-4 w-4" />
                Stop
              </Button>
            )}
          </div>

          {events.length > 0 && <AgentOutput events={events} className="h-80" />}

          {(branchName || prUrl) && (
            <div className="flex flex-wrap gap-3 rounded-md border p-3 text-sm">
              {branchName && (
                <span className="flex items-center gap-1">
                  <GitBranch className="h-4 w-4" />
                  {branchName}
                </span>
              )}
              {prUrl && (
                <a
                  href={prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View PR
                </a>
              )}
            </div>
          )}

          {isDone && (
            <Button onClick={handleProceed}>
              Proceed to Review
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
