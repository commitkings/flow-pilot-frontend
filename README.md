# FlowPilot Frontend

FlowPilot is an AI-powered treasury execution platform for modern SMEs. It automates bulk payout workflows — from reconciliation and risk scoring to approval and execution — giving finance teams full control with minimal manual effort.

---

## What It Does

- Converts operator objectives into automated treasury runs
- Reconciles transactions and verifies payout recipients
- Scores and flags high-risk payments before they execute
- Routes transactions through an approval queue based on risk thresholds
- Provides a full audit trail for compliance

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + Radix UI |
| Data Fetching | TanStack React Query v5 + Axios |
| Notifications | Sonner |
| Icons | Lucide React |
| Animation | Motion |
| Deployment | Docker + Kubernetes |

---

## Project Structure

```
app/                    # Next.js App Router pages
  (auth)/               # Login, signup, forgot password
  dashboard/            # Main application
    runs/               # Treasury run management
    approvals/          # Approval queue
    transactions/       # Transaction history
    institutions/       # Bank/institution registry
    audit/              # Compliance and audit reports
    team/               # Team member management
    notifications/      # Notification centre
    settings/           # User and org settings
  onboarding/           # First-time setup flow

components/             # Reusable UI components
  ui/                   # Base components (buttons, inputs, tables)
  dashboard/            # Dashboard-specific components
  auth/                 # Auth forms and layouts
  chat/                 # AI chat interface
  onboarding/           # Onboarding step components
  brand/                # Logo and brand assets

hooks/                  # Custom React hooks (queries + mutations)
lib/                    # API client, types, axios config, utilities
context/                # Auth context, React Query provider
public/brand/           # Logo and brand image assets
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |

> All API calls are proxied through `/api/proxy/*` → `NEXT_PUBLIC_API_URL/*` via Next.js rewrites, so the browser never calls the backend directly.

### Running Locally

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Lint
npm run lint
```

The dev server starts on [http://localhost:3000](http://localhost:3000).

---

## API Integration

The frontend communicates with the FlowPilot backend exclusively through a Next.js rewrite proxy:

```
Browser → /api/proxy/<path> → Next.js → <NEXT_PUBLIC_API_URL>/<path>
```

Authentication uses JWT tokens stored in `localStorage`, automatically attached to every request via an Axios request interceptor. A 401 response clears the token and redirects to login.

---

## Docker

### Build

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://your-backend-url/api/v1 \
  -t flowpilot-frontend:latest .
```

### Run

```bash
docker run -p 3000:3000 flowpilot-frontend:latest
```

The image uses a multi-stage build (deps → builder → runner) on `node:20-alpine` with `next build --output standalone` for a minimal production image.

---

## Deployment

Deployments are automated via GitHub Actions on push to `main`:

1. Docker image is built with the production API URL injected as a build arg
2. Image is pushed to the Harbor container registry
3. The Kubernetes manifest in the infra repo is updated with the new image tag
4. Kubernetes rolls out the new deployment

**Required GitHub Actions secrets:**

| Secret | Purpose |
|--------|---------|
| `HARBOR_USERNAME` | Registry login |
| `HARBOR_PASSWORD` | Registry password |
| `NEXT_PUBLIC_API_URL` | Backend URL injected at build time |
| `MANIFESTS_REPO_TOKEN` | Token to update the infra repo |

---

## Key Features

- **AI Chat Interface** — Describe a payout run in plain language; the AI extracts parameters and creates the run
- **Manual Form Mode** — Full-control form for creating runs with recipient CSV upload support
- **Risk Scoring** — Every candidate transaction is scored; high-risk items are held for approval
- **Approval Queue** — Approvers review and action flagged transactions before execution
- **Audit Reports** — Downloadable compliance reports for every completed run
- **Multi-step Onboarding** — Guided setup for business profile, use cases, risk appetite, and team invites
- **Team Roles** — Approvers can authorise payouts; Analysts have read-only access
- **Real-time Updates** — Active runs refetch automatically; live status tracking via SSE
