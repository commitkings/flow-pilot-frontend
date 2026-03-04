"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { maskAccount, naira, truncateRunId, type PayoutCandidate } from "@/lib/mock-data";
import { listCandidates, adaptCandidate, approveCandidates } from "@/lib/api-client";

export default function ApprovalGatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [allCandidates, setAllCandidates] = useState<PayoutCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [overrideDecision, setOverrideDecision] = useState("review");
  const [overrideReason, setOverrideReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [approving, setApproving] = useState(false);

  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [candidatesError, setCandidatesError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listCandidates(id).then((res) => {
      if (cancelled) return;
      const adapted = res.candidates.map(adaptCandidate);
      setAllCandidates(adapted);
      setSelectedIds(adapted.filter((c) => c.approvalStatus === "selected").map((c) => c.id));
    }).catch(() => { if (!cancelled) setCandidatesError(true); }).finally(() => { if (!cancelled) setLoadingCandidates(false); });
    return () => { cancelled = true; };
  }, [id]);

  const rows = useMemo(
    () =>
      allCandidates.filter(
        (candidate) =>
          candidate.beneficiaryName.toLowerCase().includes(query.toLowerCase()) ||
          candidate.institution.toLowerCase().includes(query.toLowerCase())
      ),
    [query, allCandidates]
  );

  const selectedCandidates = allCandidates.filter((candidate) => selectedIds.includes(candidate.id));
  const selectedTotal = selectedCandidates.reduce((acc, candidate) => acc + candidate.amount, 0);

  const activeCandidate = allCandidates.find((candidate) => candidate.id === activeCandidateId) ?? null;

  const toggle = (candidateId: string) => {
    setSelectedIds((prev) =>
      prev.includes(candidateId) ? prev.filter((cid) => cid !== candidateId) : [...prev, candidateId]
    );
  };

  const selectAllSafe = () => {
    setSelectedIds(
      allCandidates
        .filter((candidate) => candidate.decision === "allow" && candidate.lookupStatus === "verified")
        .map((candidate) => candidate.id)
    );
  };

  const [approveError, setApproveError] = useState(false);

  const onApprove = async () => {
    if (!confirmChecked || approving) return;
    setApproving(true);
    setApproveError(false);
    try {
      await approveCandidates(id, selectedIds);
      router.push(`/dashboard/runs/${id}?phase=executing`);
    } catch {
      setApproveError(true);
      setApproving(false);
    }
  };

  if (loadingCandidates) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  if (candidatesError) {
    return <div className="flex items-center justify-center py-24"><p className="text-sm text-red-600">Failed to load candidates. Please go back and try again.</p></div>;
  }

  return (
    <div className="space-y-5 pb-28">
      <div>
        <Link href={`/dashboard/runs/${id}`} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Runs / Run {truncateRunId(id)} / Approve
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Approval Gate.</h1>
        <p className="mt-1 text-sm text-slate-500">Reconcile today and execute payroll payouts under risk threshold 0.35.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">Run ID {truncateRunId(id)}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">Risk Tolerance 0.35</span>
        <StatusBadge status="review" label="Forecast Feasibility: Caution" />
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          ForecastAgent has flagged that this payout batch may stress your liquidity position. Review the Forecast tab before approving.
        </div>
      </div>

      <Card className="rounded-xl border-slate-200 bg-white">
        <CardContent className="space-y-4 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">{selectedIds.length} of 6 candidates selected</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-lg" onClick={selectAllSafe}>Select All Safe</Button>
              <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setSelectedIds([])}>Deselect All</Button>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter by name or bank..."
                className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2">Select</th>
                  <th className="py-2">Beneficiary Name</th>
                  <th className="py-2">Institution</th>
                  <th className="py-2">Account Number</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Risk Score</th>
                  <th className="py-2">Risk Reasons</th>
                  <th className="py-2">Lookup Status</th>
                  <th className="py-2">Decision</th>
                  <th className="py-2">Override</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((candidate) => {
                  const selected = selectedIds.includes(candidate.id);
                  const blocked = candidate.decision === "block";
                  return (
                    <tr
                      key={candidate.id}
                      className={`border-b border-slate-100 ${blocked ? "bg-red-50" : selected ? "border-l-4 border-l-emerald-500" : candidate.decision === "review" ? "border-l-4 border-l-amber-500" : ""}`}
                    >
                      <td className="py-2">
                        <button
                          type="button"
                          className={`inline-flex h-5 w-5 items-center justify-center rounded border ${selected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}
                          onClick={() => toggle(candidate.id)}
                          disabled={blocked}
                        >
                          {blocked ? "🔒" : selected ? <Check className="h-3 w-3" /> : null}
                        </button>
                      </td>
                      <td className="py-2">
                        <button type="button" className="font-medium text-slate-900" onClick={() => setActiveCandidateId(candidate.id)}>
                          {candidate.beneficiaryName}
                        </button>
                      </td>
                      <td className="py-2">{candidate.institution}</td>
                      <td className="py-2">{maskAccount(candidate.accountNumber)}</td>
                      <td className="py-2">{naira(candidate.amount)}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div className={`${candidate.riskScore < 0.35 ? "bg-emerald-500" : candidate.riskScore < 0.65 ? "bg-amber-500" : "bg-red-500"} h-full`} style={{ width: `${candidate.riskScore * 100}%` }} />
                          </div>
                          <span>{candidate.riskScore.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="py-2">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{candidate.riskReasons[0]}</span>
                        <button type="button" className="ml-2 text-xs text-blue-700">See All</button>
                      </td>
                      <td className="py-2"><StatusBadge status={candidate.lookupStatus} /></td>
                      <td className="py-2"><StatusBadge status={candidate.decision} /></td>
                      <td className="py-2"><button type="button" className="text-xs text-blue-700">Override</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {activeCandidate && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-200 bg-white p-5 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">{activeCandidate.beneficiaryName}</p>
              <p className="text-sm text-slate-600">{activeCandidate.institution}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setActiveCandidateId(null)}><X className="h-4 w-4" /></Button>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <p><span className="text-slate-500">Account:</span> {activeCandidate.accountNumber}</p>
            <p><span className="text-slate-500">Amount:</span> {naira(activeCandidate.amount)}</p>
            <p><span className="text-slate-500">Purpose:</span> {activeCandidate.purpose}</p>
            <p className="font-medium text-slate-800">Risk Reasons</p>
            <ul className="list-disc space-y-1 pl-5 text-slate-600">
              {activeCandidate.riskReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p><span className="text-slate-500">Name on file:</span> {activeCandidate.nameOnFile}</p>
            <p><span className="text-slate-500">Name returned:</span> {activeCandidate.returnedName}</p>
            <p><span className="text-slate-500">Similarity:</span> {activeCandidate.similarity}%</p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-sm font-medium text-slate-800">Decision Override</p>
              <select value={overrideDecision} onChange={(event) => setOverrideDecision(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm">
                <option value="allow">Allow</option>
                <option value="review">Review</option>
                <option value="block">Block</option>
              </select>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
                placeholder="Reason is required"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" className="rounded-lg">Close</Button>
                <Button className="rounded-lg bg-blue-600 text-white hover:bg-blue-700">Apply Override</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-6 py-3">
          <p className="text-sm font-semibold text-slate-900">
            Approving {selectedIds.length} payouts totalling {naira(selectedTotal)}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl border-red-300 text-red-700 hover:bg-red-50">Reject All</Button>
            <Button className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" disabled={selectedIds.length === 0} onClick={() => setConfirmOpen(true)}>
              <ShieldCheck className="h-4 w-4" />
              Approve Selected
            </Button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-center text-2xl font-semibold text-slate-900">Confirm Payout Approval.</h3>
            <p className="mt-2 text-center text-sm text-slate-600">
              This action will instruct FlowPilot to execute the following disbursements through Interswitch immediately. This cannot be undone.
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              {selectedCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between border-b border-slate-200 py-2 last:border-0">
                  <div>
                    <p className="font-medium text-slate-900">{candidate.beneficiaryName}</p>
                    <p className="text-xs text-slate-500">{candidate.institution}</p>
                  </div>
                  <p className="font-semibold text-slate-900">{naira(candidate.amount)}</p>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
                <p className="font-medium text-slate-700">Total Disbursement</p>
                <p className="text-xl font-bold text-emerald-700">{naira(selectedTotal)}</p>
              </div>
            </div>

            <label className="mt-4 flex items-start gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} className="mt-1" />
              I confirm I have reviewed all risk flags and lookup results and authorize these payments.
            </label>

            <div className="mt-4 space-y-2">
              {approveError && <p className="text-sm text-red-600">Approval failed. Please try again.</p>}
              <Button className="h-11 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" disabled={!confirmChecked || approving} onClick={onApprove}>
                <Check className="h-4 w-4" />
                {approving ? "Processing…" : "Confirm and Execute Payouts"}
              </Button>
              <Button variant="ghost" className="h-11 w-full rounded-xl" onClick={() => setConfirmOpen(false)}>
                Go Back and Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
