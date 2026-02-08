import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { SessionStepper } from "@/components/session/session-stepper";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession, useUpdateSession } from "@/hooks/use-sessions";
import { useAgentStream } from "@/hooks/use-agent-stream";
import type { ChatMessage } from "@devgentic/shared";
import { toast } from "sonner";
import { CheckCircle, StopCircle } from "lucide-react";

export function SessionPromptPage() {
  const { sessionId } = useParams({ from: "/sessions/$sessionId/prompt" });
  const navigate = useNavigate();
  const { data: session } = useSession(sessionId);
  const updateSession = useUpdateSession();
  const { events, isStreaming, start, abort } = useAgentStream();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initialized, setInitialized] = useState(false);
  const pendingMessagesRef = useRef<ChatMessage[]>([]);

  // Load chat history from session when it first loads
  useEffect(() => {
    if (session && !initialized) {
      setMessages(session.chatHistory ?? []);
      setInitialized(true);
    }
  }, [session, initialized]);

  // Accumulate streaming text from events
  const streamingContent = useMemo(() => {
    return events
      .filter((e) => e.type === "text")
      .map((e) => e.content)
      .join("");
  }, [events]);

  // When streaming completes, finalize assistant message
  const prevStreaming = useRef(false);
  useEffect(() => {
    if (prevStreaming.current && !isStreaming) {
      const assistantContent = events
        .filter((e) => e.type === "text")
        .map((e) => e.content)
        .join("");

      if (assistantContent) {
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantContent,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => {
          const withAssistant = [...prev, assistantMsg];
          updateSession.mutate({
            id: sessionId,
            chatHistory: withAssistant,
          });
          return withAssistant;
        });
      }
    }
    prevStreaming.current = isStreaming;
  }, [isStreaming, events, sessionId, updateSession]);

  const handleSend = useCallback(
    async (message: string) => {
      if (!session) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, userMsg];
        pendingMessagesRef.current = updated;
        updateSession.mutate({
          id: sessionId,
          chatHistory: updated,
        });
        return updated;
      });

      // Start agent stream
      await start("/agent/chat", {
        sessionId,
        repoId: session.repoId,
        message,
        history: [...pendingMessagesRef.current].map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
    },
    [session, sessionId, updateSession, start]
  );

  function handleFinalize() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const finalPrompt = lastUser?.content ?? "";

    updateSession.mutate(
      {
        id: sessionId,
        finalPrompt,
        currentStep: "spec",
      },
      {
        onSuccess: () => {
          toast.success("Prompt finalized");
          navigate({
            to: "/sessions/$sessionId/spec",
            params: { sessionId },
          });
        },
      }
    );
  }

  if (!session) {
    return <div className="text-muted-foreground">Loading session...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <SessionStepper currentStep="prompt" />
        <div className="flex gap-2">
          {isStreaming && (
            <Button variant="outline" size="sm" onClick={abort}>
              <StopCircle className="mr-1 h-4 w-4" />
              Stop
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleFinalize}
            disabled={messages.length === 0 || isStreaming}
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Finalize Prompt
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden">
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
        />
      </Card>
    </div>
  );
}
