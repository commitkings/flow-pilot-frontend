"use client";

import { useState } from "react";
import { Building2, Loader2, CheckCircle2, XCircle, Landmark, Smartphone, Banknote } from "lucide-react";
import { useInstitutions } from "@/hooks/use-institutions";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import type { Institution } from "@/lib/api-types";

const PAGE_SIZE = 50;

const TYPE_FILTERS: { label: string; value: string }[] = [
  { label: "All",          value: ""            },
  { label: "Banks",        value: "bank"         },
  { label: "Microfinance", value: "microfinance" },
  { label: "Mobile Money", value: "mobile_money" },
  { label: "Other",        value: "other"        },
];

function typeLabel(type?: string | null): string {
  switch (type) {
    case "bank":         return "Bank";
    case "microfinance": return "Microfinance";
    case "mobile_money": return "Mobile Money";
    case "other":        return "Other";
    default:             return "—";
  }
}

function typeAccent(type?: string | null): string {
  switch (type) {
    case "bank":         return "border border-blue-200 bg-blue-50 text-blue-700";
    case "microfinance": return "border border-purple-200 bg-purple-50 text-purple-700";
    case "mobile_money": return "border border-teal-200 bg-teal-50 text-teal-700";
    default:             return "border border-border bg-muted text-muted-foreground";
  }
}

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
        <Building2 className="h-4 w-4 shrink-0 text-brand" />
        <span className="truncate">{inst.institutionName}</span>
      </div>
    ),
  },
  {
    id: "institutionType",
    header: "Type",
    cell: (inst) => (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeAccent(inst.institutionType)}`}>
        {typeLabel(inst.institutionType)}
      </span>
    ),
  },
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
    cell: (inst) => (
      <span className="text-muted-foreground text-xs">{formatDateTime(inst.lastSyncedAt)}</span>
    ),
  },
];

export default function InstitutionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [offset, setOffset] = useState(0);

  const { data, isLoading: loading, isError: error } = useInstitutions({
    search: search || undefined,
    institution_type: typeFilter || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const institutions = data?.data ?? [];
  const total = data?.total ?? 0;
  const activeCount = institutions.filter((i: Institution) => i.isActive).length;
  const inactiveCount = institutions.filter((i: Institution) => !i.isActive).length;

  function handleTypeFilter(value: string) {
    setTypeFilter(value);
    setOffset(0);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setOffset(0);
  }

  const emptyMessage = search || typeFilter
    ? "Try adjusting your search or filter."
    : "Institution list is currently empty.";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutions"
        description="Manage and view supported receiving institutions for payouts."
      />

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Institutions"
          value={loading ? "…" : String(total)}
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
        {/* Toolbar */}
        <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or code…"
            className="w-full md:w-72"
          />

          {/* Type filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {TYPE_FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={typeFilter === f.value ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => handleTypeFilter(f.value)}
              >
                {f.value === "bank"         && <Landmark className="mr-1.5 h-3 w-3" />}
                {f.value === "microfinance" && <Banknote className="mr-1.5 h-3 w-3" />}
                {f.value === "mobile_money" && <Smartphone className="mr-1.5 h-3 w-3" />}
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
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
              data={institutions}
              keyExtractor={(inst) => inst.institutionCode}
              emptyState={
                <div className="py-12 text-center">
                  <p className="text-base font-black text-foreground">No institutions found</p>
                  <p className="mt-1 text-sm text-muted-foreground">{emptyMessage}</p>
                </div>
              }
            />
            <Pagination total={total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />
          </>
        )}
      </div>
    </div>
  );
}
