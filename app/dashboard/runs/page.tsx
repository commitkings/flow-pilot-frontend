"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, BarChart3, CheckCircle2, Clock3, Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { useDashboardShell } from "@/components/dashboard-shell-context";
import { runs, truncateRunId, type RunRecord } from "@/lib/mock-data";

export default function RunsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openNewRun } = useDashboardShell();
  const [dismissedWelcome, setDismissedWelcome] = useState(false);
  const [firstName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("flowpilot_user_first_name");
  });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState<RunRecord[]>(runs);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const hasNonTerminal = rows.some((run) => ["running", "planning", "awaiting_approval", "executing"].includes(run.status));

  useEffect(() => {
    if (!hasNonTerminal) return;
    const interval = window.setInterval(() => {
      setRows((prev) => [...prev]);
    }, 10000);
    return () => window.clearInterval(interval);
  }, [hasNonTerminal]);

  const filteredRows = useMemo(() => {
    return rows.filter((run) => {
      const matchesQuery =
        run.id.toLowerCase().includes(query.toLowerCase()) ||
        run.objective.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : run.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  const showWelcome = searchParams.get("welcome") === "1" && !dismissedWelcome;

  return (
    <div className="space-y-6">
      {showWelcome && (
        <div className="flex items-start justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-900">
              Welcome to FlowPilot{firstName ? `, ${firstName}` : ""}. Your workspace is ready.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-emerald-700 hover:bg-emerald-100"
            onClick={() => {
              setDismissedWelcome(true);
              router.replace("/dashboard/runs");
            }}
          >
            x
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-slate-900">Runs</h1>
        <Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={openNewRun}>
          <Plus className="h-4 w-4" />
          New Run
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Runs" value="24" icon={<BarChart3 className="h-5 w-5 text-blue-700" />} />
        <MetricCard label="Total Disbursed" value="₦48,250,000" icon={<CheckCircle2 className="h-5 w-5 text-emerald-700" />} />
        <MetricCard label="Pending Approvals" value="2" icon={<Clock3 className="h-5 w-5 text-amber-700" />} accent="amber" />
        <MetricCard label="Failed Runs" value="1" icon={<AlertCircle className="h-5 w-5 text-red-700" />} accent="red" />
      </div>

      <Card className="rounded-xl border-slate-200 bg-white">
        <CardContent className="space-y-4 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by objective or run ID..."
              className="h-10 min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="running">Running</option>
              <option value="awaiting_approval">Awaiting Approval</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <div className="ml-auto flex gap-2">
              <input type="date" className="h-10 rounded-lg border border-slate-300 px-3 text-sm" defaultValue="2026-02-01" />
              <input type="date" className="h-10 rounded-lg border border-slate-300 px-3 text-sm" defaultValue="2026-02-24" />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-slate-900">No runs yet</p>
              <p className="mt-1 text-sm text-slate-600">Create your first run to start automated treasury execution.</p>
              <Button className="mt-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={openNewRun}>
                Start Your First Run
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Run ID</th>
                    <th className="px-3 py-2 font-medium">Objective</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Candidates</th>
                    <th className="px-3 py-2 font-medium">Started</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((run) => (
                    <tr
                      key={run.id}
                      className="cursor-pointer border-t border-slate-200 hover:bg-slate-50"
                      onClick={() => router.push(`/dashboard/runs/${run.id}`)}
                    >
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="group inline-flex items-center gap-1 font-medium text-slate-800"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigator.clipboard.writeText(run.id);
                          }}
                        >
                          {truncateRunId(run.id)}
                          <Copy className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                        </button>
                      </td>
                      <td className="max-w-[420px] truncate px-3 py-2" title={run.objective}>{run.objective}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={run.status} label={run.status === "awaiting_approval" ? "Awaiting Approval" : undefined} />
                      </td>
                      <td className="px-3 py-2">{run.candidates}</td>
                      <td className="px-3 py-2" title={run.startedAt}>{run.startedRelative}</td>
                      <td className="px-3 py-2">
                        <Button size="sm" variant="outline" className="rounded-lg">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "amber" | "red";
}) {
  return (
    <Card className="rounded-xl border-slate-200 bg-white">
      <CardContent className={`flex items-center justify-between py-5 ${accent === "amber" ? "border-l-4 border-l-amber-500" : ""} ${accent === "red" ? "border-l-4 border-l-red-500" : ""}`}>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">{icon}</span>
      </CardContent>
    </Card>
  );
}
