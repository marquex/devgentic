import { useParams } from "@tanstack/react-router";
import { SessionStepper } from "@/components/session/session-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/use-sessions";
import { ArrowRight, FileText, Code, CheckCircle2, FileEdit } from "lucide-react";

export function SessionActionsPage() {
  const { sessionId } = useParams({ from: "/sessions/$sessionId/actions" });
  const { data: session } = useSession(sessionId);

  if (!session) {
    return <div className="text-muted-foreground">Loading session...</div>;
  }

  const actions = [
    {
      step: "plan" as const,
      title: "Generate Specification",
      description: "Create detailed specifications for your task",
      icon: FileText,
      path: `/sessions/${sessionId}/plan`,
    },
    {
      step: "implement" as const,
      title: "Implement Changes",
      description: "Write the code based on the specifications",
      icon: Code,
      path: `/sessions/${sessionId}/implement`,
    },
    {
      step: "validate" as const,
      title: "Validate Implementation",
      description: "Run tests and verify the implementation",
      icon: CheckCircle2,
      path: `/sessions/${sessionId}/validate`,
    },
    {
      step: "document" as const,
      title: "Document Changes",
      description: "Create and update documentation",
      icon: FileEdit,
      path: `/sessions/${sessionId}/document`,
    },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <SessionStepper currentStep="plan" />
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">{session.name}</h2>
        <p className="text-muted-foreground">
          Branch: <code className="text-sm">{session.branchName}</code>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.step} className="hover:bg-accent/50 transition-colors">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full justify-between group"
                  onClick={() => (window.location.href = action.path)}
                >
                  Run {action.step}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
