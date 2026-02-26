"use client";

import ArrowPoint from "@/public/svg/ArrowPoint";
import { PlaneLine } from "@/public/svg/PlaneLine";

const steps = [
  {
    title: "Configure Intent",
    text: "Set natural language parameters for the run—like budget caps, date ranges for reconciliation, and specific risk tolerance levels.",
    color: "#e86727",
  },
  {
    title: "Multi-Agent Sync",
    text: "Planner orchestrates the cycle: ReconciliationAgent pulls Interswitch logs, while RiskAgent cross-references lookup data.",
    color: "#0A84FF",
  },
  {
    title: "Human Checkpoint",
    text: "The system pauses for your review. Inspect liquidity forecasts and recipient verification results before a single Naira moves.",
    color: "#0D9D6D",
  },
  {
    title: "Atomic Execution",
    text: "Approved payouts are fired through Interswitch Payout APIs with real-time status tracking and an immutable audit report.",
    color: "#6B4EFF",
  },
];

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-[#FAF8F4] py-16 md:py-24 lg:py-32"
    >
      {/* Background PlaneLine - Hidden on small screens to avoid clutter */}
      <div className="absolute top-[60%] left-0 hidden lg:block w-full opacity-50">
        <PlaneLine />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {/* Header Section */}
        <div className="mb-12 md:mb-20 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e86727]">
              Runtime Model
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0F0F0F] sm:text-4xl md:text-5xl">
              A plan that flows,{" "}
              <span className="text-[#e86727]">supervised.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm font-medium leading-relaxed text-[#6B6B6B]">
            Your instructions pass through a rigorous multi-agent graph with
            human checkpoints.
          </p>
        </div>

        {/* Steps Grid: 1 col (mobile) -> 2 cols (tablet) -> 4 cols (desktop) */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="group relative flex">
              <div className="relative z-10 w-full rounded-[2rem] border border-[#E8E4DC] bg-white p-6 md:p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-900/5">
                <div className="flex flex-col h-full">
                  <span
                    className="text-3xl md:text-4xl font-black italic opacity-10"
                    style={{ color: step.color }}
                  >
                    0{index + 1}
                  </span>

                  <h3 className="mt-4 text-lg md:text-xl font-bold tracking-tight text-[#0F0F0F]">
                    {step.title}
                  </h3>

                  <p className="mt-3 md:mt-4 grow text-xs md:text-sm leading-relaxed text-[#6B6B6B]">
                    {step.text}
                  </p>

                  <div className="mt-6 md:mt-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div
                        className="h-1.5 w-1.5 rounded-full animate-pulse transition-colors group-hover:scale-125"
                        style={{ backgroundColor: step.color }}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
                        Active Path
                      </span>
                    </div>

                    {/* ArrowPoint: Hidden on mobile/tablet because the grid wraps */}
                    {index !== steps.length - 1 && (
                      <div className="hidden lg:block text-[#D9D4C8]">
                        <ArrowPoint />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}