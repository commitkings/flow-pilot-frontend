import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activityItems = [
  {
    id: 1,
    text: "Payroll reconciliation completed",
    time: "2 minutes ago",
  },
  {
    id: 2,
    text: "12 payouts awaiting approval",
    time: "18 minutes ago",
  },
  {
    id: 3,
    text: "Liquidity forecast generated",
    time: "1 hour ago",
  },
  {
    id: 4,
    text: "Beneficiary verification passed for 8 vendors",
    time: "3 hours ago",
  },
  {
    id: 5,
    text: "Risk alert: High-value payout flagged for review",
    time: "5 hours ago",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of active treasury operations and risk exposure.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Active Runs"
          value={3}
          subtext="+1 from yesterday"
        />
        <MetricCard
          title="Pending Approvals"
          value={5}
          subtext="Requires review"
        />
        <MetricCard
          title="Risk Alerts"
          value={2}
          subtext="High priority"
        />
      </div>

      {/* Activity Section */}
      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {activityItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.time}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
