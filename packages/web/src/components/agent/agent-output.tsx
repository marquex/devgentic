import type { AgentEvent } from "@devgentic/shared";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Terminal,
  Wrench,
  CheckCircle,
  AlertCircle,
  GitBranch,
  ExternalLink,
} from "lucide-react";

interface AgentOutputProps {
  events: AgentEvent[];
  className?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  text: <Terminal className="h-3 w-3" />,
  tool_use: <Wrench className="h-3 w-3" />,
  tool_result: <CheckCircle className="h-3 w-3" />,
  status: <Badge variant="outline" className="text-xs">Status</Badge>,
  branch_created: <GitBranch className="h-3 w-3 text-green-600" />,
  pr_created: <ExternalLink className="h-3 w-3 text-blue-600" />,
  phase_complete: <CheckCircle className="h-3 w-3 text-green-600" />,
  error: <AlertCircle className="h-3 w-3 text-red-600" />,
  done: <CheckCircle className="h-3 w-3 text-green-600" />,
};

export function AgentOutput({ events, className }: AgentOutputProps) {
  return (
    <ScrollArea className={cn("rounded-md border bg-muted/30 p-4", className)}>
      <div className="space-y-2 font-mono text-xs">
        {events.map((event) => (
          <div
            key={event.id}
            className={cn(
              "flex items-start gap-2",
              event.type === "error" && "text-destructive"
            )}
          >
            <span className="mt-0.5 shrink-0">
              {typeIcons[event.type] ?? <Terminal className="h-3 w-3" />}
            </span>
            <span className="whitespace-pre-wrap break-all">
              {event.content}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
