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
          <div className="aspect-4/5 rounded-[2rem] bg-[#da6328] p-3 shadow-[0_20px_50px_rgba(218,99,40,0.3)] flex flex-col border border-white/20">
            
            <div className="mx-auto mb-3 flex flex-col items-center">
              <div className="h-2.5 w-12 rounded-full bg-black/20" />
            </div>

            <div className="relative flex-1 overflow-hidden rounded-[1.2rem] bg-[#FAF8F4] p-5 flex flex-col border border-black/5">
              {/* Top Meta-data */}
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-[#da6328] uppercase tracking-tighter">System Flow</span>
              </div>

              <span className="absolute -right-2.5 top-4 text-7xl font-black text-black/3 italic">
                {item.step}
              </span>

              <div className="mt-auto">
                <h3 className="text-xl font-black leading-tight text-[#0F0F0F] tracking-tight">
                  {item.title}
                </h3>
                
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-[#da6328]" />
                    <div className="h-1 w-12 rounded-full bg-black/5" />
                  </div>
                  <p className="text-[10px] font-semibold leading-relaxed text-[#6B6B6B]">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="py-3 flex flex-col items-center justify-center gap-1">
              <span className="text-[10px] font-bold tracking-[0.25em] text-white/60 uppercase">
                {item.label}
              </span>
              <span className="text-sm font-black text-white uppercase tracking-wider">
                {item.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}