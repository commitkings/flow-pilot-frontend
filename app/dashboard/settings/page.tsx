import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your FlowPilot workspace.
        </p>
      </div>
      <Card className="rounded-xl border border-border shadow-sm">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Content coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
