"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Tour step definitions ────────────────────────────────────────────────────

type TourStep = {
  /** data-tour attribute value on the element to spotlight. Omit for centered modal. */
  tourId?: string;
  title: string;
  description: string;
  /** Which roles see this step. Omit = all roles. */
  roles?: string[];
};

const ALL_STEPS: TourStep[] = [
  {
    title: "Welcome to FlowPilot 👋",
    description:
      "You're all set up. Let us walk you through the key features in about 2 minutes so you hit the ground running.",
  },
  {
    tourId: "runs",
    title: "AI-Powered Payout Runs",
    description:
      'Create payout runs by chatting with our AI. Describe who to pay and how much — FlowPilot extracts every detail and builds the candidate list for you. Click "New Run" to start.',
  },
  {
    tourId: "approvals",
    title: "Approval Workflow",
    description:
      "Before any money moves, approvers review each candidate. FlowPilot auto-flags risky or anomalous transactions so your team can focus on the edge cases that matter.",
    roles: ["owner", "approver"],
  },
  {
    tourId: "transactions",
    title: "Transactions",
    description:
      "Every disbursement is tracked here in real-time. Filter by date, export to CSV or PDF, or email the report directly to your inbox.",
  },
  {
    tourId: "team",
    title: "Team Management",
    description:
      "Invite colleagues as Analysts (view-only) or Approvers (full payout access). You can disable or remove members at any time from this page.",
    roles: ["owner"],
  },
  {
    tourId: "audit",
    title: "Audit Log",
    description:
      "Every action across your workspace is logged — who did what and when. Export the full trail for compliance, external audits, or peace of mind.",
    roles: ["owner"],
  },
  {
    tourId: "notifications",
    title: "Notifications",
    description:
      "Stay in the loop. You'll be notified when runs start, complete, fail, or need your approval — so nothing slips through.",
  },
  {
    title: "You're all set! 🎉",
    description:
      "You now know the essentials. Head to Runs and create your first payout run to get started. You can retake this tour anytime from the navbar.",
  },
];

// ── Spotlight overlay ────────────────────────────────────────────────────────

type Rect = { top: number; left: number; width: number; height: number };

function SpotlightOverlay({ rect }: { rect: Rect | null }) {
  const pad = 10;

  if (!rect) {
    return (
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 199, background: "rgba(0,0,0,0.65)" }}
      />
    );
  }

  const x = rect.left - pad;
  const y = rect.top - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;

  return (
    <svg
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 199, top: 0, left: 0, width: "100vw", height: "100vh" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id="fp-tour-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect x={x} y={y} width={w} height={h} rx="10" fill="black" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#fp-tour-mask)" />
      <rect
        x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx="12"
        fill="none" stroke="rgb(232,103,39)" strokeWidth="2.5"
        strokeDasharray="8 4" opacity="0.9"
      />
    </svg>
  );
}

// ── Main TourGuide component ─────────────────────────────────────────────────

interface TourGuideProps {
  userRole?: string | null;
  onComplete: () => void;
  onSkip: () => void;
}

export function TourGuide({ userRole, onComplete, onSkip }: TourGuideProps) {
  const steps = ALL_STEPS.filter(
    (s) => !s.roles || (userRole && s.roles.includes(userRole))
  );

  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;
  const progress = ((index + 1) / steps.length) * 100;

  const positionTooltip = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 768;

    // ── Mobile: always a bottom sheet, no spotlight ──────────────────────────
    if (isMobile) {
      setRect(null);
      setTooltipPos({
        position: "fixed",
        bottom: "0",
        left: "0",
        right: "0",
        width: "100%",
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      });
      return;
    }

    // ── Desktop: spotlight the nav element if it exists ──────────────────────
    if (!step.tourId) {
      setRect(null);
      setTooltipPos({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "380px",
        width: "calc(100vw - 32px)",
      });
      return;
    }

    const el = document.querySelector(`[data-tour="${step.tourId}"]`);
    if (!el) {
      setRect(null);
      setTooltipPos({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "380px",
        width: "calc(100vw - 32px)",
      });
      return;
    }

    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });

    const TOOLTIP_WIDTH = 320;
    const TOOLTIP_EST_HEIGHT = 240;
    const GAP = 20;

    let left: number;
    let top: number;

    const spaceRight = vw - (r.right + GAP + TOOLTIP_WIDTH);
    if (spaceRight >= 0) {
      left = r.right + GAP;
    } else if (r.left - GAP - TOOLTIP_WIDTH >= 0) {
      left = r.left - GAP - TOOLTIP_WIDTH;
    } else {
      left = Math.max(16, (vw - TOOLTIP_WIDTH) / 2);
    }

    const midY = r.top + r.height / 2;
    top = Math.max(16, Math.min(vh - TOOLTIP_EST_HEIGHT - 16, midY - TOOLTIP_EST_HEIGHT / 2));

    setTooltipPos({
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${TOOLTIP_WIDTH}px`,
    });
  }, [step]);

  useEffect(() => {
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    return () => window.removeEventListener("resize", positionTooltip);
  }, [positionTooltip]);

  const goNext = () => {
    if (isLast) onComplete();
    else setIndex((i) => i + 1);
  };

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));

  return (
    <>
      <SpotlightOverlay rect={rect} />

      {/* Tooltip / bottom-sheet card */}
      <div
        ref={tooltipRef}
        className="fixed z-[201] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden"
        style={tooltipPos}
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted/60">
          <div
            className="h-full bg-brand transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pt-0.5">
              {index + 1} / {steps.length}
            </span>
            <button
              onClick={onSkip}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close tour"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Content */}
          <h3 className="text-base font-black text-foreground leading-snug">
            {step.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {/* Dot indicators */}
          <div className="mt-4 flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-5 bg-brand"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-4 flex items-center justify-between gap-3">
            {!isFirst ? (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-4 text-muted-foreground"
                onClick={goPrev}
              >
                Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-4 text-muted-foreground"
                onClick={onSkip}
              >
                Skip
              </Button>
            )}

            <Button
              size="sm"
              className="rounded-full bg-brand px-5 text-white hover:opacity-90 shadow-sm"
              onClick={goNext}
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Done
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
