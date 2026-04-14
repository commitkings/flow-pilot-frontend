"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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

// ─── Nav sections ─────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "pagination", label: "Pagination" },
  { id: "errors", label: "Errors" },
  { id: "runs", label: "Runs" },
  { id: "candidates", label: "Candidates" },
  { id: "approvals", label: "Approvals" },
  { id: "transactions", label: "Transactions" },
  { id: "audit-log", label: "Audit Log" },
  { id: "webhooks", label: "Webhooks" },
];

// ─── Utility components ───────────────────────────────────────────────────────

function MethodBadge({ method }: { method: HttpMethod }) {
  const styles: Record<HttpMethod, string> = {
    GET: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    POST: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    PATCH: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    DELETE: "bg-red-500/20 text-red-400 border border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold font-mono tracking-wide ${styles[method]}`}
    >
      {method}
    </span>
  );
}

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e86727]/10 border border-[#e86727]/20 text-[#e86727] text-xs font-mono">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="M5 1a2 2 0 0 0-2 2v1H2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7V3a2 2 0 0 0-2-2Zm1 3H4V3a1 1 0 1 1 2 0v1Z" fill="currentColor" />
      </svg>
      Required scope: {scope}
    </span>
  );
}

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group">
      <pre className="bg-[#1a1d27] rounded-xl border border-white/10 p-4 text-xs text-[#a8b4c8] overflow-x-auto font-mono leading-relaxed">
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 text-[#a8b4c8] border border-white/10"
        aria-label="Copy to clipboard"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

function ParamsTable({ params }: { params: ParamRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 mt-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            {["Param", "Type", "Required", "Description"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr
              key={p.name}
              className={`border-b border-white/5 ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}`}
            >
              <td className="px-4 py-3">
                <code className="text-xs bg-white/10 text-[#93c5fd] px-1.5 py-0.5 rounded font-mono">
                  {p.name}
                </code>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-mono text-[#7c8ea6]">{p.type}</span>
              </td>
              <td className="px-4 py-3">
                {p.required ? (
                  <span className="text-xs text-emerald-400 font-medium">Yes</span>
                ) : (
                  <span className="text-xs text-[#4a5568]">No</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-[#94a3b8]">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-xl font-semibold text-[#e2e8f0] mt-14 mb-6 pb-3 border-b border-white/10 scroll-mt-8"
    >
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-[#cbd5e1] mt-10 mb-3">{children}</h3>
  );
}

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
  return (
    <div id={id} className="mt-8 scroll-mt-8">
      <div className="flex items-center gap-3 mb-3">
        <MethodBadge method={method} />
        <code className="text-sm font-mono text-[#e2e8f0] bg-white/5 px-3 py-1 rounded-lg border border-white/10">
          {path}
        </code>
        {statusCode !== 200 && (
          <span className="text-xs font-mono text-[#7c8ea6] bg-white/5 px-2 py-0.5 rounded border border-white/10">
            {statusCode}
          </span>
        )}
      </div>
      <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">{description}</p>

      {scope && (
        <div className="mb-4">
          <ScopeBadge scope={scope} />
        </div>
      )}

      {params && params.length > 0 && (
        <>
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mt-5 mb-2">
            Query Parameters
          </p>
          <ParamsTable params={params} />
        </>
      )}

      {requestBody && (
        <>
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mt-5 mb-2">
            Request Body
          </p>
          <CodeBlock>{requestBody}</CodeBlock>
        </>
      )}

      <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mt-5 mb-2">
        Response
      </p>
      <CodeBlock>{responseBody}</CodeBlock>
    </div>
  );
}

// ─── Sample JSON payloads ──────────────────────────────────────────────────────

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

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sectionIds = NAV_SECTIONS.map((s) => s.id);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
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
      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-white/10 px-4 py-8 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "#e86727" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1L12.196 4V10L7 13L1.804 10V4L7 1Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-[#e2e8f0]">FlowPilot</span>
            <span className="text-xs font-mono text-[#4a5568] bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
              v1.0
            </span>
          </div>
          <p className="text-xs text-[#4a5568] font-mono mt-1">API Reference</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1">
          <p className="text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest px-2 mb-3">
            Documentation
          </p>
          <ul className="space-y-0.5">
            {NAV_SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => scrollTo(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                      isActive
                        ? "text-[#e86727] bg-[#e86727]/10 font-medium"
                        : "text-[#64748b] hover:text-[#cbd5e1] hover:bg-white/5"
                    }`}
                  >
                    {isActive && (
                      <span
                        className="inline-block w-1 h-1 rounded-full mr-2 mb-0.5 align-middle"
                        style={{ background: "#e86727" }}
                      />
                    )}
                    {section.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="mt-8 pt-6 border-t border-white/10 px-2">
          <p className="text-[10px] text-[#4a5568] font-mono leading-relaxed">
            Base URL
          </p>
          <p className="text-[10px] font-mono text-[#64748b] break-all mt-1">
            https://api.flowpilot.ng
            <br />
            /api/v1
          </p>
        </div>
      </aside>

      {/* ── Mobile top nav ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f1117]/95 backdrop-blur border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#e86727" }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1L12.196 4V10L7 13L1.804 10V4L7 1Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="font-semibold text-sm">FlowPilot API</span>
          </div>
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/10 transition-colors"
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
          <div className="border-t border-white/10 px-4 py-3 grid grid-cols-2 gap-1">
            {NAV_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === section.id
                    ? "text-[#e86727] bg-[#e86727]/10 font-medium"
                    : "text-[#64748b] hover:text-[#cbd5e1]"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 lg:py-12 pt-20 lg:pt-12 min-w-0">

        {/* ── Page header ── */}
        <div className="mb-14 pb-10 border-b border-white/10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #e86727, #c4521b)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M7 1L12.196 4V10L7 13L1.804 10V4L7 1Z" fill="white" fillOpacity="0.95" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#f1f5f9] tracking-tight">
                    FlowPilot API
                  </h1>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ background: "#e86727" + "22", color: "#e86727", border: "1px solid " + "#e86727" + "33" }}
                  >
                    v1.0
                  </span>
                </div>
              </div>
              <p className="text-[#64748b] text-sm leading-relaxed max-w-xl">
                Public API Reference — Build integrations against the FlowPilot treasury
                execution platform. Manage runs, candidates, approvals, transactions, and
                audit events programmatically.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-[#4a5568] font-mono">Base URL:</span>
                <code className="text-xs font-mono text-[#93c5fd] bg-white/5 px-2 py-1 rounded border border-white/10">
                  https://api.flowpilot.ng/api/v1
                </code>
              </div>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-white shrink-0"
              style={{ background: "#e86727" }}
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
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">
            The FlowPilot Public API lets you automate treasury operations — from creating payment
            runs to approving candidates and querying transaction history. All endpoints return JSON
            and follow standard REST conventions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[
              {
                icon: "🔑",
                title: "API Keys",
                desc: "Authenticate with scoped API keys generated in the FlowPilot dashboard.",
              },
              {
                icon: "📄",
                title: "Paginated lists",
                desc: "Every list endpoint returns a unified envelope with total, limit, offset, and has_more.",
              },
              {
                icon: "🔒",
                title: "Scoped access",
                desc: "Each operation requires a specific scope, ensuring least-privilege access control.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white/[0.03] border border-white/10 rounded-xl p-4"
              >
                <div className="text-xl mb-2">{card.icon}</div>
                <p className="text-sm font-semibold text-[#cbd5e1] mb-1">{card.title}</p>
                <p className="text-xs text-[#64748b] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Authentication ── */}
        <section id="authentication">
          <SectionHeading id="authentication">Authentication</SectionHeading>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">
            All API requests must include a valid API key. Keys are prefixed with{" "}
            <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs">fp_live_</code>{" "}
            for production and{" "}
            <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs">fp_test_</code>{" "}
            for test mode. Generate keys in the FlowPilot dashboard under{" "}
            <span className="text-[#cbd5e1]">Settings → Developer</span>.
          </p>
          <SubHeading>Passing your key</SubHeading>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-3">
            You can pass your API key in either of two ways:
          </p>
          <CodeBlock>{AUTH_HEADER_EXAMPLE}</CodeBlock>

          <SubHeading>Available scopes</SubHeading>
          <div className="overflow-x-auto rounded-xl border border-white/10 mt-2">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Scope</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { scope: "runs:read", desc: "Read runs and their metadata" },
                  { scope: "runs:write", desc: "Create new payment runs" },
                  { scope: "transactions:read", desc: "Query transaction history" },
                  { scope: "audit:read", desc: "Access the audit event log" },
                  { scope: "approvals:write", desc: "Approve or reject candidates within a run" },
                ].map((row, i) => (
                  <tr key={row.scope} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono" style={{ color: "#e86727" }}>{row.scope}</code>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#94a3b8]">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Pagination ── */}
        <section id="pagination">
          <SectionHeading id="pagination">Pagination</SectionHeading>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">
            All list endpoints accept{" "}
            <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs">limit</code> and{" "}
            <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs">offset</code> query
            parameters. The maximum value for <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs">limit</code> is{" "}
            <strong className="text-[#cbd5e1]">200</strong>. Defaults to{" "}
            <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs">limit=50&offset=0</code>.
          </p>
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">
            Response envelope
          </p>
          <CodeBlock>{PAGINATION_RESPONSE}</CodeBlock>
          <div className="mt-4 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
            <p className="text-xs text-[#64748b] leading-relaxed">
              Use <code className="text-[#93c5fd] bg-white/10 px-1 rounded font-mono">has_more: true</code> to determine
              whether additional pages exist. Increment <code className="text-[#93c5fd] bg-white/10 px-1 rounded font-mono">offset</code> by{" "}
              <code className="text-[#93c5fd] bg-white/10 px-1 rounded font-mono">limit</code> to fetch the next page.
            </p>
          </div>
        </section>

        {/* ── Errors ── */}
        <section id="errors">
          <SectionHeading id="errors">Errors</SectionHeading>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">
            FlowPilot uses standard HTTP status codes. All error responses return a JSON object with
            a human-readable <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs">detail</code> field.
          </p>
          <CodeBlock>{ERROR_RESPONSE}</CodeBlock>
          <div className="overflow-x-auto rounded-xl border border-white/10 mt-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: "401", label: "Unauthorized", desc: "Missing or invalid API key." },
                  { code: "403", label: "Forbidden", desc: "Valid key but insufficient scope for this operation." },
                  { code: "404", label: "Not Found", desc: "The requested resource does not exist." },
                  { code: "422", label: "Validation Error", desc: "Request body failed validation — check the detail field." },
                  { code: "429", label: "Rate Limited", desc: "Too many requests. Back off and retry after the Retry-After header value." },
                ].map((row, i) => (
                  <tr key={row.code} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                    <td className="px-4 py-3">
                      <code className={`text-xs font-mono font-bold ${
                        row.code.startsWith("4")
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}>
                        {row.code} {row.label}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#94a3b8]">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Runs ── */}
        <section id="runs">
          <SectionHeading id="runs">Runs</SectionHeading>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-2">
            A <strong className="text-[#cbd5e1]">Run</strong> represents a single payment batch
            processed by FlowPilot&apos;s AI agents — from candidate scoring to disbursement. Runs
            move through a defined lifecycle:{" "}
            <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs">
              pending → planning → scoring → awaiting_approval → completed | failed
            </code>.
          </p>

          <EndpointBlock
            id="get-runs"
            method="GET"
            path="/public/runs"
            description="Return a paginated list of all payment runs for your organisation. Filter by status to narrow results."
            params={[
              { name: "limit", type: "integer", required: false, description: "Number of records to return (default 50, max 200)" },
              { name: "offset", type: "integer", required: false, description: "Number of records to skip for pagination" },
              { name: "status", type: "string", required: false, description: "Filter by status: pending | planning | scoring | awaiting_approval | completed | failed" },
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
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-2">
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
              { name: "limit", type: "integer", required: false, description: "Number of records to return (default 50, max 200)" },
              { name: "offset", type: "integer", required: false, description: "Number of records to skip for pagination" },
              { name: "approval_status", type: "string", required: false, description: "Filter by approval_status: pending | approved | rejected" },
            ]}
            responseBody={CANDIDATES_RESPONSE}
          />
        </section>

        {/* ── Approvals ── */}
        <section id="approvals">
          <SectionHeading id="approvals">Approvals</SectionHeading>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-2">
            Approve or reject individual candidates within a run. Bulk operations are supported —
            pass multiple <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs">candidate_ids</code> in
            a single request. All approval operations require the{" "}
            <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs" style={{ color: "#e86727" }}>approvals:write</code> scope.
          </p>

          <EndpointBlock
            id="list-approvals"
            method="GET"
            path="/public/approvals"
            description="Return a paginated list of runs currently in awaiting_approval status, including a summary of pending candidate counts."
            params={[
              { name: "limit", type: "integer", required: false, description: "Number of records to return (default 50, max 200)" },
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
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-2">
            Transactions represent the actual fund movements generated by approved candidates.
            Each transaction has a unique reference, amount, direction, and settlement status.
            Requires the <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs" style={{ color: "#e86727" }}>transactions:read</code> scope.
          </p>

          <EndpointBlock
            id="get-transactions"
            method="GET"
            path="/public/transactions"
            description="Return a paginated list of all transactions. Filter by run_id to retrieve transactions for a specific payment batch, or by status to view only successful, pending, or failed transfers."
            params={[
              { name: "limit", type: "integer", required: false, description: "Number of records to return (default 50, max 200)" },
              { name: "offset", type: "integer", required: false, description: "Number of records to skip for pagination" },
              { name: "run_id", type: "string (UUID)", required: false, description: "Filter transactions to a specific run" },
              { name: "status", type: "string", required: false, description: "Filter by status: SUCCESS | PENDING | FAILED" },
            ]}
            responseBody={TRANSACTIONS_RESPONSE}
          />
        </section>

        {/* ── Audit Log ── */}
        <section id="audit-log">
          <SectionHeading id="audit-log">Audit Log</SectionHeading>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-2">
            The audit log records every action taken by FlowPilot&apos;s AI agents and human
            operators throughout a run&apos;s lifecycle. Useful for compliance reporting and
            debugging. Requires the{" "}
            <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs" style={{ color: "#e86727" }}>audit:read</code> scope.
          </p>

          <EndpointBlock
            id="get-audit"
            method="GET"
            path="/public/audit"
            description="Return a paginated list of audit events. Filter by run_id to retrieve the full event history for a specific run, or by action to query a specific event type."
            params={[
              { name: "limit", type: "integer", required: false, description: "Number of records to return (default 50, max 200)" },
              { name: "offset", type: "integer", required: false, description: "Number of records to skip for pagination" },
              { name: "run_id", type: "string (UUID)", required: false, description: "Scope results to a specific run" },
              { name: "action", type: "string", required: false, description: "Filter by action name, e.g. scored_candidates, approved_candidate" },
            ]}
            responseBody={AUDIT_RESPONSE}
          />
        </section>

        {/* ── Webhooks ── */}
        <section id="webhooks">
          <SectionHeading id="webhooks">Webhooks</SectionHeading>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-6">
            FlowPilot can push real-time event notifications to any HTTPS endpoint you register.
            Configure webhooks from the <strong className="text-[#e2e8f0]">Developer → Webhooks</strong> tab
            in your dashboard. A signing secret (<code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs">whsec_…</code>) is
            generated on creation and shown exactly once — save it immediately.
          </p>

          <SubHeading>Available events</SubHeading>
          <div className="overflow-x-auto rounded-xl border border-white/10 mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Event</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#64748b]">When it fires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ["run.completed", "A payout run finished and all approved candidates were processed"],
                  ["run.failed", "A payout run encountered a fatal error"],
                  ["approval.requested", "A run moved to awaiting_approval — approvers need to act"],
                  ["approval.completed", "A run was approved or rejected and execution resumed"],
                  ["payout.succeeded", "An individual payout candidate was disbursed successfully"],
                  ["payout.failed", "An individual payout candidate failed to disburse"],
                  ["candidate.flagged", "A candidate was flagged with a high risk score during scoring"],
                  ["webhook.test", "Sent once when the webhook is first registered, to verify reachability"],
                ].map(([event, desc]) => (
                  <tr key={event} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <code className="font-mono text-xs text-[#93c5fd]">{event}</code>
                    </td>
                    <td className="px-4 py-3 text-[#94a3b8] text-xs">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubHeading>Payload structure</SubHeading>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-3">
            Every delivery is a JSON POST with the following envelope. The <code className="text-[#93c5fd] bg-white/10 px-1 py-0.5 rounded font-mono text-xs">data</code> field
            varies by event type.
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
          <div className="overflow-x-auto rounded-xl border border-white/10 mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Header</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {[
                  ["X-FlowPilot-Event", "The event name, e.g. run.completed"],
                  ["X-FlowPilot-Signature", "HMAC-SHA256 signature of the raw request body: sha256=<hex>"],
                  ["X-FlowPilot-Delivery", "Unique UUID for this delivery attempt"],
                  ["Content-Type", "application/json"],
                  ["User-Agent", "FlowPilot-Webhooks/1.0"],
                ].map(([header, desc]) => (
                  <tr key={header} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3"><code className="font-mono text-[#93c5fd]">{header}</code></td>
                    <td className="px-4 py-3 text-[#94a3b8]">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SubHeading>Verifying signatures</SubHeading>
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-4">
            FlowPilot signs every payload with <strong className="text-[#e2e8f0]">HMAC-SHA256</strong> using the webhook&apos;s signing secret.
            Always verify the signature before processing a delivery — this proves the request
            genuinely came from FlowPilot and was not tampered with in transit.
          </p>
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Node.js</p>
          <CodeBlock>{`const crypto = require("crypto");

function verifyWebhook(rawBody, signatureHeader, secret) {
  const expected = "sha256=" +
    crypto.createHmac("sha256", secret)
          .update(rawBody)   // rawBody must be the raw Buffer, not parsed JSON
          .digest("hex");

  // Use timingSafeEqual to prevent timing attacks
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

          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mt-6 mb-2">Python</p>
          <CodeBlock>{`import hashlib, hmac

def verify_webhook(raw_body: bytes, signature_header: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)

# FastAPI example
from fastapi import FastAPI, Request, HTTPException
app = FastAPI()

@app.post("/webhooks/flowpilot")
async def handle_webhook(request: Request):
    raw_body = await request.body()
    sig = request.headers.get("x-flowpilot-signature", "")
    if not verify_webhook(raw_body, sig, FLOWPILOT_WEBHOOK_SECRET):
        raise HTTPException(status_code=401, detail="Invalid signature")
    event = await request.json()
    print("Received:", event["event"], event["data"])
    return {"ok": True}`}</CodeBlock>

          <div className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm text-[#94a3b8]">
            <p className="font-semibold text-amber-400 mb-1">Important</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Always read the <strong className="text-[#e2e8f0]">raw request body bytes</strong> for signature verification — do not parse JSON first.</li>
              <li>Your endpoint must return a <strong className="text-[#e2e8f0]">2xx status</strong> within 10 seconds or the delivery is counted as a failure.</li>
              <li>After <strong className="text-[#e2e8f0]">5 consecutive failures</strong> FlowPilot will auto-disable the webhook to protect your infrastructure.</li>
              <li>Re-enable it from the dashboard once your endpoint is healthy again.</li>
            </ul>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="mt-20 pt-8 border-t border-white/10 pb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#4a5568] font-mono">
                FlowPilot API v1.0 — Last updated April 2026
              </p>
              <p className="text-xs text-[#4a5568] mt-1">
                Questions? Email{" "}
                <a
                  href="mailto:dev@flowpilot.ng"
                  className="text-[#64748b] hover:text-[#e86727] transition-colors"
                >
                  dev@flowpilot.ng
                </a>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="text-xs text-[#4a5568] hover:text-[#94a3b8] transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-[#4a5568] hover:text-[#94a3b8] transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/"
                className="text-xs text-[#4a5568] hover:text-[#94a3b8] transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
