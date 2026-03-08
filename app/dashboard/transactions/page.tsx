"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, BadgeAlert, Download, Layers, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SearchInput,
  SelectInput,
  DateRangeInput,
} from "@/components/ui/form-fields";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { RightModal } from "@/components/modals/RightModal";
import { naira } from "@/lib/mock-data";
import type { TransactionRow, TransactionSummary } from "@/lib/api-types";
import { useTransactions } from "@/hooks/use-transaction-queries";

// Map DB channel values to display-friendly labels
const CHANNEL_DISPLAY: Record<string, string> = {
  CARD: "Card",
  TRANSFER: "Transfer",
  USSD: "USSD",
  QR: "QR",
};

const CHANNEL_STYLES: Record<string, string> = {
  CARD: "bg-blue-100 text-blue-700",
  TRANSFER: "bg-teal-100 text-teal-700",
  USSD: "bg-purple-100 text-purple-700",
  QR: "bg-indigo-100 text-indigo-700",
};

function ChannelBadge({ value }: { value: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CHANNEL_STYLES[value] ?? "bg-slate-100 text-slate-700"}`}
    >
      {CHANNEL_DISPLAY[value] ?? value}
    </span>
  );
}

// Map DB status values to StatusBadge variants
function statusVariant(s: string): "completed" | "pending" | "failed" {
  if (s === "SUCCESS") return "completed";
  if (s === "PENDING") return "pending";
  return "failed"; // FAILED, REVERSED
}
function statusLabel(s: string): string {
  if (s === "SUCCESS") return "Completed";
  if (s === "PENDING") return "Pending";
  if (s === "REVERSED") return "Reversed";
  return "Failed";
}

const STATUS_OPTIONS = ["SUCCESS", "PENDING", "FAILED", "REVERSED"];
const STATUS_LABELS: Record<string, string> = {
  SUCCESS: "Completed",
  PENDING: "Pending",
  FAILED: "Failed",
  REVERSED: "Reversed",
};
const CHANNEL_OPTIONS = ["CARD", "TRANSFER", "USSD", "QR"];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-NG", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

const columns: TableColumn<TransactionRow>[] = [
  {
    id: "reference",
    header: "Reference",
    cell: (row) => (
      <span className="font-mono text-xs font-semibold text-foreground">
        {row.reference}
      </span>
    ),
  },
  {
    id: "channel",
    header: "Channel",
    cell: (row) => <ChannelBadge value={row.channel} />,
  },
  {
    id: "amount",
    header: "Amount",
    cell: (row) => (
      <span className="font-semibold text-foreground">{naira(row.amount)}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <StatusBadge status={statusVariant(row.status)} label={statusLabel(row.status)} />
    ),
  },
  {
    id: "date",
    header: "Date",
    cell: (row) => (
      <span className="text-muted-foreground">{formatDate(row.date)}</span>
    ),
  },
  {
    id: "anomaly",
    header: "Anomaly",
    cell: (row) =>
      row.anomaly === "Clean" ? (
        <StatusBadge status="verified" label="Clean" />
      ) : (
        <StatusBadge status="failed" label={row.anomaly} />
      ),
  },
];

const emptySummary: TransactionSummary = {
  total_transactions: 0,
  total_volume: 0,
  anomaly_count: 0,
  failed_count: 0,
};

export default function TransactionsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  const filters = useMemo(() => ({
    ...(statusFilter && { status: statusFilter }),
    ...(channelFilter && { channel: channelFilter }),
    ...(query && { search: query }),
    ...(fromDate && { from_date: fromDate }),
    ...(toDate && { to_date: toDate }),
  }), [statusFilter, channelFilter, query, fromDate, toDate]);

  const { data, isLoading: loading, isError: error, refetch } = useTransactions(filters);
  const rows: TransactionRow[] = data?.transactions ?? [];
  const summary: TransactionSummary = data?.summary ?? emptySummary;

  const selected = useMemo(
    () => rows.find((r) => r.reference === selectedRef) ?? null,
    [rows, selectedRef],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Transactions"
        description="Global view of reconciled transactions across all runs."
      >
        <Button variant="outline" className="rounded-xl">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </PageHeader>

      {/* Metric cards — live from API summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Transactions"
          value={summary.total_transactions.toLocaleString()}
          subtext="Across all runs"
          icon={<Layers className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Total Volume"
          value={naira(summary.total_volume)}
          subtext="Settled this period"
          icon={<Wallet className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Anomalies Detected"
          value={summary.anomaly_count.toLocaleString()}
          subtext="Requires review"
          icon={<BadgeAlert className="h-4 w-4" />}
          accent="amber"
        />
        <MetricCard
          label="Failed Transactions"
          value={summary.failed_count.toLocaleString()}
          subtext="Immediate action required"
          icon={<ArrowDownUp className="h-4 w-4" />}
          accent="red"
        />
      </div>

      {/* Transactions table */}
      <div className="rounded-2xl border border-border bg-card">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by reference..."
            className="min-w-50 flex-1"
          />
          <SelectInput
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={STATUS_OPTIONS}
          />
          <SelectInput
            value={channelFilter}
            onChange={setChannelFilter}
            placeholder="All Channels"
            options={CHANNEL_OPTIONS}
          />
          <DateRangeInput
            from={fromDate}
            to={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <p className="text-sm font-semibold text-destructive">
              Failed to load transactions
            </p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={(row) => row.reference}
            onRowClick={(row) => setSelectedRef(row.reference)}
            emptyState={
              <div className="space-y-2 flex items-center flex-col justify-center py-10">
                <p className="text-base font-black text-foreground">
                  No transactions found
                </p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters.
                </p>
              </div>
            }
          />
        )}
      </div>

      {/* Detail panel */}
      <RightModal
        open={!!selected}
        onClose={() => setSelectedRef(null)}
        title="Transaction Detail"
        description={selected?.reference}
      >
        {selected && (
          <div className="space-y-0">
            <DetailRow label="Reference" value={selected.reference} mono />
            <DetailRow label="Channel" value={CHANNEL_DISPLAY[selected.channel] ?? selected.channel} />
            <DetailRow label="Amount" value={naira(selected.amount)} />
            <DetailRow label="Status" value={statusLabel(selected.status)} />
            <DetailRow label="Direction" value={selected.direction || "—"} />
            <DetailRow label="Date" value={formatDate(selected.date)} />
            <DetailRow label="Counterparty" value={selected.counterparty_name || "—"} />
            <DetailRow label="Bank" value={selected.counterparty_bank || "—"} />
            <DetailRow label="Narration" value={selected.narration || "—"} />
            <DetailRow label="Anomaly" value={selected.anomaly} />
            {selected.anomaly_count > 0 && (
              <DetailRow label="Anomaly Count" value={String(selected.anomaly_count)} />
            )}
          </div>
        )}
      </RightModal>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-semibold text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
