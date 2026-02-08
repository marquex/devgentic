import { useCallback } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { SessionStepper } from "@/components/session/session-stepper";
import { SpecViewer } from "@/components/review/spec-viewer";
import { CommentThread } from "@/components/review/comment-thread";
import { ReviewToolbar } from "@/components/review/review-toolbar";
import { AgentOutput } from "@/components/agent/agent-output";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSession, useUpdateSession } from "@/hooks/use-sessions";
import { useAgentStream } from "@/hooks/use-agent-stream";
import type { ReviewComment, ReviewStatus } from "@devgentic/shared";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export function SessionReviewPage() {
  const { sessionId } = useParams({ from: "/sessions/$sessionId/review" });
  const navigate = useNavigate();
  const { data: session, refetch } = useSession(sessionId);
  const updateSession = useUpdateSession();
  const { events, isStreaming, start } = useAgentStream();

  const comments = session?.reviewComments ?? [];
  const unresolvedComments = comments.filter((c) => !c.resolved);

  const addComment = useCallback(
    (comment: Omit<ReviewComment, "id" | "createdAt">) => {
      const newComment: ReviewComment = {
        ...comment,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      updateSession.mutate(
        { id: sessionId, reviewComments: [...comments, newComment] },
        { onSuccess: () => refetch() }
      );
    },
    [comments, sessionId, updateSession, refetch]
  );

  const resolveComment = useCallback(
    (id: string) => {
      const updated = comments.map((c) =>
        c.id === id ? { ...c, resolved: true } : c
      );
      updateSession.mutate(
        { id: sessionId, reviewComments: updated },
        { onSuccess: () => refetch() }
      );
    },
    [comments, sessionId, updateSession, refetch]
  );

  const deleteComment = useCallback(
    (id: string) => {
      const updated = comments.filter((c) => c.id !== id);
      updateSession.mutate(
        { id: sessionId, reviewComments: updated },
        { onSuccess: () => refetch() }
      );
    },
    [comments, sessionId, updateSession, refetch]
  );

  function handleApprove() {
    updateSession.mutate(
      { id: sessionId, reviewStatus: "approved" as ReviewStatus },
      {
        onSuccess: () => {
          toast.success("Specs approved");
          refetch();
        },
      }
    );
  }

  function handleRequestChanges() {
    updateSession.mutate(
      { id: sessionId, reviewStatus: "changes_requested" as ReviewStatus },
      {
        onSuccess: () => {
          toast.info("Changes requested");
          refetch();
        },
      }
    );
  }

  async function handleFix() {
    if (!session?.specBranch) {
      toast.error("No spec branch found");
      return;
    }

    await start("/agent/spec-fix", {
      sessionId,
      repoId: session.repoId,
      specBranch: session.specBranch,
      comments: unresolvedComments.map((c) => ({
        filePath: c.filePath,
        content: c.content,
      })),
    });

    // Resolve all comments after fix
    const resolved = comments.map((c) => ({ ...c, resolved: true }));
    updateSession.mutate(
      { id: sessionId, reviewComments: resolved, reviewStatus: "pending" as ReviewStatus },
      { onSuccess: () => refetch() }
    );
  }

  function handleProceed() {
    updateSession.mutate(
      { id: sessionId, currentStep: "execute" },
      {
        onSuccess: () =>
          navigate({
            to: "/sessions/$sessionId/execute",
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
        <SessionStepper currentStep="review" />
        <ReviewToolbar
          status={session.reviewStatus}
          onApprove={handleApprove}
          onRequestChanges={handleRequestChanges}
          onFix={handleFix}
          hasUnresolvedComments={unresolvedComments.length > 0}
          isFixing={isStreaming}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            {session.specContent ? (
              <SpecViewer content={session.specContent} className="h-96" />
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                Spec content will appear here after generation.
                {session.specPrUrl && (
                  <p className="mt-2">
                    <a
                      href={session.specPrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View on GitHub
                    </a>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentThread
                comments={comments}
                onAdd={addComment}
                onResolve={resolveComment}
                onDelete={deleteComment}
              />
            </CardContent>
          </Card>

          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fix Output</CardTitle>
              </CardHeader>
              <CardContent>
                <AgentOutput events={events} className="h-48" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {session.reviewStatus === "approved" && (
        <>
          <Separator />
          <Button onClick={handleProceed}>
            Proceed to Execution
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
