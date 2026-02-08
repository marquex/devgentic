import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface AgentStatusProps {
  isStreaming: boolean;
  error: string | null;
  isDone: boolean;
}

export function AgentStatus({ isStreaming, error, isDone }: AgentStatusProps) {
  if (error) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Error
      </Badge>
    );
  }
  if (isStreaming) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </Badge>
    );
  }
  if (isDone) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3" />
        Done
      </Badge>
    );
  }
  return (
    <Badge variant="outline">Idle</Badge>
  );
}
