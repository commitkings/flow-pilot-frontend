"use client";

import { useState } from "react";
import { AlertCircle, Lock, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type HttpMethod = "GET" | "POST";

interface ParamDef {
  name: string;
  description: string;
  required?: boolean;
  placeholder?: string;
}

interface EndpointDef {
  id: string;
  method: HttpMethod;
  path: string;
  description: string;
  scope: string;
  pathParams: string[];
  queryParams: ParamDef[];
  bodyParams: ParamDef[];
}

const ENDPOINTS: EndpointDef[] = [
  {
    id: "list_runs",
    method: "GET",
    path: "/runs",
    description: "List payout runs for your organisation, newest first.",
    scope: "runs:read",
    pathParams: [],
    queryParams: [
      { name: "status", description: "Filter by status", placeholder: "e.g. completed" },
      { name: "limit", description: "Max records (1–200)", placeholder: "50" },
      { name: "offset", description: "Skip first N records", placeholder: "0" },
    ],
    bodyParams: [],
  },
  {
    id: "get_run",
    method: "GET",
    path: "/runs/{run_id}",
    description: "Fetch a single run by its UUID.",
    scope: "runs:read",
    pathParams: ["run_id"],
    queryParams: [],
    bodyParams: [],
  },
  {
    id: "list_candidates",
    method: "GET",
    path: "/runs/{run_id}/candidates",
    description: "List payout candidates for a specific run.",
    scope: "runs:read",
    pathParams: ["run_id"],
    queryParams: [
      { name: "approval_status", description: "Filter by approval status", placeholder: "e.g. approved" },
      { name: "execution_status", description: "Filter by execution status", placeholder: "e.g. executed" },
      { name: "limit", description: "Max records (1–200)", placeholder: "50" },
      { name: "offset", description: "Skip first N records", placeholder: "0" },
    ],
    bodyParams: [],
  },
  {
    id: "approve_run",
    method: "POST",
    path: "/runs/{run_id}/approve",
    description: "Approve a run that is awaiting approval.",
    scope: "approvals:write",
    pathParams: ["run_id"],
    queryParams: [],
    bodyParams: [
      { name: "notes", description: "Optional approval notes", placeholder: "Looks good" },
    ],
  },
  {
    id: "reject_run",
    method: "POST",
    path: "/runs/{run_id}/reject",
    description: "Reject a run that is awaiting approval.",
    scope: "approvals:write",
    pathParams: ["run_id"],
    queryParams: [],
    bodyParams: [
      { name: "notes", description: "Optional rejection reason", placeholder: "Amount exceeds policy limit" },
    ],
  },
  {
    id: "list_transactions",
    method: "GET",
    path: "/transactions",
    description: "List reconciled transactions for your organisation.",
    scope: "transactions:read",
    pathParams: [],
    queryParams: [
      { name: "run_id", description: "Filter by run UUID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { name: "limit", description: "Max records (1–200)", placeholder: "50" },
      { name: "offset", description: "Skip first N records", placeholder: "0" },
    ],
    bodyParams: [],
  },
  {
    id: "list_audit",
    method: "GET",
    path: "/audit",
    description: "List audit log entries for your organisation's runs.",
    scope: "audit:read",
    pathParams: [],
    queryParams: [
      { name: "run_id", description: "Filter by run UUID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { name: "agent_type", description: "Filter by agent type", placeholder: "e.g. risk_agent" },
      { name: "limit", description: "Max records (1–200)", placeholder: "50" },
      { name: "offset", description: "Skip first N records", placeholder: "0" },
    ],
    bodyParams: [],
  },
];

const METHOD_BADGE: Record<HttpMethod, string> = {
  GET: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-300",
  POST: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
};

export function ApiPlaygroundSection() {
  const [apiKey, setApiKey] = useState("");
  const [selectedId, setSelectedId] = useState<string>(ENDPOINTS[0].id);
  const [pathValues, setPathValues] = useState<Record<string, string>>({});
  const [queryValues, setQueryValues] = useState<Record<string, string>>({});
  const [bodyValues, setBodyValues] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<{ status: number; body: unknown } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = ENDPOINTS.find((e) => e.id === selectedId)!;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setPathValues({});
    setQueryValues({});
    setBodyValues({});
    setResponse(null);
    setError(null);
  };

  const buildUrl = () => {
    let path = endpoint.path;
    for (const [k, v] of Object.entries(pathValues)) {
      path = path.replace(`{${k}}`, encodeURIComponent(v.trim()));
    }
    const qs = Object.entries(queryValues)
      .filter(([, v]) => v.trim() !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v.trim())}`)
      .join("&");
    return `/api/proxy/public/v1${path}${qs ? `?${qs}` : ""}`;
  };

  const handleSend = async () => {
    if (!apiKey.trim()) {
      setError("Paste your API key above before sending a request.");
      return;
    }
    const missingPath = endpoint.pathParams.filter((p) => !pathValues[p]?.trim());
    if (missingPath.length > 0) {
      setError(`Fill in required path parameter(s): ${missingPath.join(", ")}`);
      return;
    }

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const url = buildUrl();
      const isPost = endpoint.method === "POST";
      const bodyObj = Object.fromEntries(
        Object.entries(bodyValues).filter(([, v]) => v.trim() !== "")
      );

      const res = await fetch(url, {
        method: endpoint.method,
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          ...(isPost ? { "Content-Type": "application/json" } : {}),
        },
        body: isPost ? JSON.stringify(bodyObj) : undefined,
      });

      const data = await res.json().catch(() => null);
      setResponse({ status: res.status, body: data });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed — check your network.");
    } finally {
      setLoading(false);
    }
  };

  const statusOk = response && response.status >= 200 && response.status < 300;

  return (
    <div className="space-y-5">
      {/* ── API key bar ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          API Key — used only for this request, never stored
        </label>
        <Input
          type="password"
          placeholder="fp_…"
          className="h-10 rounded-xl font-mono text-sm"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
        {/* ── Endpoint list ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden self-start">
          <div className="border-b border-border/60 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Endpoints
          </div>
          <div className="divide-y divide-border/40">
            {ENDPOINTS.map((ep) => (
              <button
                key={ep.id}
                type="button"
                onClick={() => handleSelect(ep.id)}
                className={cn(
                  "w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
                  ep.id === selectedId &&
                    "border-l-2 border-brand bg-brand/5"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded border px-1.5 py-[1px] font-mono text-[9px] font-bold leading-tight",
                    METHOD_BADGE[ep.method]
                  )}
                >
                  {ep.method}
                </span>
                <span className="break-all font-mono text-[11px] leading-snug text-foreground">
                  /v1{ep.path}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Endpoint header */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded border px-2 py-0.5 font-mono text-xs font-bold",
                  METHOD_BADGE[endpoint.method]
                )}
              >
                {endpoint.method}
              </span>
              <code className="font-mono text-sm font-semibold text-foreground">
                /public/v1{endpoint.path}
              </code>
            </div>
            <p className="text-sm text-muted-foreground">{endpoint.description}</p>
            <p className="text-xs text-muted-foreground">
              Required scope:{" "}
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 font-mono text-xs text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
                {endpoint.scope}
              </span>
            </p>
          </div>

          {/* Path params */}
          {endpoint.pathParams.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Path Parameters
              </h4>
              {endpoint.pathParams.map((p) => (
                <div key={p} className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-medium text-foreground">
                    <code className="font-mono">{p}</code>
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder={`Enter ${p}…`}
                    className="h-9 rounded-xl font-mono text-sm"
                    value={pathValues[p] ?? ""}
                    onChange={(e) =>
                      setPathValues((prev) => ({ ...prev, [p]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Query params */}
          {endpoint.queryParams.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Query Parameters
              </h4>
              {endpoint.queryParams.map((p) => (
                <div key={p.name} className="grid grid-cols-[150px_1fr] items-center gap-3">
                  <div>
                    <p className="font-mono text-xs font-medium text-foreground">{p.name}</p>
                    <p className="text-[11px] leading-snug text-muted-foreground">{p.description}</p>
                  </div>
                  <Input
                    placeholder={p.placeholder ?? `Enter ${p.name}…`}
                    className="h-9 rounded-xl font-mono text-sm"
                    value={queryValues[p.name] ?? ""}
                    onChange={(e) =>
                      setQueryValues((prev) => ({ ...prev, [p.name]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Body params */}
          {endpoint.bodyParams.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Request Body
              </h4>
              {endpoint.bodyParams.map((p) => (
                <div key={p.name} className="grid grid-cols-[150px_1fr] items-center gap-3">
                  <div>
                    <p className="font-mono text-xs font-medium text-foreground">{p.name}</p>
                    <p className="text-[11px] leading-snug text-muted-foreground">{p.description}</p>
                  </div>
                  <Input
                    placeholder={p.placeholder ?? `Enter ${p.name}…`}
                    className="h-9 rounded-xl font-mono text-sm"
                    value={bodyValues[p.name] ?? ""}
                    onChange={(e) =>
                      setBodyValues((prev) => ({ ...prev, [p.name]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {/* Send button */}
          <Button
            className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Send Request
              </>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Response
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold",
                    statusOk
                      ? "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                  )}
                >
                  {response.status}
                </span>
                {statusOk ? (
                  <span className="text-xs text-teal-600 dark:text-teal-400">OK</span>
                ) : (
                  <span className="text-xs text-red-600 dark:text-red-400">Error</span>
                )}
              </div>
              <pre className="max-h-[400px] overflow-auto bg-[#0f172a] p-4 font-mono text-xs leading-relaxed text-[#e2e8f0] whitespace-pre-wrap break-words">
                {JSON.stringify(response.body, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
