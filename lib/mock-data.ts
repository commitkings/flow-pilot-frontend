export type RunStatus =
  | "pending"
  | "planning"
  | "running"
  | "awaiting_approval"
  | "executing"
  | "completed"
  | "completed_with_errors"
  | "failed";

export type CandidateDecision = "allow" | "review" | "block";

export type PayoutCandidate = {
  id: string;
  beneficiaryName: string;
  institution: string;
  accountNumber: string;
  amount: number;
  purpose: string;
  riskScore: number;
  riskReasons: string[];
  lookupStatus: "pending" | "verified" | "mismatch" | "failed";
  decision: CandidateDecision;
  approvalStatus: "selected" | "unselected" | "blocked" | "manual_review" | "successful" | "sending";
  similarity: number;
  nameOnFile: string;
  returnedName: string;
};

export type RunRecord = {
  id: string;
  objective: string;
  status: RunStatus;
  candidates: number;
  startedRelative: string;
  startedAt: string;
  startedAtLabel: string;
  error?: string | null;
};

export const institutions = [
  "GTBank",
  "Access Bank",
  "First Bank",
  "Zenith Bank",
  "UBA",
  "Stanbic IBTC",
  "Fidelity Bank",
  "Wema Bank",
];

export const runs: RunRecord[] = [
  {
    id: "a3f9b2c1-e4f7-4b80-9f2d-1adf0ac9120f",
    objective: "Reconcile all payroll transactions from Feb 1 to Feb 14 and execute approved payroll payouts under risk threshold 0.35.",
    status: "awaiting_approval",
    candidates: 6,
    startedRelative: "2 hours ago",
    startedAt: "Feb 24, 2026, 10:14 AM WAT",
    startedAtLabel: "Feb 24, 2026, 10:14 AM WAT",
  },
  {
    id: "b7d4e891-9db1-4cd8-a8fc-a7d8b5029bfe",
    objective: "Reconcile vendor payment activity and disburse verified vendor invoices.",
    status: "completed",
    candidates: 12,
    startedRelative: "Yesterday",
    startedAt: "Feb 23, 2026, 3:04 PM WAT",
    startedAtLabel: "Feb 23, 2026, 3:04 PM WAT",
  },
  {
    id: "c2a1f349-6cf5-4770-a0fe-4cc8c6e9a0f1",
    objective: "Run contractor disbursement checks and queue low-risk beneficiaries only.",
    status: "running",
    candidates: 4,
    startedRelative: "15 minutes ago",
    startedAt: "Feb 24, 2026, 11:59 AM WAT",
    startedAtLabel: "Feb 24, 2026, 11:59 AM WAT",
  },
  {
    id: "d9e3b217-bd8a-4f75-884c-68e70a954608",
    objective: "Reconcile supplier payments and retry failed settlements from prior window.",
    status: "failed",
    candidates: 8,
    startedRelative: "3 days ago",
    startedAt: "Feb 21, 2026, 9:00 AM WAT",
    startedAtLabel: "Feb 21, 2026, 9:00 AM WAT",
  },
  {
    id: "e5f2c084-030d-4378-bfa5-85af4cf35f43",
    objective: "Validate inter-account transfer logs and execute approved treasury transfers.",
    status: "completed",
    candidates: 3,
    startedRelative: "Last week",
    startedAt: "Feb 16, 2026, 1:21 PM WAT",
    startedAtLabel: "Feb 16, 2026, 1:21 PM WAT",
  },
];

export const approvalCandidates: PayoutCandidate[] = [
  {
    id: "cand-1",
    beneficiaryName: "Chukwuemeka Adeyemi",
    institution: "GTBank",
    accountNumber: "054221789",
    amount: 450000,
    purpose: "February Salary",
    riskScore: 0.12,
    riskReasons: ["Frequent recipient", "Historical payout consistency", "Verified institution match"],
    lookupStatus: "verified",
    decision: "allow",
    approvalStatus: "selected",
    similarity: 98,
    nameOnFile: "Chukwuemeka Adeyemi",
    returnedName: "CHUKWUEMEKA ADEYEMI",
  },
  {
    id: "cand-2",
    beneficiaryName: "Fatima Bello",
    institution: "Access Bank",
    accountNumber: "031998442",
    amount: 320000,
    purpose: "Contractor Fee",
    riskScore: 0.28,
    riskReasons: ["Regular amount", "No duplicate activity", "Recent successful payouts"],
    lookupStatus: "verified",
    decision: "allow",
    approvalStatus: "selected",
    similarity: 97,
    nameOnFile: "Fatima Bello",
    returnedName: "FATIMA BELLO",
  },
  {
    id: "cand-3",
    beneficiaryName: "Taiwo Ogundimu",
    institution: "First Bank",
    accountNumber: "302554115",
    amount: 890000,
    purpose: "Project Settlement",
    riskScore: 0.58,
    riskReasons: ["Amount 4x above average", "First payout in 90 days", "Lookup mismatch warning"],
    lookupStatus: "mismatch",
    decision: "review",
    approvalStatus: "unselected",
    similarity: 81,
    nameOnFile: "Taiwo Ogundimu",
    returnedName: "Taiwo O."
  },
  {
    id: "cand-4",
    beneficiaryName: "Ngozi Eze",
    institution: "Zenith Bank",
    accountNumber: "219000667",
    amount: 175000,
    purpose: "Supplier Balance",
    riskScore: 0.19,
    riskReasons: ["Known recipient", "Stable payout pattern", "Verified lookup response"],
    lookupStatus: "verified",
    decision: "allow",
    approvalStatus: "selected",
    similarity: 99,
    nameOnFile: "Ngozi Eze",
    returnedName: "NGOZI EZE",
  },
  {
    id: "cand-5",
    beneficiaryName: "Emeka Okonkwo",
    institution: "UBA",
    accountNumber: "077888334",
    amount: 1200000,
    purpose: "Emergency Transfer",
    riskScore: 0.82,
    riskReasons: ["Duplicate attempt detected", "High amount deviation", "Lookup verification failed"],
    lookupStatus: "failed",
    decision: "block",
    approvalStatus: "blocked",
    similarity: 42,
    nameOnFile: "Emeka Okonkwo",
    returnedName: "Not Found",
  },
  {
    id: "cand-6",
    beneficiaryName: "Amina Suleiman",
    institution: "Stanbic IBTC",
    accountNumber: "408777991",
    amount: 260000,
    purpose: "February Salary",
    riskScore: 0.31,
    riskReasons: ["Regular salary recipient", "Verified institution", "Consistent amount"],
    lookupStatus: "verified",
    decision: "allow",
    approvalStatus: "selected",
    similarity: 95,
    nameOnFile: "Amina Suleiman",
    returnedName: "AMINA SULEIMAN",
  },
];

