"use client";

import { useMemo } from "react";
import { subDays, format, startOfDay } from "date-fns";
import { BarChart2, PieChart, Gauge } from "lucide-react";

import { useRuns } from "@/hooks/use-run-queries";
import { useTransactions } from "@/hooks/use-transaction-queries";

// ── Helpers ──────────────────────────────────────────────────────────────────

const BRAND = "#e86727";

function formatCurrencyShort(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

// ── Volume Trend (7-day bar chart) ───────────────────────────────────────────

interface DayBucket {
  label: string; // e.g. "Mon"
  dateKey: string; // e.g. "2026-04-07"
  total: number;
}

function buildVolumeBuckets(
  transactions: Array<{ date: string | null; amount: number }> | undefined
): DayBucket[] {
  const today = startOfDay(new Date());

  const buckets: DayBucket[] = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(today, 6 - i);
    return {
      label: format(day, "EEE"),
      dateKey: format(day, "yyyy-MM-dd"),
      total: 0,
    };
  });

  const keySet = new Set(buckets.map((b) => b.dateKey));

  (transactions ?? []).forEach((tx) => {
    if (!tx.date) return;
    const key = tx.date.slice(0, 10); // "yyyy-MM-dd"
    if (!keySet.has(key)) return;
    const bucket = buckets.find((b) => b.dateKey === key);
    if (bucket) bucket.total += tx.amount;
  });

  return buckets;
}

