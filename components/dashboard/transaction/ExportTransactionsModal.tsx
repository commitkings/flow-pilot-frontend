"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/ui/button";
import { Field, TextInput, SelectInput, DateInput } from "@/components/ui/form-fields";
import type { TransactionRow } from "@/lib/api-types";

const STATUS_OPTIONS = [
  { label: "Success", value: "SUCCESS" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
  { label: "Reversed", value: "REVERSED" },
];

const CHANNEL_OPTIONS = [
  { label: "Card", value: "CARD" },
  { label: "Transfer", value: "TRANSFER" },
  { label: "USSD", value: "USSD" },
  { label: "QR", value: "QR" },
];

interface ExportFilters {
  reference: string;
  status: string;
  channel: string;
  fromDate: string;
  toDate: string;
}

const EMPTY: ExportFilters = { reference: "", status: "", channel: "", fromDate: "", toDate: "" };

interface ExportTransactionsModalProps {
  open: boolean;
  onClose: () => void;
  rows: TransactionRow[];
}

function applyFilters(rows: TransactionRow[], f: ExportFilters): TransactionRow[] {
  return rows.filter((r) => {
    if (f.reference && !r.reference.toLowerCase().includes(f.reference.toLowerCase())) return false;
    if (f.status && r.status !== f.status) return false;
    if (f.channel && r.channel !== f.channel) return false;
    if (f.fromDate && (r.date ?? "") < f.fromDate) return false;
    if (f.toDate && (r.date ?? "") > f.toDate) return false;
    return true;
  });
}

function downloadCSV(rows: TransactionRow[]) {
  const header = "Reference,Status,Amount,Channel,Direction,Counterparty,Date";
  const lines = rows.map((t) =>
    [t.reference, t.status, t.amount, t.channel, t.direction, `"${(t.counterparty_name ?? "").replace(/"/g, '""')}"`, t.date ?? ""].join(",")
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportTransactionsModal({ open, onClose, rows }: ExportTransactionsModalProps) {
  const [draft, setDraft] = useState<ExportFilters>(EMPTY);
  const set = <K extends keyof ExportFilters>(key: K, value: ExportFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const preview = applyFilters(rows, draft);

  const handleExport = () => {
    downloadCSV(preview);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export Transactions"
      description="Filter which transactions to include before downloading."
      maxWidth="max-w-md"
      footer={
        <>
          <span className="text-xs text-muted-foreground">
            {preview.length} of {rows.length} transaction{rows.length !== 1 ? "s" : ""} selected
          </span>
          <Button
            className="gap-2 rounded-full bg-brand px-6 text-white hover:opacity-90"
            onClick={handleExport}
            disabled={preview.length === 0}
          >
            <Download className="h-4 w-4" />
            Export {preview.length > 0 ? `(${preview.length})` : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Reference contains">
          <TextInput value={draft.reference} onChange={(v) => set("reference", v)} placeholder="e.g. TXN-001" />
        </Field>

        <Field label="Status">
          <SelectInput
            value={draft.status}
            onChange={(v) => set("status", v)}
            placeholder="All statuses"
            options={STATUS_OPTIONS}
          />
        </Field>

        <Field label="Channel">
          <SelectInput
            value={draft.channel}
            onChange={(v) => set("channel", v)}
            placeholder="All channels"
            options={CHANNEL_OPTIONS}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="From">
            <DateInput value={draft.fromDate} onChange={(v) => set("fromDate", v)} placeholder="Start date" />
          </Field>
          <Field label="To">
            <DateInput value={draft.toDate} onChange={(v) => set("toDate", v)} placeholder="End date" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
