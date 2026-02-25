"use client";

import { Bolt, BrainCircuit, CheckCircle2, FileCheck2, Hand, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "AI Reconciliation",
    text: "Normalize and compare payment activity across channels to expose unresolved references.",
    tone: "bg-[#EAF2FF] text-[#0A84FF]",
    span: "md:col-span-2",
  },
  {
    icon: ShieldCheck,
    title: "Risk Scoring",
    text: "Each candidate carries transparent scoring factors, not black-box outputs.",
    tone: "bg-[#E8FBF2] text-[#0D9D6D]",
    span: "md:col-span-1",
  },
  {
    icon: Bolt,
    title: "Liquidity Forecast",
    text: "7-day payout impact simulation flags stress before execution windows.",
    tone: "bg-[#FFF5E6] text-[#D98700]",
    span: "md:col-span-1",
  },
  {
    icon: CheckCircle2,
    title: "Recipient Verification",
    text: "Account lookup against institution data before every disbursement attempt.",
    tone: "bg-[#EEF0F5] text-[#1B2A44]",
    span: "md:col-span-1",
  },
  {
    icon: Hand,
    title: "Human Approval Gate",
    text: "Operators explicitly approve safe or caution candidates before money moves.",
    tone: "bg-[#FFF0F2] text-[#C0445E]",
    span: "md:col-span-1",
  },
  {
    icon: FileCheck2,
    title: "Full Audit Trail",
    text: "Every decision, status transition, and API trace is exportable for compliance.",
    tone: "bg-[#EBF9FF] text-[#0D7EA6]",
    span: "md:col-span-2",
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="features" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        
        {/* Header Section */}
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e86727]">
              Capabilities
            </span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[#0F0F0F] md:text-5xl">
              Everything an SME <br className="hidden md:block" /> 
              treasury team needs.
            </h2>
          </div>
          <p className="max-w-xs text-sm font-medium leading-relaxed text-[#6B6B6B]">
            Built as an execution surface for complex payments, not a passive chatbot.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article 
                key={feature.title} 
                className={`group relative overflow-hidden rounded-[2rem]${feature.span}`}
              >
                {/* Subtle Gradient Background on Hover */}
                <div className="absolute inset-0 from-transparent to-slate-50/50 opacity-0 transition-opacity group-hover:opacity-100" />
                
                <div className="relative z-10">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${feature.tone}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-[#0F0F0F]">
                    {feature.title}
                  </h3>
                  
                  <p className="mt-3 text-sm leading-relaxed text-[#6B6B6B]">
                    {feature.text}
                  </p>
                  
                  {/* Visual flourish for the larger spans */}
                  {feature.span.includes("col-span-2") && (
                    <div className="mt-8 flex gap-2">
                      <div className="h-1 w-12 rounded-full bg-slate-100 group-hover:bg-[#e86727]/20 transition-colors" />
                      <div className="h-1 w-4 rounded-full bg-slate-100" />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}