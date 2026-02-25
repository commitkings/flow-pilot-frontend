"use client";

const pipeline = [
  { step: "01", title: "Reconciliation", rotation: "-rotate-6", zIndex: "z-10" },
  { step: "02", title: "Risk Scoring", rotation: "rotate-2", zIndex: "z-20", offset: "-ml-8" },
  { step: "03", title: "Approval Gate", rotation: "-rotate-3", zIndex: "z-30", offset: "-ml-8" },
  { step: "04", title: "Execution", rotation: "rotate-6", zIndex: "z-40", offset: "-ml-8" },
];

export function PipelineSection() {
  return (
    <div className="mt-16 flex flex-col items-center sm:flex-row sm:justify-center sm:px-10">
      {pipeline.map((item, idx) => (
        <div
          key={item.step}
          className={`
            relative w-full max-w-80 transition-transform hover:z-50 hover:scale-105
            ${item.rotation} ${idx !== 0 ? "-mt-15 sm:mt-0 sm:-ml-12" : ""}
            ${item.zIndex}
          `}
        >
          {/* Main Card Body */}
          <div className="aspect-4/5 rounded-[2.5rem] bg-[#da6328] p-4 shadow-2xl flex flex-col">
            
            {/* The "ID Slot" Hole at the top */}
            <div className="mx-auto mb-4 h-3 w-16 rounded-full bg-[#FAF8F4]/40" />

            {/* Content Area (The "Photo") */}
            <div className="flex-1 overflow-hidden rounded-[1.5rem] bg-[#FAF8F4] p-6 flex flex-col justify-center">
              <span className="text-4xl font-black text-[#e86727]/20">{item.step}</span>
              <h3 className="mt-2 text-xl font-bold leading-tight text-[#0F0F0F]">
                {item.title}
              </h3>
              <p className="mt-3 text-xs font-medium leading-relaxed text-[#6B6B6B]">
                Automated matching and verification.
              </p>
            </div>

            <div className="py-4 text-center">
              <span className="text-lg font-black tracking-[0.2em] text-white uppercase">
                STEP {item.step}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}