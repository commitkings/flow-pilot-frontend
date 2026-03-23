"use client";

import { useState } from "react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/ui/button";
import { Field, TextInput, SelectInput, DateInput } from "@/components/ui/form-fields";

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

export interface TransactionFilters {
  runId: string;
  status: string;
  channel: string;
  fromDate: string;
  toDate: string;
}

export const EMPTY_TX_FILTERS: TransactionFilters = {
  runId: "", status: "", channel: "", fromDate: "", toDate: "",
};

interface TransactionFilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: TransactionFilters) => void;
  current: TransactionFilters;
}

export function TransactionFilterModal({ open, onClose, onApply, current }: TransactionFilterModalProps) {
  const [draft, setDraft] = useState<TransactionFilters>(current);

  const set = <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filter Transactions"
      description="Narrow down transactions by any combination of fields."
      maxWidth="max-w-md"
      footer={
        <>
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={() => { setDraft(EMPTY_TX_FILTERS); onApply(EMPTY_TX_FILTERS); onClose(); }}
          >
            Clear All
          </Button>
          <Button
            className="rounded-full bg-primary px-6 text-primary-foreground hover:opacity-90"
            onClick={() => { onApply(draft); onClose(); }}
          >
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

        <Field label="Channel">
          <SelectInput
            value={draft.channel}
            onChange={(v) => set("channel", v)}
            placeholder="All Channels"
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