function VolumeBarchart({ buckets, isLoading }: { buckets: DayBucket[]; isLoading: boolean }) {
  const maxVal = Math.max(...buckets.map((b) => b.total), 1);
  const BAR_W = 22;
  const GAP = 10;
  const CHART_H = 72;
  const WIDTH = buckets.length * (BAR_W + GAP) - GAP;

  if (isLoading) {
    return (
      <div className="flex items-end gap-2.5 h-[72px] mt-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-md bg-muted animate-pulse"
            style={{ height: `${30 + Math.sin(i) * 20 + 20}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${CHART_H + 18}`}
      width="100%"
      preserveAspectRatio="none"
      className="mt-3 overflow-visible"
      style={{ maxHeight: 90 }}
    >
      {buckets.map((b, i) => {
        const isToday = i === buckets.length - 1;
        const barH = Math.max(4, Math.round((b.total / maxVal) * CHART_H));
        const x = i * (BAR_W + GAP);
        const y = CHART_H - barH;
        const opacity = isToday ? 1 : 0.45 + (i / buckets.length) * 0.45;

        return (
          <g key={b.dateKey}>
            <rect
              x={x}
              y={y}
              width={BAR_W}
              height={barH}
              rx={4}
              fill={BRAND}
              fillOpacity={opacity}
            />
            <text
              x={x + BAR_W / 2}
              y={CHART_H + 14}
              textAnchor="middle"
              fontSize={9}
              fontWeight={isToday ? "700" : "500"}
              fill="currentColor"
              className="text-muted-foreground"
              opacity={isToday ? 1 : 0.65}
            >
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Run Outcomes (donut) ─────────────────────────────────────────────────────

interface RunCounts {
  completed: number;
  failed: number;
  pending: number;
  total: number;
}

function buildRunCounts(runs: Array<{ status: string }> | undefined): RunCounts {
  const counts = { completed: 0, failed: 0, pending: 0, total: 0 };
  (runs ?? []).forEach((r) => {
    counts.total++;
    if (r.status === "completed" || r.status === "completed_with_errors") counts.completed++;
    else if (r.status === "failed") counts.failed++;
    else counts.pending++;
  });
  return counts;
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle - 90));
  const y1 = cy + r * Math.sin(toRad(startAngle - 90));
  const x2 = cx + r * Math.cos(toRad(endAngle - 90));
  const y2 = cy + r * Math.sin(toRad(endAngle - 90));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function DonutChart({ counts, isLoading }: { counts: RunCounts; isLoading: boolean }) {
  const CX = 44;
  const CY = 44;
  const R = 34;
  const STROKE = 12;
  const r = R - STROKE / 2;

  const segments = useMemo(() => {
    if (!counts.total) return [];
    const slices = [
      { value: counts.completed, color: BRAND },
      { value: counts.failed, color: "#ef4444" },
      { value: counts.pending, color: "#d1d5db" },
    ].filter((s) => s.value > 0);

    let currentAngle = 0;
    return slices.map((s) => {
      const sweep = (s.value / counts.total) * 360;
      const start = currentAngle;
      currentAngle += sweep;
      return { ...s, startAngle: start, endAngle: currentAngle };
    });
  }, [counts]);

  if (isLoading) {
    return (
      <div className="flex justify-center mt-3">
        <div className="h-[88px] w-[88px] rounded-full border-[12px] border-muted animate-pulse" />
      </div>
    );
  }

  if (!counts.total) {
    return (
      <div className="flex justify-center mt-3">
        <svg viewBox="0 0 88 88" width={88} height={88}>
          <circle cx={CX} cy={CY} r={r} fill="none" stroke="#e5e7eb" strokeWidth={STROKE} />
          <text x={CX} y={CY + 4} textAnchor="middle" fontSize={11} fontWeight="700" fill="#9ca3af">
            —
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex justify-center mt-3">
      <svg viewBox="0 0 88 88" width={88} height={88}>
        {segments.length === 1 ? (
          <circle cx={CX} cy={CY} r={r} fill="none" stroke={segments[0].color} strokeWidth={STROKE} />
        ) : (
          segments.map((seg, i) => (
            <path
              key={i}
              d={describeArc(CX, CY, r, seg.startAngle, seg.endAngle)}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeLinecap="butt"
            />
          ))
        )}
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          fontSize={14}
          fontWeight="800"
          fill="currentColor"
        >
          {counts.total}
        </text>
        <text
          x={CX}
          y={CY + 10}
          textAnchor="middle"
          fontSize={8}
          fontWeight="600"
          fill="#9ca3af"
        >
          runs
        </text>
      </svg>
    </div>
  );
}

// ── Approval Rate (horizontal bar) ───────────────────────────────────────────

function buildApprovalRate(runs: Array<{ status: string }> | undefined): number {
  if (!runs?.length) return 0;
  const approved = runs.filter(
    (r) => r.status === "completed" || r.status === "completed_with_errors"
  ).length;
  return Math.round((approved / runs.length) * 100);
}

function ApprovalBar({ rate, isLoading }: { rate: number; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-1/2 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{ width: `${rate}%`, backgroundColor: BRAND }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

// ── Chart Card wrapper ────────────────────────────────────────────────────────

function ChartCard({
  icon,
  title,
  callout,
  calloutLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  callout: string;
  calloutLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-brand">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-[0.12em]">{title}</span>
      </div>
      <div className="mt-1">
        <span className="text-2xl font-black tracking-tight text-foreground">{callout}</span>
        <span className="ml-2 text-[11px] font-semibold text-muted-foreground">{calloutLabel}</span>
      </div>
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AnalyticsSection() {
  const { data: runs, isLoading: runsLoading } = useRuns();
  const { data: txResponse, isLoading: txLoading } = useTransactions({}, 200, 0);

  const buckets = useMemo(
    () => buildVolumeBuckets(txResponse?.transactions),
    [txResponse]
  );

  const runCounts = useMemo(() => buildRunCounts(runs), [runs]);

  const approvalRate = useMemo(() => buildApprovalRate(runs), [runs]);

  const todayVolume = buckets[buckets.length - 1]?.total ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Volume Trend */}
      <ChartCard
        icon={<BarChart2 className="h-3.5 w-3.5" />}
        title="Volume Trend"
        callout={formatCurrencyShort(todayVolume)}
        calloutLabel="today"
      >
        <VolumeBarchart buckets={buckets} isLoading={txLoading} />
      </ChartCard>

      {/* Payout Outcomes */}
      <ChartCard
        icon={<PieChart className="h-3.5 w-3.5" />}
        title="Payout Outcomes"
        callout={String(runCounts.completed)}
        calloutLabel="completed"
      >
        <DonutChart counts={runCounts} isLoading={runsLoading} />
        {!runsLoading && runCounts.total > 0 && (
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: BRAND }} />
              <span className="text-muted-foreground">Completed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Failed</span>
            </span>
            {runCounts.pending > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
                <span className="text-muted-foreground">In Progress</span>
              </span>
            )}
          </div>
        )}
      </ChartCard>

      {/* Approval Rate */}
      <ChartCard
        icon={<Gauge className="h-3.5 w-3.5" />}
        title="Completion Rate"
        callout={runsLoading ? "…" : `${approvalRate}%`}
        calloutLabel="runs completed"
      >
        <ApprovalBar rate={approvalRate} isLoading={runsLoading} />
        {!runsLoading && runCounts.total > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-muted/50 py-2 px-1">
              <p className="text-sm font-black text-foreground">{runCounts.completed}</p>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Done</p>
            </div>
            <div className="rounded-xl bg-muted/50 py-2 px-1">
              <p className="text-sm font-black text-foreground">{runCounts.failed}</p>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Failed</p>
            </div>
            <div className="rounded-xl bg-muted/50 py-2 px-1">
              <p className="text-sm font-black text-foreground">{runCounts.pending}</p>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Active</p>
            </div>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
