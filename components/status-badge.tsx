import { cn } from "@/lib/utils";

type StatusType =
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
  pending: "bg-slate-100 text-slate-700",
  planning: "border border-blue-300 bg-blue-50 text-blue-700",
  running: "bg-blue-600 text-white",
  awaiting_approval: "bg-amber-500/15 text-amber-800 border border-amber-300",
  executing: "bg-indigo-600 text-white",
  completed: "bg-emerald-500/15 text-emerald-800 border border-emerald-300",
  completed_with_errors: "bg-orange-500/15 text-orange-800 border border-orange-300",
  failed: "bg-red-500/15 text-red-800 border border-red-300",
  allow: "border border-emerald-300 bg-emerald-50 text-emerald-700",
  review: "border border-amber-300 bg-amber-50 text-amber-700",
  block: "bg-red-600 text-white",
  verified: "bg-emerald-500/15 text-emerald-800 border border-emerald-300",
  mismatch: "bg-amber-500/15 text-amber-800 border border-amber-300",
  successful: "bg-emerald-500/15 text-emerald-800 border border-emerald-300",
  requires_followup: "bg-amber-500/15 text-amber-800 border border-amber-300",
  invited: "bg-amber-500/15 text-amber-800 border border-amber-300",
  suspended: "border border-red-300 bg-red-50 text-red-700",
  active: "bg-emerald-500/15 text-emerald-800 border border-emerald-300",
};

const pulseStatuses: StatusType[] = ["running", "awaiting_approval", "executing"];

export function StatusBadge({ status, label }: { status: StatusType; label?: string }) {
  const isPulse = pulseStatuses.includes(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        styles[status]
      )}
    >
      {isPulse && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {label ?? status.replaceAll("_", " ")}
    </span>
  );
}
