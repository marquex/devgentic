import type { Session } from "@devgentic/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { SESSION_STEP_LABELS } from "@devgentic/shared";
import { ArrowRight, Archive, Trash2 } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  archived: "bg-gray-100 text-gray-800",
};

interface SessionCardProps {
  session: Session;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

export function SessionCard({ session, onDelete, onArchive }: SessionCardProps) {
  const stepPath = `/sessions/${session.id}/${session.currentStep}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{session.name}</CardTitle>
        <Badge className={statusColors[session.status] ?? ""} variant="secondary">
          {session.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <span>Repo: {session.repoName}</span>
          <span className="mx-2">|</span>
          <span>Step: {SESSION_STEP_LABELS[session.currentStep]}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1">
            {session.status === "active" && (
              <Button variant="ghost" size="sm" onClick={() => onArchive(session.id)}>
                <Archive className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(session.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {session.status === "active" && (
            <Button variant="outline" size="sm" asChild>
              <Link to={stepPath}>
                Continue
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
