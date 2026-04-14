"use client";

const pipeline = [
  { 
    step: "01", 
    title: "Reconciliation", 
    rotation: "-rotate-6", 
    zIndex: "z-10", 
    status: "Matching Active",
    label: "Ingestion Engine",
    description: "Normalizing multi-channel data streams to resolve unmatched transaction references."
  },
  { 
    step: "02", 
    title: "Risk Scoring", 
    rotation: "rotate-2", 
    zIndex: "z-20", 
    status: "Scoring Layer",
    label: "Security Kernel",
    description: "Analyzing payout candidates against historical patterns and liquidity stress factors."
  },
  { 
    step: "03", 
    title: "Approval Gate", 
    rotation: "-rotate-3", 
    zIndex: "z-30", 
    status: "Awaiting Ops",
    label: "Verification Node",
    description: "Human-in-the-loop review for high-variance candidates before final signature."
  },
  { 
    step: "04", 
    title: "Execution", 
    rotation: "rotate-6", 
    zIndex: "z-40", 
    status: "Ready to Push",
    label: "Disbursement Hub",
    description: "Finalizing real-time instructions to Interswitch APIs for instant settlement."
  },
];

export function PipelineSection() {
  return (
    <div className="mt-20 flex flex-col items-center sm:flex-row sm:justify-center sm:px-10">
      {pipeline.map((item, idx) => (
        <div
          key={item.step}
          className={`
            relative w-full max-w-85 transition-all duration-300 hover:z-50 hover:-translate-y-4 hover:scale-110
            ${item.rotation} ${idx !== 0 ? "-mt-20 sm:mt-0 sm:-ml-16" : ""}
            ${item.zIndex}
          `}
        >
          <div className="aspect-4/5 rounded-[2rem] bg-[#da6328] p-3 shadow-[0_8px_24px_rgba(218,99,40,0.2)] flex flex-col border border-white/10">

            <div className="mx-auto mb-3 flex flex-col items-center">
              <div className="h-2 w-10 rounded-full bg-black/20" />
            </div>

            <div className="relative flex-1 overflow-hidden rounded-[1.2rem] bg-[#FAF8F4] p-5 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-[#da6328] uppercase tracking-widest">System Flow</span>
                <span className="text-[9px] font-bold text-black/20 uppercase tracking-widest">{item.step}</span>
              </div>

              <div className="mt-auto">
                <h3 className="text-xl font-black leading-tight text-[#0F0F0F] tracking-tight">
                  {item.title}
                </h3>

                <div className="mt-3">
                  <div className="mb-2 h-px w-full bg-black/8" />
                  <p className="text-[10px] font-medium leading-relaxed text-[#888]">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="py-3 flex flex-col items-center justify-center gap-0.5">
              <span className="text-[9px] font-semibold tracking-[0.2em] text-white/50 uppercase">
                {item.label}
              </span>
              <span className="text-xs font-black text-white uppercase tracking-wide">
                {item.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}