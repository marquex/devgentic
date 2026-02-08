import { cn } from "@/lib/utils";
import { SESSION_STEPS, SESSION_STEP_LABELS, type SessionStep } from "@devgentic/shared";
import { Check } from "lucide-react";

interface SessionStepperProps {
  currentStep: SessionStep;
  onStepClick?: (step: SessionStep) => void;
}

export function SessionStepper({ currentStep, onStepClick }: SessionStepperProps) {
  const currentIndex = SESSION_STEPS.indexOf(currentStep);

  return (
    <nav className="flex items-center gap-2">
      {SESSION_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step} className="flex items-center">
            {index > 0 && (
              <div
                className={cn(
                  "mx-2 h-px w-8",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <button
              onClick={() => onStepClick?.(step)}
              disabled={!onStepClick || index > currentIndex}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
                isCompleted && "bg-primary text-primary-foreground",
                isCurrent && "bg-primary/10 text-primary ring-1 ring-primary",
                !isCompleted && !isCurrent && "text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full text-xs">
                  {index + 1}
                </span>
              )}
              {SESSION_STEP_LABELS[step]}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
