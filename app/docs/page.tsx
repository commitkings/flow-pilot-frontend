"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

// ─── Types ────────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface ParamRow {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface EndpointProps {
  id: string;
  method: HttpMethod;
  path: string;
  description: string;
  params?: ParamRow[];
  requestBody?: string;
  responseBody: string;
  scope?: string;
  statusCode?: number;
}

// ─── Nav structure ─────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Getting Started",
    items: [
      { id: "overview",       label: "Overview" },
      { id: "authentication", label: "Authentication" },
      { id: "pagination",     label: "Pagination" },
      { id: "errors",         label: "Errors" },
    ],
  },
  {
    label: "Resources",
    items: [
      { id: "runs",         label: "Runs" },
      { id: "candidates",   label: "Candidates" },
      { id: "approvals",    label: "Approvals" },
      { id: "transactions", label: "Transactions" },
      { id: "audit-log",    label: "Audit Log" },
      { id: "webhooks",     label: "Webhooks" },
    ],
  },
];

const ALL_SECTIONS = NAV_GROUPS.flatMap((g) => g.items);

// ─── Method badge ─────────────────────────────────────────────────────────────

const METHOD_STYLES: Record<HttpMethod, { badge: string; border: string }> = {
  GET:    { badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25", border: "border-l-emerald-500/60" },
  POST:   { badge: "bg-blue-500/15 text-blue-400 border border-blue-500/25",         border: "border-l-blue-500/60"   },
  PATCH:  { badge: "bg-amber-500/15 text-amber-400 border border-amber-500/25",      border: "border-l-amber-500/60"  },
  DELETE: { badge: "bg-red-500/15 text-red-400 border border-red-500/25",            border: "border-l-red-500/60"    },
};

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-wide ${METHOD_STYLES[method].badge}`}>
      {method}
    </span>
  );
}

// ─── Code block ──────────────────────────────────────────────────────────────

function CodeBlock({ children, label }: { children: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative rounded-xl border border-white/[0.07] overflow-hidden bg-[#131620]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.07] bg-white/2">
        <span className="text-[10px] font-mono font-semibold text-[#64748b] uppercase tracking-wider">
          {label ?? "json"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition-colors bg-white/[0.05] hover:bg-white/[0.1] text-[#94a3b8] hover:text-[#b8c6d3] border border-white/[0.07]"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 5l2.5 2.5L8 3" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7 3V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="px-4 py-4 text-xs text-[#b8c6d3] overflow-x-auto font-mono leading-relaxed whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

// ─── Params table ─────────────────────────────────────────────────────────────

function ParamsTable({ params }: { params: ParamRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-white/[0.07] bg-white/2">
            {["Parameter", "Type", "Required", "Description"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase tracking-wider text-[10px]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {params.map((p) => (
            <tr key={p.name} className="hover:bg-white/2 transition-colors">
              <td className="px-4 py-3">
                <code className="text-[11px] bg-white/[0.07] text-[#7dd3fc] px-1.5 py-0.5 rounded font-mono">
                  {p.name}
                </code>
              </td>
              <td className="px-4 py-3">
                <span className="text-[11px] font-mono text-[#94a3b8]">{p.type}</span>
              </td>
              <td className="px-4 py-3">
                {p.required ? (
                  <span className="text-[11px] text-emerald-400 font-semibold">Yes</span>
                ) : (
                  <span className="text-[11px] text-[#64748b]">No</span>
                )}
              </td>
              <td className="px-4 py-3 text-[11px] text-[#94a3b8] leading-relaxed">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="flex items-center gap-3 text-lg font-bold text-[#f1f5f9] mt-16 mb-6 pb-4 border-b border-white/[0.07] scroll-mt-8"
    >
      <span className="h-5 w-[3px] rounded-full shrink-0" style={{ background: "#e86727" }} />
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-[#cbd5e1] mt-10 mb-3">{children}</h3>
  );
}

// ─── Inline code ──────────────────────────────────────────────────────────────

function IC({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-[#7dd3fc] bg-white/[0.07] px-1.5 py-0.5 rounded font-mono text-[11px]">
      {children}
    </code>
  );
}

// ─── Endpoint block ───────────────────────────────────────────────────────────

function EndpointBlock({
  id,
  method,
  path,
  description,
  params,
  requestBody,
  responseBody,
  scope,
  statusCode = 200,
}: EndpointProps) {
  const styles = METHOD_STYLES[method];
  return (
    <div
      id={id}
      className={`mt-8 scroll-mt-8 rounded-xl border border-white/[0.07] border-l-2 overflow-hidden ${styles.border}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white/2 border-b border-white/[0.07]">
        <MethodBadge method={method} />
        <code className="text-sm font-mono text-[#e2e8f0] font-medium">{path}</code>
        {statusCode !== 200 && (
          <span className="text-[10px] font-mono text-[#94a3b8] bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.07]">
            {statusCode}
          </span>
        )}
        {scope && (
          <span
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono border"
            style={{ background: "#e86727" + "18", borderColor: "#e86727" + "30", color: "#e86727" }}
          >
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M5 1a2 2 0 0 0-2 2v1H2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7V3a2 2 0 0 0-2-2Zm1 3H4V3a1 1 0 1 1 2 0v1Z" fill="currentColor" />
            </svg>
            {scope}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-5">
        <p className="text-sm text-[#b8c6d3] leading-relaxed">{description}</p>

        {params && params.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2">
              Query Parameters
            </p>
            <ParamsTable params={params} />
          </div>
        )}

        {requestBody && (
          <div>
            <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2">
              Request Body
            </p>
            <CodeBlock>{requestBody}</CodeBlock>
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2">
            Response
          </p>
          <CodeBlock>{responseBody}</CodeBlock>
        </div>
      </div>
    </div>
  );
}

// ─── JSON payloads ────────────────────────────────────────────────────────────

const RUNS_LIST_RESPONSE = `{
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "objective": "Monthly payroll disbursement for Lagos office — June 2026",
      "status": "completed",
      "risk_tolerance": 0.35,
      "budget_cap": 50000000.00,
      "candidate_count": 142,
      "created_at": "2026-06-01T08:00:00Z",
      "updated_at": "2026-06-01T08:47:23Z"
    }
  ],
  "total": 24,
  "limit": 50,
  "offset": 0,
  "has_more": false
}`;

const RUN_SINGLE_RESPONSE = `{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "objective": "Monthly payroll disbursement for Lagos office — June 2026",
  "status": "completed",
  "risk_tolerance": 0.35,
  "budget_cap": 50000000.00,
  "candidate_count": 142,
  "created_at": "2026-06-01T08:00:00Z",
  "updated_at": "2026-06-01T08:47:23Z"
}`;

const RUN_CREATE_REQUEST = `{
  "objective": "Vendor payment batch — Q2 suppliers",
  "risk_tolerance": 0.30,
  "budget_cap": 10000000.00
}`;

const RUN_CREATE_RESPONSE = `{
  "id": "7b8a9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
  "status": "pending",
  "objective": "Vendor payment batch — Q2 suppliers",
  "created_at": "2026-06-15T10:30:00Z"
}`;

const CANDIDATES_RESPONSE = `{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
      "run_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "beneficiary_name": "Adaeze Okonkwo",
      "account_number": "0123456789",
      "institution_code": "058",
      "amount": 350000.00,
      "currency": "NGN",
      "risk_score": 0.12,
      "risk_decision": "auto_approved",
      "approval_status": "approved",
      "execution_status": "success"
    }
  ],
  "total": 142,
  "limit": 50,
  "offset": 0,
  "has_more": true
}`;

const APPROVE_REQUEST = `{
  "candidate_ids": [
    "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
    "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e"
  ]
}`;

const APPROVE_RESPONSE = `{
  "approved": 2,
  "message": "2 candidates approved successfully."
}`;

const REJECT_REQUEST = `{
  "candidate_ids": ["a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6"],
  "reason": "Duplicate detected"
}`;

const REJECT_RESPONSE = `{
  "rejected": 1,
  "message": "1 candidate rejected."
}`;

const TRANSACTIONS_RESPONSE = `{
  "data": [
    {
      "id": "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
      "run_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "reference": "FP-20260601-00142",
      "amount": 350000.00,
      "currency": "NGN",
      "direction": "debit",
      "status": "SUCCESS",
      "channel": "NIP",
      "created_at": "2026-06-01T08:45:12Z"
    }
  ],
  "total": 142,
  "limit": 50,
  "offset": 0,
  "has_more": true
}`;

const APPROVALS_RESPONSE = `{
  "data": [
    {
      "run_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "objective": "Monthly payroll disbursement for Lagos office — June 2026",
      "status": "awaiting_approval",
      "pending_candidates": 8,
      "total_candidates": 142,
      "created_at": "2026-06-01T08:00:00Z"
    }
  ],
  "total": 3,
  "limit": 50,
  "offset": 0,
  "has_more": false
}`;

const AUDIT_RESPONSE = `{
  "data": [
    {
      "id": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
      "run_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "agent_type": "risk",
      "action": "scored_candidates",
      "detail": {
        "candidates_scored": 142,
        "flagged": 3
      },
      "created_at": "2026-06-01T08:22:41Z"
    }
  ],
  "total": 89,
  "limit": 50,
  "offset": 0,
  "has_more": false
}`;

const PAGINATION_RESPONSE = `{
  "data": [...],
  "total": 247,
  "limit": 50,
  "offset": 0,
  "has_more": true
}`;

const ERROR_RESPONSE = `{
  "detail": "Invalid or expired API key."
}`;

const AUTH_HEADER_EXAMPLE = `# Option 1 — dedicated header
X-API-Key: fp_live_xxxxxxxxxxxxxxxxxxxx

# Option 2 — Bearer token
Authorization: Bearer fp_live_xxxxxxxxxxxxxxxxxxxx`;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sectionIds = ALL_SECTIONS.map((s) => s.id);
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
      setMobileNavOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-[#e2e8f0]" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Desktop sidebar ── */}
      <aside className="w-60 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-white/[0.07] flex-col hidden lg:flex bg-[#0c0e17]">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2 justify-between">
            <Logo variant="full" size="sm" color="default" />
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-[#94a3b8] bg-white/3 shrink-0">
              v1
            </span>
          </div>
          <p className="text-[10px] text-[#64748b] font-mono mt-2">API Reference</p>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-[0.12em] px-2 mb-1.5">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollTo(item.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${
                          isActive
                            ? "text-[#f1f5f9] bg-white/[0.06] font-medium"
                            : "text-[#94a3b8] hover:text-[#b8c6d3] hover:bg-white/3"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#e86727" }} />
                          )}
                          {!isActive && <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-transparent" />}
                          {item.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="px-5 py-4 border-t border-white/[0.07]">
          <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-[0.12em] mb-2">Base URL</p>
          <code className="block text-[10px] font-mono text-[#64748b] break-all leading-relaxed">
            https://api.flowpilot.club<br />/api/v1
          </code>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0c0e17]/95 backdrop-blur-md border-b border-white/[0.07]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Logo variant="icon" size="sm" color="default" />
            <span className="font-semibold text-sm text-[#f1f5f9]">API Reference</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-[#64748b] bg-white/3">v1</span>
          </div>
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.07] transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="border-t border-white/[0.07] px-4 py-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="text-[9px] font-bold text-[#64748b] uppercase tracking-[0.12em] mb-1.5">{group.label}</p>
                <div className="grid grid-cols-2 gap-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === item.id
                          ? "text-[#f1f5f9] bg-white/[0.08] font-medium"
                          : "text-[#94a3b8] hover:text-[#b8c6d3]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 max-w-3xl mx-auto px-6 py-12 pt-20 lg:pt-12">

        {/* ── Hero ── */}
        <div className="mb-14 pb-10 border-b border-white/[0.07]">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border border-white/10 text-[#64748b] bg-white/3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              v1.0 · REST API
            </span>
          </div>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="mb-3">
                <Logo variant="full" size="lg" color="default" />
              </div>
              <p className="text-[#b8c6d3] text-sm leading-relaxed max-w-lg">
                Build integrations against the FlowPilot treasury execution platform.
                Manage runs, candidates, approvals, transactions, and audit events programmatically.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-[#64748b] font-mono">Base URL</span>
                <code className="text-xs font-mono text-[#7dd3fc] bg-white/[0.05] px-2.5 py-1 rounded-lg border border-white/[0.07]">
                  https://api.flowpilot.club/api/v1
                </code>
              </div>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#e86727,#c4521b)" }}
            >
              Go to Dashboard
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── Overview ── */}
        <section id="overview">
          <SectionHeading id="overview">Overview</SectionHeading>
          <p className="text-sm text-[#b8c6d3] leading-relaxed mb-6">
            The FlowPilot Public API lets you automate treasury operations — from creating payment
            runs to approving candidates and querying transaction history. All endpoints return JSON
            and follow standard REST conventions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                title: "API Keys",
                desc: "Authenticate with scoped API keys generated in the FlowPilot dashboard.",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M10 2a4 4 0 0 1 0 8 4 4 0 0 1-3.87-3H2.5l-.5.5-.5-.5L.5 7l.5-.5.5.5.5-.5L3.5 7H6.13A4 4 0 0 1 10 2Zm0 1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm0 1a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" fill="currentColor" />
                  </svg>
                ),
              },
              {
                title: "Paginated lists",
                desc: "Every list endpoint returns a unified envelope with total, limit, offset, and has_more.",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="1" y="2" width="14" height="3" rx="1" fill="currentColor" opacity=".4" />
                    <rect x="1" y="7" width="10" height="2" rx="1" fill="currentColor" opacity=".6" />
                    <rect x="1" y="11" width="7" height="2" rx="1" fill="currentColor" opacity=".8" />
                  </svg>
                ),
              },
              {
                title: "Scoped access",
                desc: "Each operation requires a specific scope, ensuring least-privilege access control.",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 1a3 3 0 0 0-3 3v1.5H4a1 1 0 0 0-1 1V13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6.5a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm1.5 4.5h-3V4a1.5 1.5 0 1 1 3 0v1.5ZM8 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" fill="currentColor" />
                  </svg>
                ),
              },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border border-white/[0.07] p-4 bg-white/2">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-[#e86727] mb-3">
                  {card.icon}
                </div>
                <p className="text-sm font-semibold text-[#cbd5e1] mb-1">{card.title}</p>
                <p className="text-xs text-[#94a3b8] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Authentication ── */}
        <section id="authentication">
          <SectionHeading id="authentication">Authentication</SectionHeading>
          <p className="text-sm text-[#b8c6d3] leading-relaxed mb-4">
            All API requests must include a valid API key. Keys are prefixed with{" "}
            <IC>fp_live_</IC> for production and <IC>fp_test_</IC> for test mode.
            Generate keys in the FlowPilot dashboard under{" "}
            <span className="text-[#cbd5e1]">Settings → Developer</span>.
          </p>
          <SubHeading>Passing your key</SubHeading>
          <CodeBlock label="http">{AUTH_HEADER_EXAMPLE}</CodeBlock>

          <SubHeading>Available scopes</SubHeading>
          <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/2">
                  <th className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase tracking-wider text-[10px]">Scope</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase tracking-wider text-[10px]">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[
                  { scope: "runs:read",       desc: "Read runs and their metadata" },
                  { scope: "runs:write",       desc: "Create new payment runs" },
                  { scope: "transactions:read", desc: "Query transaction history" },
                  { scope: "audit:read",       desc: "Access the audit event log" },
                  { scope: "approvals:write",  desc: "Approve or reject candidates within a run" },
                ].map((row) => (
                  <tr key={row.scope} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <code className="text-[11px] font-mono" style={{ color: "#e86727" }}>{row.scope}</code>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#94a3b8]">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Pagination ── */}
        <section id="pagination">
          <SectionHeading id="pagination">Pagination</SectionHeading>
          <p className="text-sm text-[#b8c6d3] leading-relaxed mb-4">
            All list endpoints accept <IC>limit</IC> and <IC>offset</IC> query parameters.
            The maximum value for <IC>limit</IC> is <strong className="text-[#cbd5e1]">200</strong>.
            Defaults to <IC>limit=50&offset=0</IC>.
          </p>
          <CodeBlock>{PAGINATION_RESPONSE}</CodeBlock>
          <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/2 px-4 py-3">
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Use <IC>has_more: true</IC> to determine whether additional pages exist.
              Increment <IC>offset</IC> by <IC>limit</IC> to fetch the next page.
            </p>
          </div>
        </section>

        {/* ── Errors ── */}
        <section id="errors">
          <SectionHeading id="errors">Errors</SectionHeading>
          <p className="text-sm text-[#b8c6d3] leading-relaxed mb-4">
            FlowPilot uses standard HTTP status codes. All error responses return a JSON object with
            a human-readable <IC>detail</IC> field.
          </p>
          <CodeBlock>{ERROR_RESPONSE}</CodeBlock>
          <div className="overflow-x-auto rounded-xl border border-white/[0.07] mt-5">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/2">
                  <th className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase tracking-wider text-[10px]">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[
                  { code: "401", label: "Unauthorized",    desc: "Missing or invalid API key." },
                  { code: "403", label: "Forbidden",       desc: "Valid key but insufficient scope for this operation." },
                  { code: "404", label: "Not Found",       desc: "The requested resource does not exist." },
                  { code: "422", label: "Unprocessable",   desc: "Request body failed validation — check the detail field." },
                  { code: "429", label: "Rate Limited",    desc: "Too many requests. Retry after the Retry-After header value." },
                ].map((row) => (
                  <tr key={row.code} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold ${
                        row.code === "401" || row.code === "403" ? "text-red-400" :
                        row.code === "404" ? "text-amber-400" :
                        row.code === "422" ? "text-orange-400" :
                        "text-red-400"
                      }`}>
                        {row.code}
                        <span className="text-[#64748b] font-normal">{row.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#94a3b8]">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Runs ── */}
        <section id="runs">
          <SectionHeading id="runs">Runs</SectionHeading>
          <p className="text-sm text-[#b8c6d3] leading-relaxed mb-2">
            A <strong className="text-[#cbd5e1]">Run</strong> represents a single payment batch
            processed by FlowPilot&apos;s AI agents — from candidate scoring to disbursement. Runs
            move through a defined lifecycle:{" "}
            <IC>pending → planning → scoring → awaiting_approval → completed | failed</IC>.
          </p>

          <EndpointBlock
            id="get-runs"
            method="GET"
            path="/public/runs"
            description="Return a paginated list of all payment runs for your organisation. Filter by status to narrow results."
            params={[
              { name: "limit",  type: "integer", required: false, description: "Number of records to return (default 50, max 200)" },
              { name: "offset", type: "integer", required: false, description: "Number of records to skip for pagination" },
              { name: "status", type: "string",  required: false, description: "Filter by status: pending | planning | scoring | awaiting_approval | completed | failed" },
            ]}
            responseBody={RUNS_LIST_RESPONSE}
          />

          <EndpointBlock
            id="get-run"
            method="GET"
            path="/public/runs/{run_id}"
            description="Fetch a single run by its UUID. Returns the same shape as the list endpoint item."
            responseBody={RUN_SINGLE_RESPONSE}
          />

          <EndpointBlock
            id="create-run"
            method="POST"
            path="/public/runs"
            description="Create a new payment run. The AI planning and scoring agents are triggered automatically after creation."
            requestBody={RUN_CREATE_REQUEST}
            responseBody={RUN_CREATE_RESPONSE}
            statusCode={201}
            scope="runs:write"
          />
        </section>

        {/* ── Candidates ── */}
        <section id="candidates">
          <SectionHeading id="candidates">Candidates</SectionHeading>
          <p className="text-sm text-[#b8c6d3] leading-relaxed mb-2">
            Candidates are the individual payment records within a run. Each candidate has a
            risk score, risk decision, and approval status. Candidates can be approved or
            rejected via the Approvals endpoints.
          </p>

          <EndpointBlock
            id="get-candidates"
            method="GET"
            path="/public/runs/{run_id}/candidates"
            description="Return a paginated list of candidates belonging to the specified run. Filter by approval status to see only pending, approved, or rejected records."
            params={[
              { name: "limit",           type: "integer", required: false, description: "Number of records to return (default 50, max 200)" },
              { name: "offset",          type: "integer", required: false, description: "Number of records to skip for pagination" },
              { name: "approval_status", type: "string",  required: false, description: "Filter by approval_status: pending | approved | rejected" },
            ]}
            responseBody={CANDIDATES_RESPONSE}
          />
        </section>

        {/* ── Approvals ── */}
        <section id="approvals">
          <SectionHeading id="approvals">Approvals</SectionHeading>
          <p className="text-sm text-[#b8c6d3] leading-relaxed mb-2">
            Approve or reject individual candidates within a run. Bulk operations are supported —
            pass multiple <IC>candidate_ids</IC> in a single request.
            All approval operations require the <IC>approvals:write</IC> scope.
          </p>

          <EndpointBlock
            id="list-approvals"
            method="GET"
            path="/public/approvals"
            description="Return a paginated list of runs currently in awaiting_approval status, including a summary of pending candidate counts."
            params={[
              { name: "limit",  type: "integer", required: false, description: "Number of records to return (default 50, max 200)" },
              { name: "offset", type: "integer", required: false, description: "Number of records to skip for pagination" },
            ]}
            responseBody={APPROVALS_RESPONSE}
          />

          <EndpointBlock
            id="approve-candidates"
            method="POST"
            path="/public/runs/{run_id}/approve"
            description="Approve one or more candidates within a run. Approved candidates are queued for disbursement."
            requestBody={APPROVE_REQUEST}
            responseBody={APPROVE_RESPONSE}
            scope="approvals:write"
          />

          <EndpointBlock
            id="reject-candidates"
            method="POST"
            path="/public/runs/{run_id}/reject"
            description="Reject one or more candidates. A rejection reason is optional but recommended for audit trail purposes."
            requestBody={REJECT_REQUEST}
            responseBody={REJECT_RESPONSE}
            scope="approvals:write"
          />
        </section>

        {/* ── Transactions ── */}
        <section id="transactions">
          <SectionHeading id="transactions">Transactions</SectionHeading>
          <p className="text-sm text-[#b8c6d3] leading-relaxed mb-2">
            Transactions represent the actual fund movements generated by approved candidates.
            Each transaction has a unique reference, amount, direction, and settlement status.
            Requires the <IC>transactions:read</IC> scope.
          </p>

          <EndpointBlock
            id="get-transactions"
            method="GET"
            path="/public/transactions"
            description="Return a paginated list of all transactions. Filter by run_id to retrieve transactions for a specific payment batch, or by status to view only successful, pending, or failed transfers."
            params={[
              { name: "limit",  type: "integer",     required: false, description: "Number of records to return (default 50, max 200)" },
              { name: "offset", type: "integer",     required: false, description: "Number of records to skip for pagination" },
              { name: "run_id", type: "string (UUID)", required: false, description: "Filter transactions to a specific run" },
              { name: "status", type: "string",     required: false, description: "Filter by status: SUCCESS | PENDING | FAILED" },
            ]}
            responseBody={TRANSACTIONS_RESPONSE}
          />
        </section>

        {/* ── Audit Log ── */}
        <section id="audit-log">
          <SectionHeading id="audit-log">Audit Log</SectionHeading>
          <p className="text-sm text-[#b8c6d3] leading-relaxed mb-2">
            The audit log records every action taken by FlowPilot&apos;s AI agents and human
            operators throughout a run&apos;s lifecycle. Useful for compliance reporting and
            debugging. Requires the <IC>audit:read</IC> scope.
          </p>

          <EndpointBlock
            id="get-audit"
            method="GET"
            path="/public/audit"
            description="Return a paginated list of audit events. Filter by run_id to retrieve the full event history for a specific run, or by action to query a specific event type."
            params={[
              { name: "limit",  type: "integer",     required: false, description: "Number of records to return (default 50, max 200)" },
              { name: "offset", type: "integer",     required: false, description: "Number of records to skip for pagination" },
              { name: "run_id", type: "string (UUID)", required: false, description: "Scope results to a specific run" },
              { name: "action", type: "string",      required: false, description: "Filter by action name, e.g. scored_candidates, approved_candidate" },
            ]}
            responseBody={AUDIT_RESPONSE}
          />
        </section>

        {/* ── Webhooks ── */}
        <section id="webhooks">
          <SectionHeading id="webhooks">Webhooks</SectionHeading>
          <p className="text-sm text-[#b8c6d3] leading-relaxed mb-6">
            FlowPilot can push real-time event notifications to any HTTPS endpoint you register.
            Configure webhooks from the <strong className="text-[#e2e8f0]">Developer → Webhooks</strong> tab
            in your dashboard. A signing secret (<IC>whsec_…</IC>) is generated on creation and
            shown exactly once — save it immediately.
          </p>

          <SubHeading>Available events</SubHeading>
          <div className="overflow-x-auto rounded-xl border border-white/[0.07] mb-8">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/2">
                  <th className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase tracking-wider text-[10px]">Event</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase tracking-wider text-[10px]">When it fires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[
                  ["run.completed",       "A payout run finished and all approved candidates were processed"],
                  ["run.failed",          "A payout run encountered a fatal error"],
                  ["approval.requested",  "A run moved to awaiting_approval — approvers need to act"],
                  ["approval.completed",  "A run was approved or rejected and execution resumed"],
                  ["payout.succeeded",    "An individual payout candidate was disbursed successfully"],
                  ["payout.failed",       "An individual payout candidate failed to disburse"],
                  ["candidate.flagged",   "A candidate was flagged with a high risk score during scoring"],
                  ["webhook.test",        "Sent once when the webhook is first registered, to verify reachability"],
                ].map(([event, desc]) => (
                  <tr key={event} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <code className="font-mono text-[11px] text-[#7dd3fc]">{event}</code>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#94a3b8]">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubHeading>Payload structure</SubHeading>
          <p className="text-sm text-[#b8c6d3] leading-relaxed mb-3">
            Every delivery is a JSON POST with the following envelope.
            The <IC>data</IC> field varies by event type.
          </p>
          <CodeBlock>{`{
  "event": "run.completed",
  "timestamp": "2026-04-14T18:30:00.000Z",
  "delivery_id": "d3f4a5b6-...",
  "data": {
    "run_id": "a1b2c3d4-...",
    "objective": "Pay 50 field agents for April",
    "status": "completed",
    "approved_count": 48
  }
}`}</CodeBlock>

          <SubHeading>Request headers</SubHeading>
          <div className="overflow-x-auto rounded-xl border border-white/[0.07] mb-8">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/2">
                  <th className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase tracking-wider text-[10px]">Header</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase tracking-wider text-[10px]">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {[
                  ["X-FlowPilot-Event",     "The event name, e.g. run.completed"],
                  ["X-FlowPilot-Signature", "HMAC-SHA256 signature of the raw request body: sha256=<hex>"],
                  ["X-FlowPilot-Delivery",  "Unique UUID for this delivery attempt"],
                  ["Content-Type",          "application/json"],
                  ["User-Agent",            "FlowPilot-Webhooks/1.0"],
                ].map(([header, desc]) => (
                  <tr key={header} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <code className="font-mono text-[11px] text-[#7dd3fc]">{header}</code>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#94a3b8]">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubHeading>Verifying signatures</SubHeading>
          <p className="text-sm text-[#b8c6d3] leading-relaxed mb-4">
            FlowPilot signs every payload with <strong className="text-[#e2e8f0]">HMAC-SHA256</strong> using the
            webhook&apos;s signing secret. Always verify the signature before processing a delivery.
          </p>
          <CodeBlock label="node.js">{`const crypto = require("crypto");

function verifyWebhook(rawBody, signatureHeader, secret) {
  const expected = "sha256=" +
    crypto.createHmac("sha256", secret)
          .update(rawBody)   // rawBody must be the raw Buffer, not parsed JSON
          .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Express example
app.post("/webhooks/flowpilot", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["x-flowpilot-signature"];
  if (!verifyWebhook(req.body, sig, process.env.FLOWPILOT_WEBHOOK_SECRET)) {
    return res.status(401).send("Invalid signature");
  }
  const event = JSON.parse(req.body);
  console.log("Received:", event.event, event.data);
  res.sendStatus(200);
});`}</CodeBlock>

          <div className="mt-2">
            <CodeBlock label="python">{`import hashlib, hmac

def verify_webhook(raw_body: bytes, signature_header: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)

# FastAPI example
@app.post("/webhooks/flowpilot")
async def handle_webhook(request: Request):
    raw_body = await request.body()
    sig = request.headers.get("x-flowpilot-signature", "")
    if not verify_webhook(raw_body, sig, FLOWPILOT_WEBHOOK_SECRET):
        raise HTTPException(status_code=401, detail="Invalid signature")
    event = await request.json()
    return {"ok": True}`}</CodeBlock>
          </div>

          <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-5 py-4">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2">Important</p>
            <ul className="space-y-1.5 text-xs text-[#b8c6d3]">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-500/60 shrink-0" />
                Always read the <strong className="text-[#e2e8f0]">raw request body bytes</strong> for signature verification — do not parse JSON first.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-500/60 shrink-0" />
                Your endpoint must return a <strong className="text-[#e2e8f0]">2xx status</strong> within 10 seconds or the delivery is counted as a failure.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-500/60 shrink-0" />
                After <strong className="text-[#e2e8f0]">5 consecutive failures</strong> FlowPilot will auto-disable the webhook. Re-enable it from the dashboard once your endpoint is healthy.
              </li>
            </ul>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="mt-20 pt-8 border-t border-white/[0.07] pb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#64748b] font-mono">
                FlowPilot API v1.0 — Last updated April 2026
              </p>
              <p className="text-xs text-[#4a5568] mt-1">
                Questions? Email{" "}
                <a
                  href="mailto:dev@flowpilot.club"
                  className="text-[#64748b] hover:text-[#e86727] transition-colors"
                >
                  dev@flowpilot.club
                </a>
              </p>
            </div>
            <div className="flex items-center gap-4">
              {[
                { href: "/privacy", label: "Privacy" },
                { href: "/terms",   label: "Terms"   },
                { href: "/",        label: "Home"    },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-xs text-[#64748b] hover:text-[#94a3b8] transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
