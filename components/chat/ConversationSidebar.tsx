"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Trash2, ChevronRight, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversations } from "@/hooks/use-chat-queries";
import { useAbandonConversation, useDeleteConversation } from "@/hooks/use-chat-mutations";
import type { ConversationSummary } from "@/lib/api-types";

interface ConversationSidebarProps {
  businessId: string | undefined;
  activeConversationId: string | null;
  onSelectConversation: (conversation: ConversationSummary) => void;
  onNewConversation: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  gathering: "bg-blue-100 text-blue-700",
  confirming: "bg-amber-100 text-amber-700",
  executing: "bg-violet-100 text-violet-700",
  awaiting_approval: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  abandoned: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  gathering: "Gathering",
  confirming: "Confirming",
  executing: "Running",
  awaiting_approval: "Needs approval",
  completed: "Completed",
  abandoned: "Cancelled",
};

export function ConversationSidebar({
  businessId,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  const { data, isLoading, error } = useConversations(businessId);
  const abandonMutation = useAbandonConversation();
  const deleteMutation = useDeleteConversation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, conversation: ConversationSummary) => {
    e.stopPropagation();
    if (deletingId) return;

    setDeletingId(conversation.id);
    try {
      if (conversation.status === "abandoned") {
        // Permanently delete abandoned conversations
        await deleteMutation.mutateAsync(conversation.id);
      } else {
        // Abandon active/gathering conversations
        await abandonMutation.mutateAsync(conversation.id);
      }
      if (conversation.id === activeConversationId) {
        onNewConversation();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const activeConversations = data?.conversations.filter(
    (c) => c.status !== "completed" && c.status !== "abandoned"
  ) ?? [];

  const pastConversations = data?.conversations.filter(
    (c) => c.status === "completed" || c.status === "abandoned"
  ) ?? [];

  const getPreviewText = (conv: ConversationSummary): string => {
    if (conv.title) {
      return conv.title;
    }
    if (conv.current_intent) {
      return conv.current_intent.replace(/_/g, " ");
    }
    return "New conversation";
  };

  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-sm font-semibold text-foreground">Conversations</h3>
        <button
          onClick={onNewConversation}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="New conversation"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-destructive">
            Failed to load conversations
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Active Conversations */}
            {activeConversations.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Active
                </div>
                {activeConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    isDeleting={deletingId === conv.id}
                    onSelect={() => onSelectConversation(conv)}
                    onDelete={(e) => handleDelete(e, conv)}
                    previewText={getPreviewText(conv)}
                  />
                ))}
              </div>
            )}

            {/* Past Conversations */}
            {pastConversations.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Past
                </div>
                {pastConversations.slice(0, 10).map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    isDeleting={deletingId === conv.id}
                    onSelect={() => onSelectConversation(conv)}
                    onDelete={(e) => handleDelete(e, conv)}
                    previewText={getPreviewText(conv)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {activeConversations.length === 0 && pastConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No conversations yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Start chatting to create a payout run
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  isDeleting: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  previewText: string;
}

function ConversationItem({
  conversation,
  isActive,
  isDeleting,
  onSelect,
  onDelete,
  previewText,
}: ConversationItemProps) {
  const statusColor = STATUS_COLORS[conversation.status] ?? STATUS_COLORS.gathering;
  const timeAgo = formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true });
  const canDelete = conversation.status !== "completed";
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isDeleting) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };
  const handleClick = () => {
    if (!isDeleting) {
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={isDeleting ? -1 : 0}
      aria-disabled={isDeleting}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors",
        isActive
          ? "bg-accent text-foreground"
          : "hover:bg-accent/50 text-muted-foreground hover:text-foreground",
        isDeleting && "opacity-50 cursor-not-allowed"
      )}
    >
      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {previewText}
          </span>
          <span className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
            statusColor
          )}>
            {STATUS_LABELS[conversation.status] ?? conversation.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {timeAgo}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {canDelete && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className={cn(
              "rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-destructive/10 hover:text-destructive",
              isDeleting && "opacity-100"
            )}
            title="Abandon conversation"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        <ChevronRight className={cn(
          "h-4 w-4 transition-transform",
          isActive && "rotate-90"
        )} />
      </div>
    </div>
  );
}
