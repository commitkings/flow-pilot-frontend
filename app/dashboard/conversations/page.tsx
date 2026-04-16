"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Trash2,
  StopCircle,
  ArrowRight,
  Loader2,
  Bot,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useConversations, useConversation } from "@/hooks/use-chat-queries";
import { useDeleteConversation, useAbandonConversation } from "@/hooks/use-chat-mutations";
import type { ConversationSummary } from "@/lib/api-types";

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; dotClass: string; badgeClass: string }
> = {
  gathering: {
    label: "Gathering info",
    dotClass: "bg-amber-400",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirming: {
    label: "Ready to confirm",
    dotClass: "bg-blue-400",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  awaiting_approval: {
    label: "Awaiting approval",
    dotClass: "bg-orange-400 animate-pulse",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
  },
  executing: {
    label: "Executing",
    dotClass: "bg-green-400 animate-pulse",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
  },
  completed: {
    label: "Completed",
    dotClass: "bg-green-500",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
  },
  abandoned: {
    label: "Abandoned",
    dotClass: "bg-muted-foreground/40",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
};

function statusCfg(status: string) {
  return STATUS_CONFIG[status] ?? {
    label: status,
    dotClass: "bg-muted-foreground/40",
    badgeClass: "bg-muted text-muted-foreground border-border",
  };
}

// ── Expanded detail view ───────────────────────────────────────────────────────

function ConversationDetailPane({ id }: { id: string }) {
  const { data: detail, isLoading } = useConversation(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!detail) return null;

  const isActive = ["gathering", "confirming"].includes(detail.status);
  const hasRun = !!detail.run_id;

  return (
    <div className="border-t border-border/60 pt-4 space-y-4">
      {/* Message thread */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {detail.messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No messages yet.
          </p>
        )}
        {detail.messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2.5",
                isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  isUser
                    ? "bg-brand text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isUser ? (
                  <User className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  isUser
                    ? "rounded-tr-sm bg-brand text-white"
                    : "rounded-tl-sm bg-muted text-foreground"
                )}
              >
                {msg.content}
                <div
                  className={cn(
                    "mt-1 text-[10px] opacity-60",
                    isUser ? "text-right" : "text-left"
                  )}
                >
                  {formatDistanceToNow(new Date(msg.created_at), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action row */}
      {(isActive || hasRun) && (
        <div className="flex items-center gap-2 pt-1">
          {isActive && (
            <Link href="/dashboard/runs/new">
              <Button
                size="sm"
                className="rounded-full bg-brand text-white hover:opacity-90 text-xs px-4"
              >
                Continue in Chat
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
          {hasRun && (
            <Link href={`/dashboard/runs/${detail.run_id}`}>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs px-4"
              >
                View Run
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ── Conversation card ──────────────────────────────────────────────────────────

function ConversationCard({ conv }: { conv: ConversationSummary }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const deleteConvo = useDeleteConversation();
  const abandonConvo = useAbandonConversation();

  const cfg = statusCfg(conv.status);
  const isActive = ["gathering", "confirming", "awaiting_approval", "executing"].includes(conv.status);
  const isAbandoned = conv.status === "abandoned";
  const title = conv.title || conv.current_intent || "Untitled conversation";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card transition-all",
        isAbandoned && "opacity-60"
      )}
    >
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-4 p-4 text-left"
      >
        {/* Status dot */}
        <div className="mt-1.5 flex shrink-0 items-center">
          <span className={cn("h-2 w-2 rounded-full", cfg.dotClass)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {title}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                cfg.badgeClass
              )}
            >
              {cfg.label}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {conv.message_count} message{conv.message_count !== 1 ? "s" : ""}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Actions + chevron */}
        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {isActive && (
            <button
              type="button"
              title="Abandon conversation"
              onClick={() => {
                if (confirming) {
                  abandonConvo.mutate(conv.id);
                  setConfirming(false);
                } else {
                  setConfirming(true);
                  setTimeout(() => setConfirming(false), 3000);
                }
              }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                confirming
                  ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <StopCircle className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            title="Delete conversation"
            onClick={() => deleteConvo.mutate(conv.id)}
            disabled={deleteConvo.isPending}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
          >
            {deleteConvo.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
          <div className="ml-1 flex h-7 w-7 items-center justify-center text-muted-foreground">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded message thread */}
      {expanded && (
        <div className="px-4 pb-4">
          <ConversationDetailPane id={conv.id} />
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConversationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const businessId = user?.memberships?.[0]?.business_id;

  const { data, isLoading } = useConversations(businessId);
  const conversations = data?.conversations ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversations"
        description="Browse past AI-assisted payout conversations and resume active ones."
      >
        <Button
          onClick={() => router.push("/dashboard/runs/new")}
          className="rounded-full bg-primary px-5 text-primary-foreground text-sm font-semibold hover:opacity-90"
        >
          New Conversation
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <MessageSquare className="h-7 w-7" />
          </div>
          <div>
            <p className="text-base font-black text-foreground">No conversations yet</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Start a new payout and chat with FlowPilot — your conversation history will appear here.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/runs/new")}
            className="rounded-full bg-primary px-5 text-primary-foreground text-sm font-semibold hover:opacity-90"
          >
            Start a Conversation
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <ConversationCard key={conv.id} conv={conv} />
          ))}
          {(data?.total ?? 0) > conversations.length && (
            <p className="pt-2 text-center text-sm text-muted-foreground">
              Showing {conversations.length} of {data?.total}. Older conversations are archived.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
