"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { naira, truncateRunId } from "@/lib/mock-data";
import { downloadRunReport } from "@/lib/api-client";
import { useRunReport } from "@/hooks/use-run-queries";
import { downloadBlob } from "@/utils/useHelper";

export default function RunReportPage() {
  const { id } = useParams<{ id: string }>();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  const { data: report, isLoading: reportLoading, isError: reportError } = useRunReport(id, true);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(false);
    try {
      const blob = await downloadRunReport(id);
      downloadBlob(blob, `run-${id}-report.json`);
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };

  const auditEntries = report?.audit_trail ?? report?.entries ?? [];
  const summary = report?.report?.summary;
  const executionResults = report?.report?.execution_results as
    | { payouts?: Array<{ beneficiary: string; institution: string; amount: number; status: string; reference: string }> }
    | undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/dashboard/runs/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Runs / Run {truncateRunId(id)} / Report
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Audit Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl"><Link2 className="h-4 w-4" />Share Report</Button>
          <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800" onClick={handleDownload} disabled={downloading}><Download className="h-4 w-4" />{downloading ? "Downloading…" : "Download Report"}</Button>
        </div>
      </div>

      {downloadError && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          Download failed. Please try again.
        </div>
      )}

      {reportLoading && (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      )}

      {reportError && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No report available yet. The run may still be in progress.
        </div>
      )}

      {!reportLoading && !reportError && report && (
        <>
          {summary && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {String(summary)}
            </div>
          )}

          <Card className="rounded-xl border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-base">Run Summary</CardTitle></CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <KV label="Run ID" value={truncateRunId(id)} />
                <KV label="Status" value={<StatusBadge status="completed" />} />
              </div>
              {!!report.report?.risk_overview && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <p className="font-medium text-slate-900">Risk Overview</p>
                  <pre className="mt-2 text-xs text-slate-600 whitespace-pre-wrap">{JSON.stringify(report.report.risk_overview, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>

          {executionResults?.payouts && executionResults.payouts.length > 0 && (
            <Card className="rounded-xl border-slate-200 bg-white">
              <CardHeader><CardTitle className="text-base">Payout Outcomes</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-600"><tr><th className="py-2">Beneficiary</th><th>Institution</th><th>Amount</th><th>Status</th><th>Reference</th></tr></thead>
                  <tbody>
                    {executionResults.payouts.map((p, i) => (
                      <tr key={`${p.reference}-${i}`} className="border-b border-slate-100">
                        <td className="py-2">{p.beneficiary}</td><td>{p.institution}</td><td>{naira(p.amount)}</td>
                        <td><StatusBadge status={p.status === "successful" ? "completed" : p.status === "failed" ? "failed" : "review"} label={p.status} /></td>
                        <td>{p.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {auditEntries.length > 0 && (
            <Card className="rounded-xl border-slate-200 bg-white">
              <CardHeader><CardTitle className="text-base">Audit Trail</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-slate-600">Authentication headers and sensitive payload fields have been redacted.</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-600"><tr><th className="py-2">Agent</th><th>Action</th><th>Step</th><th>Time</th></tr></thead>
                    <tbody>
                      {auditEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-100">
                          <td className="py-2">{entry.agent_type}</td>
                          <td>{entry.action}</td>
                          <td>{entry.step_id ?? "—"}</td>
                          <td>{new Date(entry.created_at).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