export const transactionRows = [
  { reference: "ISW-TRX-938114", channel: "WEB", amount: 245000, status: "Completed", date: "2026-02-14 09:12", anomaly: "Clean" },
  { reference: "ISW-TRX-938210", channel: "USSD", amount: 780000, status: "Pending", date: "2026-02-14 09:24", anomaly: "Amount Spike" },
  { reference: "ISW-TRX-938477", channel: "POS", amount: 42000, status: "Failed", date: "2026-02-14 10:03", anomaly: "Duplicate Ref" },
  { reference: "ISW-TRX-938611", channel: "MOBILE", amount: 110000, status: "Completed", date: "2026-02-14 10:44", anomaly: "Clean" },
  { reference: "ISW-TRX-938702", channel: "WEB", amount: 360000, status: "Completed", date: "2026-02-14 11:16", anomaly: "Clean" },
  { reference: "ISW-TRX-938803", channel: "POS", amount: 59000, status: "Pending", date: "2026-02-14 11:47", anomaly: "Clean" },
  { reference: "ISW-TRX-938890", channel: "USSD", amount: 915000, status: "Completed", date: "2026-02-14 12:08", anomaly: "Amount Spike" },
  { reference: "ISW-TRX-938990", channel: "WEB", amount: 135000, status: "Completed", date: "2026-02-14 12:39", anomaly: "Clean" },
];

export const teamMembers = [
  { initials: "AO", name: "Adebayo Okafor", email: "adebayo@acmecorp.com", role: "Approver", status: "Active", dateAdded: "Jan 15 2026", lastActive: "2 hours ago", owner: true },
  { initials: "FC", name: "Funke Coker", email: "funke@acmecorp.com", role: "Approver", status: "Active", dateAdded: "Jan 20 2026", lastActive: "Yesterday", owner: false },
  { initials: "TI", name: "Tunde Ibrahim", email: "tunde@acmecorp.com", role: "Analyst", status: "Active", dateAdded: "Feb 1 2026", lastActive: "3 days ago", owner: false },
  { initials: "NM", name: "Ngozi Madu", email: "ngozi@acmecorp.com", role: "Analyst", status: "Invited", dateAdded: "Feb 10 2026", lastActive: "Never", owner: false },
  { initials: "CA", name: "Chidi Anozie", email: "chidi@acmecorp.com", role: "Analyst", status: "Invited", dateAdded: "Feb 12 2026", lastActive: "Never", owner: false },
  { initials: "BO", name: "Blessing Ogundele", email: "blessing@acmecorp.com", role: "Analyst", status: "Suspended", dateAdded: "Dec 5 2025", lastActive: "2 months ago", owner: false },
];

export const apiTraceRows = [
  ["Execution", "/api/v1/payouts/receiving-institutions", "GET", 200, "180ms"],
  ["Reconciliation", "/api/v1/transactions/search/quick", "POST", 200, "940ms"],
  ["Reconciliation", "/api/v1/transactions/search/reference", "POST", 200, "640ms"],
  ["Risk", "/api/v1/risk/score", "POST", 200, "330ms"],
  ["Forecast", "/api/v1/forecast/liquidity", "POST", 200, "410ms"],
  ["Execution", "/api/v1/payouts/customer-lookup", "POST", 200, "520ms"],
  ["Execution", "/api/v1/payouts", "POST", 200, "720ms"],
  ["Audit", "/api/v1/runs/a3f9b2c1/report", "POST", 200, "280ms"],
] as const;

export function truncateRunId(id: string) {
  return id.slice(0, 8);
}

export function naira(value: number) {
  return `₦${value.toLocaleString("en-NG")}`;
}

export function maskAccount(account: string) {
  return `${account.slice(0, 3)}***${account.slice(-3)}`;
}
