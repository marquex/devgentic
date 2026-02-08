import { Button } from "@/components/ui/button";
import type { ReviewStatus } from "@devgentic/shared";
import { CheckCircle, XCircle, Wrench } from "lucide-react";

interface ReviewToolbarProps {
  status: ReviewStatus;
  onApprove: () => void;
  onRequestChanges: () => void;
  onFix: () => void;
  hasUnresolvedComments: boolean;
  isFixing: boolean;
}

export function ReviewToolbar({
  status,
  onApprove,
  onRequestChanges,
  onFix,
  hasUnresolvedComments,
  isFixing,
}: ReviewToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      {status === "changes_requested" && hasUnresolvedComments && (
        <Button onClick={onFix} disabled={isFixing} variant="secondary">
          <Wrench className="mr-1 h-4 w-4" />
          {isFixing ? "Fixing..." : "Fix Specs"}
        </Button>
      )}
      <Button
        onClick={onRequestChanges}
        variant="outline"
        disabled={status === "changes_requested"}
      >
        <XCircle className="mr-1 h-4 w-4" />
        Request Changes
      </Button>
      <Button
        onClick={onApprove}
        disabled={status === "approved" || hasUnresolvedComments}
      >
        <CheckCircle className="mr-1 h-4 w-4" />
        Approve
      </Button>
    </div>
  );
}
