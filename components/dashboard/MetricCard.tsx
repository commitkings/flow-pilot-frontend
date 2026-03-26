import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type Accent = "default" | "brand" | "amber" | "red" | "green";

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: Accent;
  subtext?: string;
  className?: string;
}

const accentStyles: Record<Accent, { 
  iconBg: string; 
  iconText: string; 
  glow: string;
}> = {
  default: { iconBg: "bg-muted", iconText: "text-muted-foreground", glow: "group-hover:border-border" },
  brand:   { iconBg: "bg-brand/10", iconText: "text-brand", glow: "group-hover:border-brand/30 group-hover:bg-brand/[0.02]" },
  amber:   { iconBg: "bg-amber-500/10", iconText: "text-amber-600 dark:text-amber-500", glow: "group-hover:border-amber-500/30 group-hover:bg-amber-500/[0.02]" },
  red:     { iconBg: "bg-red-500/10", iconText: "text-red-600 dark:text-red-500", glow: "group-hover:border-red-500/30 group-hover:bg-red-500/[0.02]" },
  green:   { iconBg: "bg-emerald-500/10", iconText: "text-emerald-600 dark:text-emerald-500", glow: "group-hover:border-emerald-500/30 group-hover:bg-emerald-500/[0.02]" },
};

export function MetricCard({ label, value, icon, accent = "default", subtext, className }: MetricCardProps) {
  const styles = accentStyles[accent];

  return (
    <Card className={cn(
      "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300",
      "hover:shadow-lg hover:shadow-black/2 dark:hover:shadow-white/2",
      styles.glow,
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
            {label}
          </p>
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tight text-foreground">
              {value}
            </h3>
            {subtext && (
              <p className="text-[11px] font-bold text-muted-foreground/70">
                {subtext}
              </p>
            )}
          </div>
        </div>

        <div className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
          styles.iconBg,
          styles.iconText
        )}>
          {/* We clone the icon to ensure it inherits the accent color automatically */}
          {/* Note: In production, you'd use React.cloneElement if passed as a component */}
          <div className="h-5 w-5">
            {icon}
          </div>
        </div>
      </div>
      
      {/* Visual flourish: A bottom-accent line that only appears on hover */}
      <div className={cn(
        "absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full",
        accent === "default" ? "bg-muted" : 
        accent === "brand" ? "bg-brand" : 
        accent === "green" ? "bg-emerald-500" : 
        accent === "amber" ? "bg-amber-500" : "bg-red-500"
      )} />
    </Card>
  );
}