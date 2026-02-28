"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, BadgeAlert, Download, Layers, Wallet } from "lucide-react";
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
import { transactionRows, naira } from "@/lib/mock-data";

type TransactionRow = (typeof transactionRows)[number];

const CHANNEL_STYLES: Record<string, string> = {
  WEB: "bg-blue-100 text-blue-700",
  USSD: "bg-purple-100 text-purple-700",
  POS: "bg-teal-100 text-teal-700",
  MOBILE: "bg-indigo-100 text-indigo-700",
};

function ChannelBadge({ value }: { value: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CHANNEL_STYLES[value] ?? "bg-slate-100 text-slate-700"}`}
    >
      {value}
    </span>
  );
}

const STATUS_OPTIONS = ["Completed", "Pending", "Failed"];
const CHANNEL_OPTIONS = ["WEB", "USSD", "POS", "MOBILE"];

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
      <StatusBadge
        status={
          row.status === "Completed"
            ? "completed"
            : row.status === "Pending"
              ? "pending"
              : "failed"
        }
        label={row.status}
      />
    ),
  },
  {
    id: "date",
    header: "Date",
    cell: (row) => (
      <span className="text-muted-foreground">{row.date}</span>
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

export default function TransactionsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [fromDate, setFromDate] = useState("2026-02-01");
  const [toDate, setToDate] = useState("2026-02-24");
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  const selected = transactionRows.find((r) => r.reference === selectedRef) ?? null;

  const filteredRows = useMemo(
    () =>
      transactionRows.filter((row) => {
        const q = query.toLowerCase();
        const matchesQuery = row.reference.toLowerCase().includes(q);
        const matchesStatus = !statusFilter || row.status === statusFilter;
        const matchesChannel = !channelFilter || row.channel === channelFilter;
        return matchesQuery && matchesStatus && matchesChannel;
      }),
    [query, statusFilter, channelFilter]
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

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Transactions"
          value="2,847"
          subtext="Across all runs"
          icon={<Layers className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Total Volume"
          value="₦284.75M"
          subtext="Settled this month"
          icon={<Wallet className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Anomalies Detected"
          value="23"
          subtext="Requires review"
          icon={<BadgeAlert className="h-4 w-4" />}
          accent="amber"
        />
        <MetricCard
          label="Failed Transactions"
          value="14"
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
        <DataTable
          columns={columns}
          data={filteredRows}
          keyExtractor={(row) => row.reference}
          onRowClick={(row) => setSelectedRef(row.reference)}
          emptyState={
            <div className="space-y-2">
              <p className="text-base font-black text-foreground">
                No transactions found
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters.
              </p>
            </div>
          }
        />
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
            <DetailRow label="Channel" value={selected.channel} />
            <DetailRow label="Amount" value={naira(selected.amount)} />
            <DetailRow label="Status" value={selected.status} />
            <DetailRow label="Date" value={selected.date} />
            <DetailRow label="Anomaly" value={selected.anomaly} />
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
              Raw payload summary with sensitive fields redacted.
            </div>
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
