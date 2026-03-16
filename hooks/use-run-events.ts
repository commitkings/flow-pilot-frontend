"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "@/lib/token-storage";
import { getRunEventsStreamUrl } from "@/lib/api-client";
import type {
  RunEvent,
  RunEventType,
  StepStartedPayload,
  TERMINAL_EVENT_TYPES,
} from "@/lib/event-types";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected";

export interface UseRunEventsReturn {
  /** All received events in order */
  events: RunEvent[];
  /** The currently running step (from latest step_started not yet completed/failed) */
  currentStep: StepStartedPayload | null;
  /** Whether the stream is live (connected and not terminated) */
  isLive: boolean;
  /** Connection status */
  connectionStatus: ConnectionStatus;
  /** Manually disconnect */
  disconnect: () => void;
}

const TERMINAL_TYPES = new Set<RunEventType>(["run_completed", "run_failed"]);
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECTS = 5;

/**
 * SSE streaming hook for real-time run events.
 * Uses fetch() + ReadableStream to support Authorization header.
 */
export function useRunEvents(runId: string, enabled: boolean): UseRunEventsReturn {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [currentStep, setCurrentStep] = useState<StepStartedPayload | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [isLive, setIsLive] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const lastSeqRef = useRef(0);
  const reconnectCountRef = useRef(0);
  const terminatedRef = useRef(false);

  const disconnect = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setConnectionStatus("disconnected");
    setIsLive(false);
  }, []);

  const processEvent = useCallback((event: RunEvent) => {
    setEvents((prev) => {
      // Deduplicate by seq
      if (prev.length > 0 && prev[prev.length - 1].seq >= event.seq) {
        return prev;
      }
      return [...prev, event];
    });

    lastSeqRef.current = Math.max(lastSeqRef.current, event.seq);

    // Track current step
    if (event.type === "step_started") {
      setCurrentStep(event.payload as StepStartedPayload);
    } else if (event.type === "step_completed" || event.type === "step_failed") {
      setCurrentStep(null);
    }

    // Terminal events
    if (TERMINAL_TYPES.has(event.type)) {
      terminatedRef.current = true;
      setIsLive(false);
    }
  }, []);

  const connect = useCallback(async () => {
    if (terminatedRef.current) return;

    const token = getToken();
    if (!token) {
      setConnectionStatus("disconnected");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setConnectionStatus("connecting");

    try {
      const url = getRunEventsStreamUrl(runId, lastSeqRef.current);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE request failed: ${response.status}`);
      }

      setConnectionStatus("connected");
      setIsLive(true);
      reconnectCountRef.current = 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE messages from buffer
        const messages = buffer.split("\n\n");
        // Keep the last incomplete chunk in buffer
        buffer = messages.pop() ?? "";

        for (const msg of messages) {
          if (!msg.trim() || msg.trim().startsWith(":")) continue;

          const lines = msg.split("\n");
          let eventType = "";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              data = line.slice(6);
            } else if (line.startsWith("id: ")) {
              // seq is also in the data payload
            }
          }

          if (eventType === "done") {
            terminatedRef.current = true;
            setIsLive(false);
            return;
          }

          if (data) {
            try {
              const parsed = JSON.parse(data) as RunEvent;
              processEvent(parsed);
            } catch {
              // Skip malformed events
            }
          }
        }
      }

      // Stream ended naturally
      if (!terminatedRef.current) {
        setConnectionStatus("disconnected");
        setIsLive(false);
      }
    } catch (err) {
      if (controller.signal.aborted) return;

      setConnectionStatus("disconnected");
      setIsLive(false);

      // Auto-reconnect if not terminated and under limit
      if (!terminatedRef.current && reconnectCountRef.current < MAX_RECONNECTS) {
        reconnectCountRef.current += 1;
        setTimeout(() => {
          if (!terminatedRef.current) connect();
        }, RECONNECT_DELAY_MS);
      }
    }
  }, [runId, processEvent]);

  useEffect(() => {
    if (!enabled || !runId) {
      setConnectionStatus("idle");
      return;
    }

    // Reset state for new run
    setEvents([]);
    setCurrentStep(null);
    lastSeqRef.current = 0;
    reconnectCountRef.current = 0;
    terminatedRef.current = false;

    connect();

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [runId, enabled, connect]);

  return { events, currentStep, isLive, connectionStatus, disconnect };
}
