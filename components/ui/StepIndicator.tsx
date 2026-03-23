"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  current: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, current, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-5 w-full">
      <ol className="flex w-full items-center justify-between">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < current;
          const isActive = stepNumber === current;

          return (
            <li
              key={label}
              className={cn(
                "flex items-center",
                index !== steps.length - 1 ? "w-full" : "w-auto"
              )}
            >
              <div className="relative flex flex-col items-start">
                <div className="flex items-center gap-3">
                  {/* Step Circle */}
                  <button
                    type="button"
                    disabled={!isCompleted || !onStepClick}
                    onClick={() => isCompleted && onStepClick?.(stepNumber)}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all duration-500",
                      isCompleted
                        ? "bg-brand text-white cursor-pointer hover:opacity-80 active:scale-95"
                        : isActive
                        ? "bg-brand text-white cursor-default"
                        : "bg-muted text-muted-foreground border-2 border-transparent cursor-default"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 stroke-3" />
                    ) : (
                      <span>{stepNumber}</span>
                    )}
                  </button>

                  {/* Desktop Label */}
                  <span
                    className={cn(
                      "hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.15em] md:block",
                      isActive || isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground/60"
                    )}
                  >
                    {label}
                  </span>
                </div>
              </div>

              {/* Progress Line */}
              {index < steps.length - 1 && (
                <div className="mx-4 h-0.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full bg-brand transition-all duration-700 ease-in-out",
                      isCompleted ? "w-full" : isActive ? "w-0" : "w-0"
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* <div className="mt-6 flex items-center justify-between rounded-2xl bg-muted/50 p-4 md:hidden">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">
            Current Phase
          </p>
          <p className="text-sm font-medium text-foreground">
            {steps[current - 1]}
          </p>
        </div>
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          {current} / {steps.length}
        </div>
      </div> */}
    </nav>
  );
}
