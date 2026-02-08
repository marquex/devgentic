import { useState, useCallback, useRef } from "react";
import type { AgentEvent } from "@devgentic/shared";
import { api } from "@/lib/api";
import { readSSE } from "@/lib/sse";

interface UseAgentStreamReturn {
  events: AgentEvent[];
  isStreaming: boolean;
  error: string | null;
  start: (path: string, body: unknown) => Promise<void>;
  abort: () => void;
  reset: () => void;
}

export function useAgentStream(): UseAgentStreamReturn {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (path: string, body: unknown) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setEvents([]);
    setIsStreaming(true);
    setError(null);

    try {
      const response = await api.stream(path, body, controller.signal);

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: "Stream failed" }));
        throw new Error(errBody.error || `HTTP ${response.status}`);
      }

      for await (const event of readSSE(response, controller.signal)) {
        if (event.type === "error") {
          setError(event.content);
        }
        setEvents((prev) => [...prev, event]);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Stream failed");
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setEvents([]);
    setError(null);
  }, []);

  return { events, isStreaming, error, start, abort, reset };
}
