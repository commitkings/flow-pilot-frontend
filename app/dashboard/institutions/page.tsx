"use client";

import { useState } from "react";
import { Building2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useInstitutions } from "@/hooks/use-institutions";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/status-badge";
import type { Institution } from "@/lib/api-types";

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
  const institutions = data?.data ?? [];

  const activeCount = institutions.filter((i: Institution) => i.isActive).length;
  const inactiveCount = institutions.filter((i: Institution) => !i.isActive).length;

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

      <div className="">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex justify-center py-12">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={institutions}
            keyExtractor={(inst) => inst.institutionCode}
            emptyState={
              <div className="py-12 text-center">
                <p className="text-base font-black text-foreground">No institutions found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Institution list is currently empty.
                </p>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
