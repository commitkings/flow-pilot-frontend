"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";

interface RunConfigPreviewProps {
  slots: Record<string, unknown>;
  readOnly?: boolean;
}

interface SlotConfig {
  key: string;
  label: string;
  required: boolean;
  format?: (value: unknown) => string;
}

const SLOT_CONFIGS: SlotConfig[] = [
  {
    key: "objective",
    label: "Objective",
    required: true,
    format: (v) => String(v || ""),
  },
  {
    key: "date_range_start",
    label: "Start Date",
    required: false,
    format: (v) => (v ? new Date(String(v)).toLocaleDateString() : ""),
  },
  {
    key: "date_range_end",
    label: "End Date",
    required: false,
    format: (v) => (v ? new Date(String(v)).toLocaleDateString() : ""),
  },
  {
    key: "risk_tolerance",
    label: "Risk Tolerance",
    required: false,
    format: (v) => {
      const val = Number(v);
      if (val <= 0.3) return "Low";
      if (val <= 0.6) return "Medium";
      return "High";
    },
  },
  {
    key: "budget_cap",
    label: "Budget Cap",
    required: false,
    format: (v) =>
      v
        ? new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
          }).format(Number(v))
        : "",
  },
  {
    key: "recipient_filter",
    label: "Recipient Filter",
    required: false,
    format: (v) => (typeof v === "object" ? JSON.stringify(v) : String(v || "")),
  },
];

export function RunConfigPreview({ slots, readOnly = true }: RunConfigPreviewProps) {
  const hasAnySlots = Object.keys(slots).length > 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Run Configuration</CardTitle>
        <CardDescription>
          {hasAnySlots
            ? "Parameters extracted from conversation"
            : "Parameters will appear here as you chat"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasAnySlots ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No parameters extracted yet</p>
            <p className="text-xs mt-1">
              Start chatting to configure your run
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {SLOT_CONFIGS.map((config) => {
              const value = slots[config.key];
              const hasValue = value !== undefined && value !== null && value !== "";
              const formattedValue = hasValue ? config.format?.(value) || String(value) : null;

              return (
                <div
                  key={config.key}
                  className={cn(
                    "flex items-start justify-between py-2 border-b last:border-0",
                    !hasValue && config.required && "opacity-60"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{config.label}</span>
                      {config.required && !hasValue && (
                        <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    {hasValue ? (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formattedValue}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 mt-0.5 italic">
                        Not set
                      </p>
                    )}
                  </div>
                  {hasValue && (
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}

            {/* Show any extra slots not in the predefined list */}
            {Object.entries(slots)
              .filter(([key]) => !SLOT_CONFIGS.some((c) => c.key === key))
              .map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1">
                    <span className="text-sm font-medium capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </p>
                  </div>
                  <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
