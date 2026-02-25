"use client";

import { useState } from "react";
import { Download, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { naira, transactionRows } from "@/lib/mock-data";

export default function TransactionsPage() {
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const selected = transactionRows.find((row) => row.reference === selectedRef) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Transactions</h1>
          <p className="mt-1 text-sm text-slate-600">Global view of reconciled transactions across all runs.</p>
        </div>
        <Button variant="outline" className="rounded-xl"><Download className="h-4 w-4" />Export CSV</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total Transactions" value="2,847" />
        <Stat label="Total Volume" value="₦284,750,000" />
        <Stat label="Anomalies Detected" value="23" danger />
      </div>

      <Card className="rounded-xl border-slate-200 bg-white">
        <CardContent className="space-y-4 py-5">
          <div className="grid gap-2 md:grid-cols-5">
            <input placeholder="Search by reference or narration..." className="h-10 rounded-lg border border-slate-300 px-3 text-sm md:col-span-2" />
            <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm"><option>Status</option></select>
            <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm"><option>Channel</option><option>WEB</option><option>USSD</option><option>POS</option><option>Mobile</option></select>
            <select className="h-10 rounded-lg border border-slate-300 px-3 text-sm"><option>All Runs</option></select>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <input type="date" className="h-10 rounded-lg border border-slate-300 px-3 text-sm" defaultValue="2026-02-01" />
            <input type="date" className="h-10 rounded-lg border border-slate-300 px-3 text-sm" defaultValue="2026-02-24" />
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Reference</th>
                  <th className="px-3 py-2 font-medium">Channel</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Run ID</th>
                  <th className="px-3 py-2 font-medium">Anomaly</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactionRows.map((row, index) => (
                  <tr key={row.reference} className="border-t border-slate-200">
                    <td className="px-3 py-2">{row.reference}</td>
                    <td className="px-3 py-2"><ChannelBadge value={row.channel} /></td>
                    <td className="px-3 py-2">{naira(row.amount)}</td>
                    <td className="px-3 py-2"><StatusBadge status={row.status === "Completed" ? "completed" : row.status === "Pending" ? "awaiting_approval" : "failed"} label={row.status} /></td>
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2"><a className="text-blue-700" href={`/dashboard/runs/${index % 2 === 0 ? "a3f9b2c1-e4f7-4b80-9f2d-1adf0ac9120f" : "c2a1f349-6cf5-4770-a0fe-4cc8c6e9a0f1"}`}>a3f9b2c1</a></td>
                    <td className="px-3 py-2">
                      {row.anomaly === "Clean" ? <StatusBadge status="verified" label="Clean" /> : <StatusBadge status="failed" label={row.anomaly} />}
                    </td>
                    <td className="px-3 py-2">
                      <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setSelectedRef(row.reference)}>
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>Showing 1-8 of 2,847 results</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg">Previous</Button>
              <Button variant="outline" size="sm" className="rounded-lg">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-200 bg-white p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Transaction Detail</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedRef(null)}><X className="h-4 w-4" /></Button>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="text-slate-500">Reference:</span> {selected.reference}</p>
            <p><span className="text-slate-500">Merchant ID:</span> MID-992018</p>
            <p><span className="text-slate-500">Narration:</span> Salary batch disbursement</p>
            <p><span className="text-slate-500">Channel:</span> {selected.channel}</p>
            <p><span className="text-slate-500">Amount:</span> {naira(selected.amount)}</p>
            <p><span className="text-slate-500">Currency:</span> NGN</p>
            <p><span className="text-slate-500">Status:</span> {selected.status}</p>
            <p><span className="text-slate-500">Date:</span> {selected.date}</p>
            <p><span className="text-slate-500">Anomaly:</span> {selected.anomaly}</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Raw payload summary with sensitive fields redacted.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <Card className="rounded-xl border-slate-200 bg-white">
      <CardContent className="py-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${danger ? "text-red-700" : "text-slate-900"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function ChannelBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    WEB: "bg-blue-100 text-blue-700",
    USSD: "bg-purple-100 text-purple-700",
    POS: "bg-teal-100 text-teal-700",
    MOBILE: "bg-indigo-100 text-indigo-700",
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[value] ?? "bg-slate-100 text-slate-700"}`}>{value}</span>;
}
