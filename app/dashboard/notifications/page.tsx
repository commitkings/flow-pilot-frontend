"use client";

import { useState } from "react";
import { Bell, BellOff, Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Pagination } from "@/components/ui/pagination";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
  useDeleteNotification,
} from "@/hooks/use-notification-queries";

const PAGE_SIZE = 20;

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function typeIcon(type: string) {
  if (type === "warning") return "awaiting_approval" as const;
  if (type === "error") return "failed" as const;
  if (type === "success") return "completed" as const;
  return "pending" as const;
}

export default function NotificationsPage() {
  const [readFilter, setReadFilter] = useState<boolean | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError } = useNotifications({ is_read: readFilter, limit: PAGE_SIZE, offset });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  const deleteNotif = useDeleteNotification();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Notifications"
          description="Stay updated on run completions, approvals, and system events."
        />
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40 shrink-0"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total"
          value={isLoading ? "…" : String(total)}
          subtext="Notifications"
          icon={<Bell className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Unread"
          value={isLoading ? "…" : String(unreadCount)}
          subtext="Require attention"
          icon={<Bell className="h-4 w-4" />}
          accent="amber"
        />
        <MetricCard
          label="Read"
          value={isLoading ? "…" : String(total - unreadCount)}
          subtext="Reviewed"
          icon={<BellOff className="h-4 w-4" />}
          accent="green"
        />
      </div>

      <div className="flex items-center gap-2 px-1">
        {([
          { label: "All", val: undefined },
          { label: "Unread", val: false },
          { label: "Read", val: true },
        ] as const).map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => { setReadFilter(opt.val); setOffset(0); }}
            className={`inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
              readFilter === opt.val
                ? "border-brand bg-brand text-white"
                : "border-border/60 bg-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-sm text-destructive">
            Failed to load notifications. Please refresh.
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base font-black text-foreground">No notifications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;re all caught up!
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${
                n.is_read
                  ? "border-border bg-card"
                  : "border-brand/30 bg-brand/5"
              }`}
            >
              <div className="pt-0.5">
                <StatusBadge status={typeIcon(n.type)} label={n.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{n.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatRelative(n.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => markRead.mutate(n.id)}
                    disabled={markRead.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteNotif.mutate(n.id)}
                  disabled={deleteNotif.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      <Pagination total={total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />
    </div>
  );
}
