"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Download,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useInstitutions } from "@/hooks/use-institutions";
import {
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
} from "@/hooks/use-vendor-queries";
import type { SavedRecipient, CreateSavedRecipientPayload } from "@/lib/api-types";
import { BankSelectInput, Field, TextInput, TextareaInput } from "@/components/ui/form-fields";
import type { Institution } from "@/lib/api-types";
import { readFileAsCsv, IMPORT_ACCEPT } from "@/lib/file-utils";

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

type InstitutionOption = { label: string; value: string; aliases: string[] };

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildInstitutionOptions(institutions: Institution[]): InstitutionOption[] {
  return institutions.map((inst) => ({
    label: inst.shortName?.trim() || inst.institutionName,
    value: inst.institutionCode,
    aliases: [inst.institutionCode, inst.institutionName, inst.shortName, inst.nipCode, inst.cbnCode]
      .filter((a): a is string => Boolean(a?.trim()))
      .map(normalizeKey),
  }));
}

function getInstitutionLabel(code: string, options: InstitutionOption[]): string {
  return options.find((o) => o.value === code)?.label ?? code;
}

function resolveInstitutionCode(raw: string, options: InstitutionOption[]): string | null {
  const key = normalizeKey(raw);
  return options.find((o) => o.aliases.includes(key))?.value ?? null;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Form state ──────────────────────────────────────────────────────────────── */

interface RecipientFormState {
  name: string;
  accountNumber: string;
  institutionCode: string;
  email: string;
  notes: string;
}

function emptyForm(): RecipientFormState {
  return { name: "", accountNumber: "", institutionCode: "", email: "", notes: "" };
}

function recipientToForm(r: SavedRecipient): RecipientFormState {
  return {
    name: r.name,
    accountNumber: r.account_number,
    institutionCode: r.institution_code,
    email: r.email ?? "",
    notes: r.notes ?? "",
  };
}

/* ── Add / Edit Modal ────────────────────────────────────────────────────────── */

interface RecipientModalProps {
  recipient?: SavedRecipient;
  institutionOptions: InstitutionOption[];
  onClose: () => void;
}

function RecipientModal({ recipient, institutionOptions, onClose }: RecipientModalProps) {
  const [form, setForm] = useState<RecipientFormState>(
    recipient ? recipientToForm(recipient) : emptyForm()
  );
  const [submitted, setSubmitted] = useState(false);
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const set = (patch: Partial<RecipientFormState>) => setForm((f) => ({ ...f, ...patch }));
  const isValid = form.name.trim() && form.accountNumber.trim().length >= 10 && form.institutionCode.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;

    const payload: CreateSavedRecipientPayload = {
      name: form.name.trim(),
      account_number: form.accountNumber.trim(),
      institution_code: form.institutionCode.trim(),
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (recipient) {
      updateMutation.mutate({ vendorId: recipient.id, payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-foreground">
              {recipient ? "Edit Recipient" : "Add Recipient"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {recipient ? "Update recipient details" : "Save a recipient for quick payout selection"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full Name">
            <TextInput
              value={form.name}
              onChange={(v) => set({ name: v })}
              placeholder="e.g. Printology Ltd"
              className={submitted && !form.name.trim() ? "border-destructive" : ""}
            />
          </Field>

          <Field label="Bank / Institution">
            <BankSelectInput
              value={form.institutionCode}
              onChange={(v) => set({ institutionCode: v })}
              placeholder="Search bank…"
              options={institutionOptions}
            />
            {submitted && !form.institutionCode.trim() && (
              <p className="text-[11px] text-destructive mt-1">Select a bank</p>
            )}
          </Field>

          <Field label="Account Number">
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={form.accountNumber}
              onChange={(e) => set({ accountNumber: e.target.value.replace(/\D/g, "") })}
              placeholder="0000000000"
              className={`h-10 w-full rounded-full border px-4 text-sm font-mono text-foreground outline-none transition-all placeholder:text-muted-foreground focus:ring-1 focus:ring-brand/10 bg-background ${submitted && form.accountNumber.trim().length < 10 ? "border-destructive focus:border-destructive" : "border-border/60 focus:border-brand"}`}
            />
          </Field>

          <Field label="Email">
            <TextInput
              value={form.email}
              onChange={(v) => set({ email: v })}
              placeholder="recipient@example.com (optional)"
            />
          </Field>

          <Field label="Notes">
            <TextareaInput
              value={form.notes}
              onChange={(v) => set({ notes: v })}
              placeholder="e.g. Primary supplier, payment terms 30 days (optional)"
              className="min-h-14 resize-none"
            />
          </Field>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1 rounded-full bg-brand text-white hover:opacity-90">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : recipient ? "Save Changes" : "Add Recipient"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete Button ───────────────────────────────────────────────────────────── */

function DeleteButton({ recipientId, recipientName }: { recipientId: string; recipientName: string }) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteMutation = useDeleteVendor();

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 3000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      deleteMutation.mutate(recipientId);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={deleteMutation.isPending}
      title={confirming ? `Confirm delete "${recipientName}"` : "Delete recipient"}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${confirming ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "text-muted-foreground/40 hover:bg-muted hover:text-destructive"}`}
    >
      {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ── Recipient Row ───────────────────────────────────────────────────────────── */

function RecipientRow({
  recipient,
  institutionOptions,
  onEdit,
}: {
  recipient: SavedRecipient;
  institutionOptions: InstitutionOption[];
  onEdit: (r: SavedRecipient) => void;
}) {
  const bankLabel = getInstitutionLabel(recipient.institution_code, institutionOptions);

  return (
    <tr className="group border-b border-border/60 last:border-0 transition-colors hover:bg-muted/20">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10">
            <Building2 className="h-3.5 w-3.5 text-brand" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{recipient.name}</p>
            {recipient.notes && (
              <p className="truncate text-xs text-muted-foreground/70">{recipient.notes}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-muted-foreground">{bankLabel}</td>
      <td className="px-5 py-3.5">
        <span className="font-mono text-sm text-foreground">{recipient.account_number}</span>
      </td>
      <td className="hidden px-5 py-3.5 md:table-cell text-sm text-muted-foreground">
        {recipient.email ?? <span className="text-muted-foreground/40">—</span>}
      </td>
      <td className="hidden px-5 py-3.5 lg:table-cell text-sm text-muted-foreground text-center">
        {recipient.payment_count > 0 ? recipient.payment_count : <span className="text-muted-foreground/40">—</span>}
      </td>
      <td className="hidden px-5 py-3.5 xl:table-cell text-sm text-muted-foreground">
        {recipient.last_paid_at ? formatDate(recipient.last_paid_at) : <span className="text-muted-foreground/40">—</span>}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(recipient)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <DeleteButton recipientId={recipient.id} recipientName={recipient.name} />
        </div>
      </td>
    </tr>
  );
}

/* ── CSV Import Result ───────────────────────────────────────────────────────── */

interface ImportResult {
  added: number;
  skipped: number;
  errors: string[];
}

/* ── Page ────────────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 12;

export default function RecipientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<SavedRecipient | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useVendors();
  const { data: institutionsData } = useInstitutions({ enabled: true, limit: 200 });
  const createMutation = useCreateVendor();

  const institutionOptions = useMemo(
    () => buildInstitutionOptions(institutionsData?.data ?? []),
    [institutionsData]
  );

  const recipients = data?.recipients ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return recipients;
    const q = search.toLowerCase();
    return recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.account_number.includes(q) ||
        getInstitutionLabel(r.institution_code, institutionOptions).toLowerCase().includes(q) ||
        (r.email?.toLowerCase().includes(q) ?? false)
    );
  }, [recipients, search, institutionOptions]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  function downloadTemplate() {
    const csv = [
      "name,bank_name,account_number,email,notes",
      "John Doe,Access Bank,0123456789,john.doe@example.com,Monthly salary",
      "Printology Ltd,GTBank,0987654321,accounts@printology.ng,Main print supplier",
      "Jane Smith,Zenith Bank,1234567890,,Freelance designer",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipients-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    e.target.value = "";

    readFileAsCsv(file).then(async (text) => {
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) return;

      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const nameIdx = header.indexOf("name");
      const bankIdx = header.findIndex((h) => h.includes("bank"));
      const accountIdx = header.findIndex((h) => h.includes("account"));
      const emailIdx = header.indexOf("email");
      const notesIdx = header.indexOf("notes");

      if (nameIdx === -1 || bankIdx === -1 || accountIdx === -1) {
        setImportResult({ added: 0, skipped: 0, errors: ["CSV must have columns: name, bank_name, account_number"] });
        return;
      }

      const result: ImportResult = { added: 0, skipped: 0, errors: [] };

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const name = cols[nameIdx] ?? "";
        const bankRaw = cols[bankIdx] ?? "";
        const accountNumber = cols[accountIdx] ?? "";
        const email = emailIdx !== -1 ? (cols[emailIdx] ?? "") : "";
        const notes = notesIdx !== -1 ? (cols[notesIdx] ?? "") : "";

        if (!name || !bankRaw || !accountNumber) {
          result.skipped++;
          continue;
        }

        const institutionCode = resolveInstitutionCode(bankRaw, institutionOptions);
        if (!institutionCode) {
          result.errors.push(`Row ${i + 1}: bank "${bankRaw}" not recognised`);
          result.skipped++;
          continue;
        }

        if (accountNumber.length < 10) {
          result.errors.push(`Row ${i + 1}: account number "${accountNumber}" is invalid`);
          result.skipped++;
          continue;
        }

        try {
          await createMutation.mutateAsync({
            name,
            account_number: accountNumber,
            institution_code: institutionCode,
            email: email || null,
            notes: notes || null,
          });
          result.added++;
        } catch {
          result.errors.push(`Row ${i + 1}: failed to save "${name}"`);
          result.skipped++;
        }
      }

      setImportResult(result);
    }).catch(() => {
      setImportResult({ added: 0, skipped: 0, errors: ["Failed to read file. Please upload a valid CSV or XLSX file."] });
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recipients"
        description="Save recipient details for faster payout creation. Select them directly when creating a payout run."
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
          >
            <Download className="h-3.5 w-3.5" />
            Template
          </button>
          <button
            type="button"
            onClick={() => csvRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full border border-brand/30 px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/5"
          >
            <Upload className="h-3.5 w-3.5" />
            Import CSV / XLSX
          </button>
          <input ref={csvRef} type="file" accept={IMPORT_ACCEPT} onChange={handleCsvUpload} className="sr-only" />
          <Button onClick={() => { setEditingRecipient(null); setShowModal(true); }} className="rounded-full bg-brand text-white hover:opacity-90 gap-1.5">
            <Plus className="h-4 w-4" />
            Add Recipient
          </Button>
        </div>
      </PageHeader>

      {/* Stats cards */}
      {recipients.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total Recipients"
            value={isLoading ? "…" : String(recipients.length)}
            subtext="Saved contacts"
            icon={<Users className="h-4 w-4" />}
            accent="brand"
          />
          <MetricCard
            label="Total Payments"
            value={isLoading ? "…" : String(recipients.reduce((s, r) => s + (r.payment_count ?? 0), 0))}
            subtext="Across all recipients"
            icon={<TrendingUp className="h-4 w-4" />}
            accent="green"
          />
          <MetricCard
            label="Most Paid"
            value={isLoading ? "…" : (() => {
              const top = recipients.reduce((best, r) => (r.payment_count ?? 0) > (best.payment_count ?? 0) ? r : best, recipients[0]);
              return top ? top.name.split(" ")[0] ?? "—" : "—";
            })()}
            subtext={(() => {
              const top = recipients.reduce((best, r) => (r.payment_count ?? 0) > (best.payment_count ?? 0) ? r : best, recipients[0]);
              return top ? `${top.payment_count ?? 0} payment${(top.payment_count ?? 0) !== 1 ? "s" : ""}` : "No payments yet";
            })()}
            icon={<CreditCard className="h-4 w-4" />}
            accent="amber"
            className="hidden sm:flex"
          />
        </div>
      )}

      {/* CSV import result */}
      {importResult && (
        <div className={`rounded-xl border px-4 py-3 text-sm space-y-1 ${importResult.errors.length > 0 ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
          <div className="flex items-center justify-between">
            <p className="font-semibold">
              Import complete — {importResult.added} added{importResult.skipped > 0 ? `, ${importResult.skipped} skipped` : ""}
            </p>
            <button type="button" onClick={() => setImportResult(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {importResult.errors.slice(0, 3).map((err, i) => (
            <p key={i} className="text-xs opacity-80">{err}</p>
          ))}
          {importResult.errors.length > 3 && (
            <p className="text-xs opacity-80">…and {importResult.errors.length - 3} more issues</p>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipients…"
          className="h-9 w-full rounded-full border border-border/60 bg-background pl-8 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10"
        />
      </div>

      {recipients.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
            {filtered.length} recipient{filtered.length !== 1 ? "s" : ""}
            {search && recipients.length !== filtered.length ? ` of ${recipients.length}` : ""}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {search ? "No recipients match your search" : "No saved recipients yet"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {search
                ? "Try a different name or account number"
                : "Add recipients manually or import a CSV to select them quickly during payout creation"}
            </p>
          </div>
          {!search && (
            <div className="flex items-center gap-2 mt-2">
              <Button onClick={() => csvRef.current?.click()} variant="outline" className="rounded-full gap-1.5 text-xs">
                <Upload className="h-3.5 w-3.5" />
                Import CSV
              </Button>
              <Button onClick={() => { setEditingRecipient(null); setShowModal(true); }} variant="outline" className="rounded-full gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add manually
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left">
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">Recipient</th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">Bank</th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">Account No.</th>
                    <th className="hidden px-5 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:table-cell">Email</th>
                    <th className="hidden px-5 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground text-center lg:table-cell">Payouts</th>
                    <th className="hidden px-5 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground xl:table-cell">Last Paid</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((recipient) => (
                    <RecipientRow
                      key={recipient.id}
                      recipient={recipient}
                      institutionOptions={institutionOptions}
                      onEdit={(r) => { setEditingRecipient(r); setShowModal(true); }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {filtered.length} recipient{filtered.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-full border border-border/60 px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-full border border-border/60 px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <RecipientModal
          recipient={editingRecipient ?? undefined}
          institutionOptions={institutionOptions}
          onClose={() => { setShowModal(false); setEditingRecipient(null); }}
        />
      )}
    </div>
  );
}
