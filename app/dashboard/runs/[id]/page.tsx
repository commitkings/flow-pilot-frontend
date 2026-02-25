"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { approvalCandidates, maskAccount, naira, runs, transactionRows, truncateRunId } from "@/lib/mock-data";

const planSteps = [
  ["Create Plan", "PlannerAgent"],
  ["Fetch Transactions", "ReconciliationAgent"],
  ["Reconcile Ledger", "ReconciliationAgent"],
  ["Score Risk", "RiskAgent"],
  ["Forecast Liquidity", "ForecastAgent"],
  ["Verify Recipients", "ExecutionAgent"],
  ["Await Approval", "ExecutionAgent"],
  ["Execute Payouts", "ExecutionAgent"],
] as const;

export default function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("transactions");
  const [openCallCard, setOpenCallCard] = useState<number | null>(0);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  const run = runs.find((row) => row.id === id) ?? runs[0];
  const phase = searchParams.get("phase") === "executing" ? "executing" : "running";

  const status = phase === "executing" ? "executing" : run.status;

  const timelineCards =
    phase === "executing"
      ? [
          {
            agent: "Execution",
            color: "bg-indigo-100 text-indigo-700",
            step: "Sending payout to Amina Suleiman",
            status: "running",
            progress: 72,
            message: "Submitting ₦260,000 to Stanbic IBTC account 408***991 via Interswitch",
            time: "Just now",
            calls: 1,
          },
          {
            agent: "Execution",
            color: "bg-indigo-100 text-indigo-700",
            step: "Payout confirmed — Ngozi Eze",
            status: "completed",
            progress: 100,
            message: "₦175,000 successfully sent to Zenith Bank. Reference: ISW-2024-789441",
            time: "15 sec ago",
            calls: 1,
          },
          {
            agent: "Execution",
            color: "bg-indigo-100 text-indigo-700",
            step: "Payout confirmed — Fatima Bello",
            status: "completed",
            progress: 100,
            message: "₦320,000 successfully sent to Access Bank. Reference: ISW-2024-789440",
            time: "28 sec ago",
            calls: 1,
          },
          {
            agent: "Execution",
            color: "bg-indigo-100 text-indigo-700",
            step: "Payout confirmed — Chukwuemeka Adeyemi",
            status: "completed",
            progress: 100,
            message: "₦450,000 successfully sent to GTBank. Reference: ISW-2024-789439",
            time: "41 sec ago",
            calls: 1,
          },
          {
            agent: "Execution",
            color: "bg-indigo-100 text-indigo-700",
            step: "Recipient verification complete",
            status: "completed",
            progress: 100,
            message: "4 recipients verified. 1 mismatch flagged for manual review. 1 blocked.",
            time: "3 min ago",
            calls: 2,
          },
        ]
      : [
          {
            agent: "Reconciliation",
            color: "bg-blue-100 text-blue-700",
            step: "Reconciling transaction ledger",
            status: "running",
            progress: 67,
            message: "Processing 467 of 700 transactions — detecting anomalies",
            time: "Just now",
            calls: 3,
          },
          {
            agent: "Reconciliation",
            color: "bg-blue-100 text-blue-700",
            step: "Fetching transactions from Interswitch",
            status: "completed",
            progress: 100,
            message: "Successfully pulled 700 transactions for Feb 1–14",
            time: "2 min ago",
            calls: 2,
          },
          {
            agent: "Planner",
            color: "bg-purple-100 text-purple-700",
            step: "Creating execution plan",
            status: "completed",
            progress: 100,
            message: "Plan created with 8 steps and 6 dependencies",
            time: "4 min ago",
            calls: 1,
          },
        ];

  const selected = useMemo(
    () => approvalCandidates.find((candidate) => candidate.id === selectedCandidate) ?? null,
    [selectedCandidate]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/runs" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Runs / Run {truncateRunId(id)}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Agent Execution</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status as "running" | "awaiting_approval" | "executing" | "failed" | "completed"} label={status === "awaiting_approval" ? "Running" : undefined} />
          <span className="text-sm text-slate-500">{phase === "executing" ? "Executing since 30 seconds ago" : "Started 4 minutes ago"}</span>
          {!["completed", "failed"].includes(status) && (
            <Button variant="outline" className="rounded-xl">Cancel Run</Button>
          )}
        </div>
      </div>

      {run.status === "awaiting_approval" && phase !== "executing" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            Agents have completed their analysis. Your approval is required before payouts can execute.
          </div>
          <Button className="rounded-xl bg-amber-500 text-white hover:bg-amber-600" onClick={() => router.push(`/dashboard/runs/${id}/approve`)}>
            Review and Approve
          </Button>
        </div>
      )}

      {phase === "executing" && (
        <div className="flex items-center justify-between rounded-xl bg-indigo-600 px-4 py-3 text-sm text-white">
          <p>FlowPilot is executing your approved payouts through Interswitch. Do not close this page.</p>
          <span className="font-semibold">3 of 4 payouts sent</span>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="space-y-4 xl:col-span-1">
          <Card className="rounded-xl border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Run Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <KeyValue label="Objective" value={run.objective} />
              <KeyValue label="Risk Tolerance" value="0.35" />
              <KeyValue label="Budget Cap" value="₦2,500,000" />
              <KeyValue label="Candidates" value="6" />
              <KeyValue label="Started" value="4 mins ago" />
              <KeyValue label="Status" value={<StatusBadge status={status as "running" | "awaiting_approval" | "executing" | "failed" | "completed"} />} />
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Execution Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {planSteps.map(([name, agent], index) => {
                const doneIndex = phase === "executing" ? 6 : 1;
                const isDone = index <= doneIndex;
                const isCurrent = phase === "executing" ? index === 7 : index === 2;
                return (
                  <div key={name} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px]">
                      {isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : isCurrent ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" /> : <span className="h-2 w-2 rounded-full bg-slate-300" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{name}</p>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{agent}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Agent Timeline</h2>
          {timelineCards.map((card, index) => (
            <Card
              key={`${card.step}-${index}`}
              className={`rounded-xl border-slate-200 bg-white ${
                card.status === "running"
                  ? "border-l-4 border-l-blue-500"
                  : card.status === "completed"
                    ? "border-l-4 border-l-emerald-500"
                    : "border-l-4 border-l-red-500"
              }`}
            >
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${card.color}`}>{card.agent}</span>
                    <p className="text-sm font-semibold text-slate-900">{card.step}</p>
                  </div>
                  {card.status === "running" ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : card.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                </div>

                {card.progress > 0 && (
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${card.progress}%` }} />
                  </div>
                )}

                <p className="text-sm text-slate-600">{card.message}</p>
                <button
                  type="button"
                  onClick={() => setOpenCallCard((prev) => (prev === index ? null : index))}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500"
                >
                  {card.calls} API calls
                  <ChevronDown className={`h-3.5 w-3.5 transition ${openCallCard === index ? "rotate-180" : ""}`} />
                </button>
                {openCallCard === index && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <p>POST /api/v1/transactions/search/quick · 200 · 432ms</p>
                    <p>POST /api/v1/transactions/search/reference · 200 · 289ms</p>
                    <p>POST /api/v1/payouts/customer-lookup · 200 · 501ms</p>
                  </div>
                )}
                <p className="text-xs text-slate-400">{card.time}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4 xl:col-span-1">
          <Card className="rounded-xl border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Live Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <MiniStat label="Transactions Pulled" value="700" />
              <MiniStat label="Anomalies Detected" value="3" badge="red" />
              <MiniStat label="Candidates Scored" value={phase === "executing" ? "6" : "0"} muted={phase !== "executing"} />
              <MiniStat label="Lookups Verified" value={phase === "executing" ? "4" : "0"} muted={phase !== "executing"} />
              <MiniStat label="Payout Queue" value="6" />
              <MiniStat label="Estimated Total" value="₦2,150,000" />
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Run Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-44 space-y-2 overflow-y-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                <p>[11:03:10] planner.step.create_plan {`->`} ok</p>
                <p>[11:03:15] reconciliation.fetch.quick_search {`->`} 700 records</p>
                <p>[11:03:27] risk.score.batch {`->`} pending</p>
                <p>[11:03:31] execution.lookup.queue {`->`} waiting</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-xl border-slate-200 bg-white">
        <CardContent className="py-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              ["transactions", "Transactions"],
              ["candidates", "Candidates"],
              ["forecast", "Forecast"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${activeTab === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "transactions" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2">Reference</th>
                    <th className="py-2">Channel</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Anomaly</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionRows.slice(0, 6).map((row) => (
                    <tr key={row.reference} className="border-b border-slate-100">
                      <td className="py-2">{row.reference}</td>
                      <td className="py-2"><ChannelBadge value={row.channel} /></td>
                      <td className="py-2">{naira(row.amount)}</td>
                      <td className="py-2"><StatusBadge status={row.status === "Completed" ? "completed" : row.status === "Pending" ? "awaiting_approval" : "failed"} label={row.status} /></td>
                      <td className="py-2">{row.date}</td>
                      <td className="py-2">{row.anomaly === "Clean" ? <StatusBadge status="verified" label="Clean" /> : <StatusBadge status="failed" label={row.anomaly} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "candidates" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2">Name</th>
                    <th className="py-2">Institution</th>
                    <th className="py-2">Account Number</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Risk Score</th>
                    <th className="py-2">Risk Decision</th>
                    <th className="py-2">Lookup Status</th>
                    <th className="py-2">Approval Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalCandidates.map((candidate) => (
                    <tr key={candidate.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={() => setSelectedCandidate(candidate.id)}>
                      <td className="py-2">{candidate.beneficiaryName}</td>
                      <td className="py-2">{candidate.institution}</td>
                      <td className="py-2">{maskAccount(candidate.accountNumber)}</td>
                      <td className="py-2">{naira(candidate.amount)}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full ${candidate.riskScore < 0.35 ? "bg-emerald-500" : candidate.riskScore < 0.65 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${candidate.riskScore * 100}%` }} />
                          </div>
                          <span>{candidate.riskScore.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="py-2"><StatusBadge status={candidate.decision} /></td>
                      <td className="py-2"><StatusBadge status={candidate.lookupStatus} /></td>
                      <td className="py-2"><StatusBadge status={candidate.approvalStatus === "selected" ? "active" : candidate.approvalStatus === "blocked" ? "block" : candidate.approvalStatus === "successful" ? "successful" : "review"} label={candidate.approvalStatus.replaceAll("_", " ")} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "forecast" && (
            <div className="space-y-3">
              <div className="h-52 rounded-lg border border-slate-200 bg-gradient-to-b from-blue-50 to-white p-4">
                <p className="text-sm text-slate-600">Projected inflow vs payout-adjusted balance (7 days)</p>
                <div className="mt-4 h-36 rounded-md border border-dashed border-slate-300 bg-white" />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Current Balance: ₦3,870,000</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Projected 7-Day Balance: ₦1,610,000</span>
                <StatusBadge status="review" label="Feasibility: Caution" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-200 bg-white p-5 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{selected.beneficiaryName}</h3>
              <p className="text-sm text-slate-600">{selected.institution}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedCandidate(null)}>x</Button>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <p><span className="text-slate-500">Account:</span> {selected.accountNumber}</p>
            <p><span className="text-slate-500">Amount:</span> {naira(selected.amount)}</p>
            <p className="font-medium text-slate-800">Risk Reasons</p>
            <ul className="list-disc space-y-1 pl-5 text-slate-600">
              {selected.riskReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p><span className="text-slate-500">Name on file:</span> {selected.nameOnFile}</p>
            <p><span className="text-slate-500">Name returned:</span> {selected.returnedName}</p>
            <p><span className="text-slate-500">Similarity:</span> {selected.similarity}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="text-sm text-slate-800">{value}</div>
    </div>
  );
}

function MiniStat({ label, value, badge, muted }: { label: string; value: string; badge?: "red"; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${badge === "red" ? "text-red-700" : muted ? "text-slate-400" : "text-slate-900"}`}>{value}</span>
    </div>
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
