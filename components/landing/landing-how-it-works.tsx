"use client";

const steps = [
  {
    title: "Set Your Objective",
    text: "Define reconciliation window, budget cap, and risk threshold in plain language.",
    color: "#e86727",
  },
  {
    title: "Agents Coordinate",
    text: "Planner, reconciliation, risk, and forecast agents execute the run graph.",
    color: "#0A84FF",
  },
  {
    title: "Review + Approve",
    text: "You review candidates, lookup outcomes, and liquidity impact before payout.",
    color: "#0D9D6D",
  },
  {
    title: "Execute + Report",
    text: "Approved payouts are sent, tracked, and packaged into an audit-ready report.",
    color: "#6B4EFF",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#FAF8F4] py-24 md:py-32">
      {/* Background Flow Line (Desktop Only) */}
      <div className="absolute top-[60%] left-0 hidden w-full md:block">
        <svg width="100%" height="100" viewBox="0 0 1200 100" fill="none" preserveAspectRatio="none">
          <path 
            d="M0 50 C 300 120, 900 -20, 1400 50" 
            stroke="#E8E4DC" 
            strokeWidth="2" 
            strokeDasharray="8 8"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {/* Header */}
        <div className="mb-20 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e86727]">
              Runtime Model
            </span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[#0F0F0F] md:text-5xl">
              A plan that flows, <span className="text-[#e86727]">supervised.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm font-medium leading-relaxed text-[#6B6B6B]">
            Your instructions pass through a rigorous multi-agent graph with human checkpoints.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="group relative">
              {/* Animated Progress Dot (Desktop) */}
              <div className="absolute -top-4 left-1/2 hidden -translate-x-1/2 md:block">
                <div 
                  className="h-3 w-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-150"
                  style={{ backgroundColor: step.color }}
                />
              </div>

              {/* The Card */}
              <div className="relative z-10 h-full rounded-[2rem] border border-[#E8E4DC] bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-900/5">
                <div className="flex flex-col h-full">
                  <span className="text-4xl font-black italic opacity-10" style={{ color: step.color }}>
                    0{index + 1}
                  </span>
                  
                  <h3 className="mt-4 text-xl font-bold tracking-tight text-[#0F0F0F]">
                    {step.title}
                  </h3>
                  
                  <p className="mt-4 flex-grow text-sm leading-relaxed text-[#6B6B6B]">
                    {step.text}
                  </p>

                  {/* Connecting Label */}
                  <div className="mt-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: step.color }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
                        Active Path
                      </span>
                    </div>
                    {/* Arrow for continuity */}
                    {index !== steps.length - 1 && (
                      <div className="hidden text-[#D9D4C8] md:block">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14m-7-7 7 7-7 7"/>
                        </svg>
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