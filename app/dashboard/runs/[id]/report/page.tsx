"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { apiTraceRows, naira, truncateRunId } from "@/lib/mock-data";

export default function RunReportPage() {
  const { id } = useParams<{ id: string }>();

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
          <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"><Download className="h-4 w-4" />Download PDF</Button>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Run completed successfully. 4 of 6 candidates disbursed. ₦1,205,000 transferred.
      </div>

      <Card className="rounded-xl border-slate-200 bg-white">
        <CardHeader><CardTitle className="text-base">Run Summary</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <KV label="Run ID" value={truncateRunId(id)} />
            <KV label="Operator" value="Oluwaseun Adeyemi" />
            <KV label="Started" value="11:03:10" />
            <KV label="Completed" value="11:37:21" />
            <KV label="Duration" value="34m 11s" />
            <KV label="Status" value={<StatusBadge status="completed" />} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-medium text-slate-900">Outcome Distribution</p>
            <div className="mt-3 h-40 rounded-full border-8 border-emerald-500/40" />
            <p className="mt-3 text-slate-600">4 Approved · 1 Blocked · 1 Under Review</p>
            <p className="text-xl font-bold text-emerald-700">{naira(1205000)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200 bg-white">
        <CardHeader><CardTitle className="text-base">Execution Plan</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-600"><tr><th className="py-2">Step</th><th>Agent</th><th>Status</th><th>Duration</th></tr></thead>
            <tbody>
              {[
                ["Create Plan", "Planner", "0.8s"],
                ["Fetch Transactions", "Reconciliation", "12.3s"],
                ["Reconcile Ledger", "Reconciliation", "4.1s"],
                ["Score Risk", "Risk", "2.9s"],
                ["Forecast Liquidity", "Forecast", "5.7s"],
                ["Verify Recipients", "Execution", "8.2s"],
                ["Await Approval", "Execution", "0.3s"],
                ["Execute Payouts", "Execution", "3.4s"],
              ].map(([step, agent, duration]) => (
                <tr key={step} className="border-b border-slate-100">
                  <td className="py-2">{step}</td><td>{agent}</td><td><StatusBadge status="completed" /></td><td>{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200 bg-white">
        <CardHeader><CardTitle className="text-base">Reconciliation Summary</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <KV label="Total Fetched" value="700" /><KV label="Completed" value="631" />
            <KV label="Pending" value="42" /><KV label="Failed" value="18" />
            <KV label="Reversed" value="9" /><KV label="Channels" value="WEB/USSD/POS/Mobile" />
          </div>
          <div className="h-44 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Transactions by Channel chart placeholder</div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200 bg-white">
        <CardHeader><CardTitle className="text-base">Risk Assessment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 overflow-hidden rounded-full">
            <div className="grid h-full grid-cols-[4fr_1fr_1fr]">
              <span className="bg-emerald-500" /><span className="bg-amber-500" /><span className="bg-red-500" />
            </div>
          </div>
          <p className="text-sm text-slate-600">4 Allow · 1 Review · 1 Block</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200 bg-white">
        <CardHeader><CardTitle className="text-base">Payout Outcomes</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-600"><tr><th className="py-2">Beneficiary</th><th>Institution</th><th>Amount</th><th>Status</th><th>Reference</th></tr></thead>
            <tbody>
              {[
                ["Chukwuemeka Adeyemi", "GTBank", "₦450,000", "successful", "ISW-2024-789439"],
                ["Fatima Bello", "Access Bank", "₦320,000", "successful", "ISW-2024-789440"],
                ["Ngozi Eze", "Zenith Bank", "₦175,000", "successful", "ISW-2024-789441"],
                ["Amina Suleiman", "Stanbic IBTC", "₦260,000", "successful", "ISW-2024-789442"],
                ["Emeka Okonkwo", "UBA", "₦1,200,000", "failed", "Blocked by policy"],
                ["Taiwo Ogundimu", "First Bank", "₦890,000", "requires_followup", "Manual review"],
              ].map(([name, institution, amount, status, reference]) => (
                <tr key={name} className="border-b border-slate-100">
                  <td className="py-2">{name}</td><td>{institution}</td><td>{amount}</td><td><StatusBadge status={status as "successful" | "failed" | "requires_followup"} /></td><td>{reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm font-semibold text-slate-900">Total Disbursed: ₦1,205,000 across 4 payouts.</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200 bg-white">
        <CardHeader><CardTitle className="text-base">API Call Trace</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-600">Authentication headers and sensitive payload fields have been redacted.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600"><tr><th className="py-2">Agent</th><th>Endpoint</th><th>Method</th><th>Status</th><th>Duration</th></tr></thead>
              <tbody>
                {apiTraceRows.map(([agent, endpoint, method, status, duration], index) => (
                  <tr key={`${endpoint}-${index}`} className="border-b border-slate-100">
                    <td className="py-2">{agent}</td><td>{endpoint}</td><td>{method}</td><td>{status}</td><td>{duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
