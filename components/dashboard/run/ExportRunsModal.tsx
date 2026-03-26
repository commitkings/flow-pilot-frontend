"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/ui/button";
import { Field, TextInput, SelectInput, DateInput } from "@/components/ui/form-fields";
import type { RunRecord } from "@/lib/mock-data";

const STATUS_OPTIONS = [
  { label: "Running", value: "running" },
  { label: "Awaiting Approval", value: "awaiting_approval" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

interface ExportFilters {
  runId: string;
  status: string;
  fromDate: string;
  toDate: string;
}

const EMPTY: ExportFilters = { runId: "", status: "", fromDate: "", toDate: "" };

interface ExportRunsModalProps {
  open: boolean;
  onClose: () => void;
  rows: RunRecord[];
}

function applyFilters(rows: RunRecord[], f: ExportFilters): RunRecord[] {
  return rows.filter((r) => {
    if (f.runId && !r.id.toLowerCase().includes(f.runId.toLowerCase())) return false;
    if (f.status && r.status !== f.status) return false;
    if (f.fromDate && r.startedAt < f.fromDate) return false;
    if (f.toDate && r.startedAt > f.toDate) return false;
    return true;
  });
}

function downloadCSV(rows: RunRecord[]) {
  const header = "Run ID,Objective,Status,Candidates,Started";
  const lines = rows.map((r) =>
    [r.id, `"${r.objective.replace(/"/g, '""')}"`, r.status, r.candidates, r.startedAt].join(",")
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `runs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportRunsModal({ open, onClose, rows }: ExportRunsModalProps) {
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
      title="Export Runs"
      description="Filter which runs to include before downloading."
      maxWidth="max-w-md"
      footer={
        <>
          <span className="text-xs text-muted-foreground">
            {preview.length} of {rows.length} run{rows.length !== 1 ? "s" : ""} selected
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
        <Field label="Run ID contains">
          <TextInput value={draft.runId} onChange={(v) => set("runId", v)} placeholder="e.g. a3f9b2c1" />
        </Field>

        <Field label="Status">
          <SelectInput
            value={draft.status}
            onChange={(v) => set("status", v)}
            placeholder="All statuses"
            options={STATUS_OPTIONS}
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
