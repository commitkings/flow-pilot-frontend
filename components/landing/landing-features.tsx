"use client";

import { Bolt, BrainCircuit, FileCheck2, Hand, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "Self-Healing Ledger",
    text: "Agents don't just find mismatches; they suggest resolutions for duplicate entries and orphan references in real-time.",
    tone: "bg-[#EAF2FF] text-[#0A84FF]",
    span: "md:col-span-2",
  },
  {
    icon: ShieldCheck,
    title: "Anti-Fraud Engine",
    text: "Automatic cross-referencing of account numbers against Interswitch's KYC database before any funds are staged.",
    tone: "bg-[#E8FBF2] text-[#0D9D6D]",
    span: "md:col-span-1",
  },
  {
    icon: Bolt,
    title: "Liquidity Guard",
    text: "Real-time stress testing ensures that proposed payout batches never compromise your operating capital.",
    tone: "bg-[#FFF5E6] text-[#D98700]",
    span: "md:col-span-1",
  },
  {
    icon: Hand,
    title: "Human-in-the-Loop",
    text: "Deterministic safety rails. No agent can execute a transaction without a cryptographically signed human approval.",
    tone: "bg-[#FFF0F2] text-[#C0445E]",
    span: "md:col-span-1",
  },
  {
    icon: BrainCircuit, // You can use a 'Link' or 'Cpu' icon here if preferred
    title: "Direct Protocol Access",
    text: "Native integration with Interswitch search, lookup, and payout APIs for sub-second execution.",
    tone: "bg-[#EEF0F5] text-[#1B2A44]",
    span: "md:col-span-1",
  },
  {
    icon: FileCheck2,
    title: "Automated Compliance",
    text: "Every run generates a pre-formatted audit pack, including API timestamps and agent reasoning, ready for review.",
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