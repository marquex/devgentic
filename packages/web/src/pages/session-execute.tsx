import { useState } from "react";
import { useParams } from "@tanstack/react-router";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSession, useUpdateSession } from "@/hooks/use-sessions";
import { useAgentStream } from "@/hooks/use-agent-stream";
import type { ExecutionPhase, AgentLogEntry } from "@devgentic/shared";
import { toast } from "sonner";
import {
  Play,
  StopCircle,
  Code,
  TestTube,
  FileText,
  ExternalLink,
  GitBranch,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PHASES: { key: ExecutionPhase; label: string; icon: React.ReactNode; description: string }[] = [
  { key: "implement", label: "Implement", icon: <Code className="h-4 w-4" />, description: "Implement code changes per specs" },
  { key: "validate", label: "Validate", icon: <TestTube className="h-4 w-4" />, description: "Run and write tests" },
  { key: "document", label: "Document", icon: <FileText className="h-4 w-4" />, description: "Create/update documentation" },
];

export function SessionExecutePage() {
  const { sessionId } = useParams({ from: "/sessions/$sessionId/execute" });
  const { data: session, refetch } = useSession(sessionId);
  const updateSession = useUpdateSession();
  const { events, isStreaming, error, start, abort } = useAgentStream();

  const [runningPhase, setRunningPhase] = useState<ExecutionPhase | null>(null);
  const [completedPhases, setCompletedPhases] = useState<Set<ExecutionPhase>>(new Set());
  const [expandedPhase, setExpandedPhase] = useState<ExecutionPhase | null>(null);
  const [phaseLogs, setPhaseLogs] = useState<Record<string, AgentLogEntry[]>>({});

  const branchEvent = events.find((e) => e.type === "branch_created");
  const prEvent = events.find((e) => e.type === "pr_created");

  async function handleRunPhase(phase: ExecutionPhase) {
    if (!session?.specBranch) {
      toast.error("No spec branch found. Complete the Spec step first.");
      return;
    }

    setRunningPhase(phase);
    setExpandedPhase(phase);

    await start("/agent/execute", {
      sessionId,
      repoId: session.repoId,
      phase,
      specBranch: session.specBranch,
      executionBranch: session.executionBranch ?? undefined,
    });

    // Save logs and mark phase complete
    const logs: AgentLogEntry[] = events.map((e) => ({
      id: e.id,
      phase,
      type: e.type as AgentLogEntry["type"],
      content: e.content,
      timestamp: e.timestamp,
    }));

    setPhaseLogs((prev) => ({ ...prev, [phase]: logs }));
    setCompletedPhases((prev) => new Set([...prev, phase]));
    setRunningPhase(null);

    // Save to session
    const branchName = branchEvent?.metadata?.branchName ?? session.executionBranch;
    const prUrl = prEvent?.metadata?.prUrl ?? session.executionPrUrl;

    updateSession.mutate(
      {
        id: sessionId,
        executionPhase: phase,
        executionBranch: branchName ?? null,
        executionPrUrl: prUrl ?? null,
        executionLog: [...(session.executionLog ?? []), ...logs],
      },
      { onSuccess: () => refetch() }
    );

    toast.success(`${phase} phase completed`);
  }

  function handleComplete() {
    updateSession.mutate(
      { id: sessionId, status: "completed", currentStep: "execute" },
      {
        onSuccess: () => {
          toast.success("Session completed!");
          refetch();
        },
      }
    );
  }

  if (!session) {
    return <div className="text-muted-foreground">Loading session...</div>;
  }

  const allPhasesComplete = PHASES.every((p) => completedPhases.has(p.key));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SessionStepper currentStep="execute" />
        {runningPhase && (
          <AgentStatus isStreaming={isStreaming} error={error} isDone={false} />
        )}
      </div>

      {(session.executionBranch || branchEvent) && (
        <div className="flex flex-wrap gap-3 rounded-md border p-3 text-sm">
          <span className="flex items-center gap-1">
            <GitBranch className="h-4 w-4" />
            {branchEvent?.metadata?.branchName ?? session.executionBranch}
          </span>
          {(session.executionPrUrl || prEvent) && (
            <a
              href={prEvent?.metadata?.prUrl ?? session.executionPrUrl ?? ""}
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

      <div className="space-y-3">
        {PHASES.map((phase, index) => {
          const isComplete = completedPhases.has(phase.key);
          const isRunning = runningPhase === phase.key;
          const isExpanded = expandedPhase === phase.key;
          const canRun =
            !isStreaming &&
            !isComplete &&
            (index === 0 || completedPhases.has(PHASES[index - 1].key));

          return (
            <Card key={phase.key}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedPhase(isExpanded ? null : phase.key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="flex items-center gap-2">
                      {phase.icon}
                      <CardTitle className="text-base">{phase.label}</CardTitle>
                    </span>
                    {isComplete && (
                      <Badge className="bg-green-100 text-green-800" variant="secondary">
                        Complete
                      </Badge>
                    )}
                    {isRunning && (
                      <Badge variant="secondary">Running...</Badge>
                    )}
                  </div>
                  {canRun && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunPhase(phase.key);
                      }}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Run
                    </Button>
                  )}
                  {isRunning && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        abort();
                      }}
                    >
                      <StopCircle className="mr-1 h-3 w-3" />
                      Stop
                    </Button>
                  )}
                </div>
                <CardDescription className="ml-7">
                  {phase.description}
                </CardDescription>
              </CardHeader>
              {isExpanded && (
                <CardContent>
                  {isRunning && events.length > 0 && (
                    <AgentOutput events={events} className="h-64" />
                  )}
                  {!isRunning && phaseLogs[phase.key] && (
                    <AgentOutput
                      events={phaseLogs[phase.key].map((l) => ({
                        id: l.id,
                        type: l.type,
                        content: l.content,
                        timestamp: l.timestamp,
                      }))}
                      className="h-64"
                    />
                  )}
                  {!isRunning && !phaseLogs[phase.key] && !isComplete && (
                    <p className="text-sm text-muted-foreground">
                      {canRun
                        ? "Click Run to start this phase."
                        : "Complete the previous phase first."}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {allPhasesComplete && (
        <>
          <Separator />
          <Button onClick={handleComplete}>
            Mark Session Complete
          </Button>
        </>
      )}
    </div>
  );
}
