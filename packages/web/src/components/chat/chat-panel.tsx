import { useEffect, useRef } from "react";
import type { ChatMessage } from "@devgentic/shared";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { Loader2 } from "lucide-react";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isStreaming: boolean;
  streamingContent?: string;
}

export function ChatPanel({ messages, onSend, isStreaming, streamingContent }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isStreaming && streamingContent && (
            <MessageBubble
              message={{
                id: "streaming",
                role: "assistant",
                content: streamingContent,
                timestamp: new Date().toISOString(),
              }}
            />
          )}
          {isStreaming && !streamingContent && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Agent is thinking...
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <ChatInput
          onSend={onSend}
          disabled={isStreaming}
          placeholder="Describe your task or ask a question about the repo..."
        />
      </div>
    </div>
  );
}
