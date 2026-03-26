"use client";

import { useState } from "react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/ui/button";
import { Field, TextInput, SelectInput, DateInput } from "@/components/ui/form-fields";

const STATUS_OPTIONS = ["Running", "Awaiting Approval", "Completed", "Failed"];

export interface RunFilters {
  runId: string;
  status: string;
  minCandidates: string;
  fromDate: string;
  toDate: string;
}

const EMPTY_FILTERS: RunFilters = {
  runId: "",
  status: "",
  minCandidates: "",
  fromDate: "",
  toDate: "",
};

interface RunFilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: RunFilters) => void;
  current: RunFilters;
}

export function RunFilterModal({ open, onClose, onApply, current }: RunFilterModalProps) {
  const [draft, setDraft] = useState<RunFilters>(current);

  const set = <K extends keyof RunFilters>(key: K, value: RunFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleClear = () => {
    setDraft(EMPTY_FILTERS);
    onApply(EMPTY_FILTERS);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filter Runs"
      description="Narrow down runs by any combination of fields."
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="outline" className="rounded-full px-6" onClick={handleClear}>
            Clear All
          </Button>
          <Button className="rounded-full bg-primary px-6 text-primary-foreground hover:opacity-90" onClick={handleApply}>
            Apply Filters
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Run ID">
          <TextInput
            value={draft.runId}
            onChange={(v) => set("runId", v)}
            placeholder="e.g. a3f9b2c1"
          />
        </Field>

        <Field label="Status">
          <SelectInput
            value={draft.status}
            onChange={(v) => set("status", v)}
            placeholder="All Statuses"
            options={STATUS_OPTIONS}
          />
        </Field>

        <Field label="Min. Candidates">
          <TextInput
            type="number"
            value={draft.minCandidates}
            onChange={(v) => set("minCandidates", v)}
            placeholder="e.g. 5"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="From">
            <DateInput
              value={draft.fromDate}
              onChange={(v) => set("fromDate", v)}
              placeholder="Start date"
            />
          </Field>
          <Field label="To">
            <DateInput
              value={draft.toDate}
              onChange={(v) => set("toDate", v)}
              placeholder="End date"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
