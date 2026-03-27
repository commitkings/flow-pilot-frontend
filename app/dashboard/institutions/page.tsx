"use client";

import { useState, useMemo } from "react";
import { Building2, Loader2, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useInstitutions } from "@/hooks/use-institutions";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/form-fields";
import { StatusBadge } from "@/components/status-badge";
import type { Institution } from "@/lib/api-types";

const PAGE_SIZE = 20;

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const columns: TableColumn<Institution>[] = [
  {
    id: "institutionName",
    header: "Institution Name",
    cell: (inst) => (
      <div className="flex items-center gap-2 font-medium text-foreground">
        <Building2 className="h-4 w-4 text-brand" />
        {inst.institutionName}
      </div>
    ),
  },
  // Removed internal codes (Short Name, NIP Code, CBN Code) as they are not needed for this view.
  {
    id: "status",
    header: "Status",
    cell: (inst) => (
      <StatusBadge
        status={inst.isActive ? "completed" : "failed"}
        label={inst.isActive ? "Active" : "Inactive"}
      />
    ),
  },
  {
    id: "lastSyncedAt",
    header: "Last Synced",
    cell: (inst) => <span className="text-muted-foreground">{formatDateTime(inst.lastSyncedAt)}</span>,
  },
];

export default function InstitutionsPage() {
  const { data, isLoading: loading, isError: error } = useInstitutions();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const institutions = useMemo(() => data?.data ?? [], [data]);
  const activeCount = institutions.filter((i: Institution) => i.isActive).length;
  const inactiveCount = institutions.filter((i: Institution) => !i.isActive).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return institutions;
    return institutions.filter((i: Institution) =>
      i.institutionName.toLowerCase().includes(q) ||
      (i.shortName ?? "").toLowerCase().includes(q) ||
      i.institutionCode.toLowerCase().includes(q)
    );
  }, [institutions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutions"
        description="Manage and view supported receiving institutions for payouts."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Institutions"
          value={loading ? "…" : String(institutions.length)}
          subtext="Available for payouts"
          icon={<Building2 className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Active"
          value={loading ? "…" : String(activeCount)}
          subtext="Operational"
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Inactive"
          value={loading ? "…" : String(inactiveCount)}
          subtext="Currently disabled"
          icon={<XCircle className="h-4 w-4" />}
          accent="red"
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or code…"
            className="w-full md:w-80"
          />
          {!loading && (
            <p className="text-xs text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex justify-center py-12">
            <p className="text-sm text-destructive">Failed to load institutions. Please refresh.</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginated}
              keyExtractor={(inst) => inst.institutionCode}
              emptyState={
                <div className="py-12 text-center">
                  <p className="text-base font-black text-foreground">No institutions found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {search ? "Try a different search term." : "Institution list is currently empty."}
                  </p>
                </div>
              }
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-2 py-4">
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages} · {filtered.length} institutions
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
