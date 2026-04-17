"use client";

import { useEffect, useRef, useCallback } from "react";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "mousedown", "touchstart", "scroll", "click"] as const;

/**
 * Calls `onIdle` after `timeoutMs` of user inactivity.
 * Optionally calls `onWarn` at `warnBeforeMs` before the timeout fires.
 *
 * Uses both setTimeout and a visibilitychange check so the timeout fires
 * correctly on mobile — browsers suspend JS timers when a tab is backgrounded,
 * so we record the deadline timestamp and verify it on page-visible.
 */
export function useIdleTimeout({
  timeoutMs = 30 * 60 * 1000,
  warnBeforeMs = 5 * 60 * 1000,
  onIdle,
  onWarn,
  enabled = true,
}: {
  timeoutMs?: number;
  warnBeforeMs?: number;
  onIdle: () => void;
  onWarn?: () => void;
  enabled?: boolean;
}) {
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onIdleRef = useRef(onIdle);
  const onWarnRef = useRef(onWarn);
  const idleDeadline = useRef<number>(0);

  useEffect(() => { onIdleRef.current = onIdle; }, [onIdle]);
  useEffect(() => { onWarnRef.current = onWarn; }, [onWarn]);

  const reset = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);

    idleDeadline.current = Date.now() + timeoutMs;


    const warnAt = timeoutMs - warnBeforeMs;
    if (onWarnRef.current && warnAt > 0) {
      warnTimer.current = setTimeout(() => onWarnRef.current?.(), warnAt);
    }
    idleTimer.current = setTimeout(() => onIdleRef.current(), timeoutMs);
  }, [timeoutMs, warnBeforeMs]);

  useEffect(() => {
    if (!enabled) return;

    reset();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    // When the page becomes visible again (e.g. user returns to a backgrounded
    // mobile tab), check if the idle deadline has already passed.
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && idleDeadline.current && Date.now() >= idleDeadline.current) {
        onIdleRef.current();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);


    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warnTimer.current) clearTimeout(warnTimer.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, reset]);
}
