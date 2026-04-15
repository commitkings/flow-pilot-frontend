import { cn } from "@/lib/utils";

export type StatusType =
  | "pending"
  | "planning"
  | "running"
  | "awaiting_approval"
  | "executing"
  | "completed"
  | "completed_with_errors"
  | "failed"
  | "allow"
  | "review"
  | "block"
  | "verified"
  | "mismatch"
  | "successful"
  | "requires_followup"
  | "invited"
  | "suspended"
  | "active";

const styles: Record<StatusType, string> = {
  pending:               "border border-slate-300 text-slate-500",
  planning:              "border border-blue-300 text-blue-600",
  running:               "border border-blue-400 text-blue-600",
  awaiting_approval:     "border border-amber-300 text-amber-700",
  executing:             "border border-indigo-300 text-indigo-600",
  completed:             "border border-emerald-300 text-emerald-600",
  completed_with_errors: "border border-orange-300 text-orange-600",
  failed:                "border border-red-300 text-red-600",
  allow:                 "border border-emerald-300 text-emerald-600",
  review:                "border border-amber-300 text-amber-700",
  block:                 "border border-red-400 text-red-600",
  verified:              "border border-emerald-300 text-emerald-600",
  mismatch:              "border border-amber-300 text-amber-700",
  successful:            "border border-emerald-300 text-emerald-600",
  requires_followup:     "border border-amber-300 text-amber-700",
  invited:               "border border-amber-300 text-amber-700",
  suspended:             "border border-red-300 text-red-600",
  active:                "border border-emerald-300 text-emerald-600",
};

const pulseStatuses: StatusType[] = ["running", "awaiting_approval", "executing"];

export function StatusBadge({ status, label }: { status: StatusType; label?: string }) {
  const isPulse = pulseStatuses.includes(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-medium capitalize",
        styles[status]
      )}
    >
      {isPulse && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {label ?? status.replaceAll("_", " ")}
    </span>
  );
}
