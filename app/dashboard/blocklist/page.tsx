"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Plus,
  Search,
  ShieldBan,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useAuth } from "@/context/auth-context";
import { getUserRole } from "@/lib/api-types";
import {
  useAddToBlocklist,
  useBlocklist,
  useRemoveFromBlocklist,
  useToggleBlocklistEntry,
} from "@/hooks/use-blocklist-queries";
import type { BlocklistEntryType } from "@/lib/api-blocklist";

const PAGE_SIZE = 50;

const TYPE_LABELS: Record<BlocklistEntryType, string> = {
  account_number: "Account Number",
  beneficiary_name: "Beneficiary Name",
  bank_code: "Bank Code",
};

const TYPE_OPTIONS: { label: string; value: BlocklistEntryType | "" }[] = [
  { label: "All Types", value: "" },
  { label: "Account Number", value: "account_number" },
  { label: "Beneficiary Name", value: "beneficiary_name" },
  { label: "Bank Code", value: "bank_code" },
];

function typeBadgeStatus(type: BlocklistEntryType) {
  if (type === "account_number") return "planning" as const;
  if (type === "beneficiary_name") return "pending" as const;
  return "mismatch" as const;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface AddEntryFormProps {
  onCancel: () => void;
}

function AddEntryForm({ onCancel }: AddEntryFormProps) {
  const [type, setType] = useState<BlocklistEntryType>("account_number");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const addMutation = useAddToBlocklist();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || !reason.trim()) return;
    addMutation.mutate(
      { type, value: value.trim(), reason: reason.trim() },
      {
        onSuccess: () => {
          onCancel();
        },
      }
    );
  }

  return (
    <tr className="border-b border-border bg-muted/40">
      <td colSpan={7} className="px-4 py-4 md:px-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Type
            </label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as BlocklistEntryType)}
                className="h-9 w-full appearance-none rounded-xl border border-input bg-background px-3 pr-8 text-sm text-foreground outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10"
              >
                <option value="account_number">Account Number</option>
                <option value="beneficiary_name">Beneficiary Name</option>
                <option value="bank_code">Bank Code</option>
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-[180px] flex-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Value
            </label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 0123456789"
              required
              className="h-9 rounded-xl border-input bg-background px-3 text-sm font-mono focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/10"
            />
          </div>

          <div className="flex flex-col gap-1 min-w-[200px] flex-[2]">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Reason <span className="text-destructive">*</span>
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this entry blocked?"
              required
              className="h-9 rounded-xl border-input bg-background px-3 text-sm focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/10"
            />
          </div>

          <div className="flex items-center gap-2 pb-0.5">
            <Button
              type="submit"
              size="sm"
              className="h-9 rounded-xl gap-1.5"
              disabled={addMutation.isPending || !value.trim() || !reason.trim()}
            >
              {addMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl"
              onClick={onCancel}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </td>
    </tr>
  );
}

interface DeleteCellProps {
  id: string;
}

function DeleteCell({ id }: DeleteCellProps) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeMutation = useRemoveFromBlocklist();

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 3000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      removeMutation.mutate(id);
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Button
      variant={confirming ? "destructive" : "ghost"}
      size="sm"
      className="h-7 rounded-lg px-2 text-xs gap-1"
      onClick={handleClick}
      disabled={removeMutation.isPending}
    >
      {removeMutation.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : confirming ? (
        <>
          <AlertTriangle className="h-3.5 w-3.5" />
          Confirm?
        </>
      ) : (
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  );
}

export default function BlocklistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = getUserRole(user);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<BlocklistEntryType | "">("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [offset, setOffset] = useState(0);

  const toggleMutation = useToggleBlocklistEntry();

  const filters = {
    search: search || undefined,
    type: typeFilter || undefined,
  };

  const { data, isLoading, isError } = useBlocklist(filters);
  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;

  const totalCount = total;
  const activeCount = entries.filter((e) => e.is_active).length;
  const suspendedCount = entries.filter((e) => !e.is_active).length;

  // Auth guard — owners only
  useEffect(() => {
    if (user && userRole !== "owner") {
      router.replace("/dashboard");
    }
  }, [user, userRole, router]);

  if (!user || userRole !== "owner") {
    return null;
  }

  const pagedEntries = entries.slice(offset, offset + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blocklist"
        description="Block accounts, names, or bank codes from appearing in future runs."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Blocked"
          value={isLoading ? "…" : String(totalCount)}
          subtext="All entries"
          icon={<ShieldBan className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Active"
          value={isLoading ? "…" : String(activeCount)}
          subtext="Currently blocking"
          icon={<ShieldBan className="h-4 w-4" />}
          accent="red"
        />
        <MetricCard
          label="Suspended"
          value={isLoading ? "…" : String(suspendedCount)}
          subtext="Temporarily inactive"
          icon={<ShieldBan className="h-4 w-4" />}
          accent="amber"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex h-9 items-center gap-2 rounded-xl border border-input bg-muted/40 px-3 transition-all focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/10">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
                placeholder="Search entries…"
                className="w-40 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground sm:w-52"
              />
            </div>

            {/* Type filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as BlocklistEntryType | ""); setOffset(0); }}
                className="h-9 appearance-none rounded-xl border border-input bg-background px-3 pr-8 text-sm text-foreground outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            className="gap-2 rounded-xl shrink-0"
            onClick={() => { setShowAddForm((v) => !v); }}
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:px-6">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:px-6">
                  Value
                </th>
                <th className="hidden px-6 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:table-cell">
                  Reason
                </th>
                <th className="hidden px-6 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground lg:table-cell">
                  Added By
                </th>
                <th className="hidden px-6 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground lg:table-cell">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:px-6">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:px-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {showAddForm && (
                <AddEntryForm onCancel={() => setShowAddForm(false)} />
              )}

              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-destructive">
                    Failed to load blocklist. Please refresh.
                  </td>
                </tr>
              ) : pagedEntries.length === 0 && !showAddForm ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <ShieldBan className="mx-auto h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-3 text-base font-black text-foreground">No blocklist entries</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add accounts or names to block them from future runs.
                    </p>
                  </td>
                </tr>
              ) : (
                pagedEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 md:px-6">
                      <StatusBadge
                        status={typeBadgeStatus(entry.type)}
                        label={TYPE_LABELS[entry.type]}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground md:px-6">
                      {entry.value}
                    </td>
                    <td className="hidden px-6 py-3 text-xs text-muted-foreground max-w-[240px] truncate md:table-cell">
                      {entry.reason || "—"}
                    </td>
                    <td className="hidden px-6 py-3 text-xs text-muted-foreground lg:table-cell">
                      {entry.added_by || "—"}
                    </td>
                    <td className="hidden px-6 py-3 text-xs text-muted-foreground lg:table-cell">
                      {formatDateTime(entry.created_at)}
                    </td>
                    <td className="px-4 py-3 md:px-6">
                      <StatusBadge
                        status={entry.is_active ? "active" : "suspended"}
                      />
                    </td>
                    <td className="px-4 py-3 md:px-6">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-lg px-2 text-xs"
                          onClick={() =>
                            toggleMutation.mutate({
                              id: entry.id,
                              is_active: !entry.is_active,
                            })
                          }
                          disabled={toggleMutation.isPending}
                        >
                          {entry.is_active ? "Suspend" : "Activate"}
                        </Button>
                        <DeleteCell id={entry.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          total={total}
          limit={PAGE_SIZE}
          offset={offset}
          onChange={setOffset}
        />
      </div>
    </div>
  );
}
