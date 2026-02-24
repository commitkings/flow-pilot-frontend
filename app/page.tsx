import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-xl space-y-6">
        <h1 className="text-5xl font-semibold tracking-tight text-foreground">
          FlowPilot
        </h1>

        <p className="text-lg text-muted-foreground font-medium">
          AI-powered treasury execution for modern SMEs.
        </p>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Reconcile transactions, assess payout risk, verify beneficiaries, and
          execute approved disbursements — all with full audit visibility.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button asChild variant="default" size="lg" className="rounded-xl px-6">
            <Link href="/auth">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl px-6">
            <Link href="/auth">Log In</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
