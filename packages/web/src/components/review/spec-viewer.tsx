import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SpecViewerProps {
  content: string;
  className?: string;
}

export function SpecViewer({ content, className }: SpecViewerProps) {
  return (
    <ScrollArea className={cn("rounded-md border p-6", className)}>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </ScrollArea>
  );
}
