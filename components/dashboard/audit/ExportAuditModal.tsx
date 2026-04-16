"use client";

import { useState } from "react";
import { Download, Mail, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/ui/button";
import { Field, DateInput } from "@/components/ui/form-fields";
import { exportAuditEmail } from "@/lib/api-client";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import type { AuditEntry } from "@/lib/api-types";

interface ExportAuditModalProps {
  open: boolean;
  onClose: () => void;
  entries: AuditEntry[];
}

function applyDateFilter(entries: AuditEntry[], fromDate: string, toDate: string): AuditEntry[] {
  return entries.filter((e) => {
    const d = e.created_at.slice(0, 10);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });
}

function downloadCSV(entries: AuditEntry[]) {
  const header = "ID,Agent,Action,Payout ID,Timestamp";
  const lines = entries.map((e) =>
    [
      e.id,
      e.agent_type,
      `"${e.action.replace(/"/g, '""')}"`,
      e.run_id,
      e.created_at,
    ].join(",")
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function buildPDFDoc(entries: AuditEntry[]) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.setTextColor(22, 33, 58);
  doc.text("Audit Log Export", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(120, 112, 103);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-NG")}  ·  ${entries.length} entr${entries.length !== 1 ? "ies" : "y"}`,
    14, 26
  );

  autoTable(doc, {
    startY: 32,
    head: [["Agent", "Action", "Payout ID", "Timestamp"]],
    body: entries.map((e) => [
      e.agent_type,
      e.action,
      e.run_id.slice(0, 8),
      new Date(e.created_at).toLocaleString("en-NG"),
    ]),
    headStyles: { fillColor: [22, 33, 58], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: [250, 249, 247] },
  });

  return doc;
}

type Format = "csv" | "pdf";
type Delivery = "download" | "email";

export function ExportAuditModal({ open, onClose, entries }: ExportAuditModalProps) {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [format, setFormat] = useState<Format>("csv");
  const [delivery, setDelivery] = useState<Delivery>("download");
  const [emailTo, setEmailTo] = useState(user?.email ?? "");
  const [loading, setLoading] = useState(false);

  const preview = applyDateFilter(entries, fromDate, toDate);

  const handleExport = async () => {
    if (preview.length === 0) return;
    setLoading(true);
    try {
      if (delivery === "email") {
        if (format === "pdf") {
          const doc = await buildPDFDoc(preview);
          const pdfBase64 = doc.output("datauristring").split(",")[1];
          await exportAuditEmail(emailTo, preview, "pdf", pdfBase64);
        } else {
          await exportAuditEmail(emailTo, preview, "csv");
        }
        toast.success(`Export sent to ${emailTo}`);
        onClose();
      } else if (format === "pdf") {
        const doc = await buildPDFDoc(preview);
        doc.save(`audit-log-${new Date().toISOString().slice(0, 10)}.pdf`);
        onClose();
      } else {
        downloadCSV(preview);
        onClose();
      }
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export Audit Log"
      description="Filter by date range before exporting."
      maxWidth="max-w-sm"
      footer={
        <>
          <span className="text-xs text-muted-foreground">
            {preview.length} of {entries.length} entr{entries.length !== 1 ? "ies" : "y"} selected
          </span>
          <Button
            className="gap-2 rounded-full bg-brand px-6 text-white hover:opacity-90"
            onClick={handleExport}
            disabled={preview.length === 0 || loading || (delivery === "email" && !emailTo)}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : delivery === "email" ? (
              <Mail className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {delivery === "email" ? "Send" : "Export"}{preview.length > 0 ? ` (${preview.length})` : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Format + Delivery toggles */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">Format</p>
            <div className="flex overflow-hidden rounded-full border border-border">
              {(["csv", "pdf"] as Format[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-bold transition-colors",
                    format === f ? "bg-brand text-white" : "bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  {f === "csv" ? <FileSpreadsheet className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">Delivery</p>
            <div className="flex overflow-hidden rounded-full border border-border">
              {(["download", "email"] as Delivery[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDelivery(d)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-bold transition-colors",
                    delivery === d ? "bg-brand text-white" : "bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  {d === "download" ? <Download className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                  {d === "download" ? "Download" : "Email"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {delivery === "email" && (
          <Field label="Send to">
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="email@example.com"
              className="h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10"
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="From">
            <DateInput value={fromDate} onChange={setFromDate} placeholder="Start date" />
          </Field>
          <Field label="To">
            <DateInput value={toDate} onChange={setToDate} placeholder="End date" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
