import type { Session } from "@devgentic/shared";
import { SessionCard } from "./session-card";

interface SessionListProps {
  sessions: Session[];
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

export function SessionList({ sessions, onDelete, onArchive }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No sessions yet. Create one to start an agentic workflow.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onDelete={onDelete}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}
