"use client";

import { Bolt, BrainCircuit, FileCheck2, Hand, ShieldCheck, Cpu } from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "Self-Healing Ledger",
    text: "Agents don't just find mismatches; they suggest resolutions for duplicate entries and orphan references in real-time.",
    accent: "#0A84FF",
    tone: "bg-[#EAF2FF] text-[#0A84FF]",
  },
  {
    icon: ShieldCheck,
    title: "Anti-Fraud Engine",
    text: "Automatic cross-referencing of account numbers against Interswitch's KYC database before any funds are staged.",
    accent: "#0D9D6D",
    tone: "bg-[#E8FBF2] text-[#0D9D6D]",
  },
  {
    icon: Bolt,
    title: "Liquidity Guard",
    text: "Real-time stress testing ensures that proposed payout batches never compromise your operating capital.",
    accent: "#D98700",
    tone: "bg-[#FFF5E6] text-[#D98700]",
  },
  {
    icon: Hand,
    title: "Human-in-the-Loop",
    text: "Deterministic safety rails. No agent can execute a transaction without a cryptographically signed human approval.",
    accent: "#C0445E",
    tone: "bg-[#FFF0F2] text-[#C0445E]",
  },
  {
    icon: Cpu,
    title: "Direct Protocol Access",
    text: "Native integration with Interswitch search, lookup, and payout APIs for sub-second execution.",
    accent: "#1B2A44",
    tone: "bg-[#EEF0F5] text-[#1B2A44]",
  },
  {
    icon: FileCheck2,
    title: "Automated Compliance",
    text: "Every run generates a pre-formatted audit pack, including API timestamps and agent reasoning, ready for review.",
    accent: "#0D7EA6",
    tone: "bg-[#EBF9FF] text-[#0D7EA6]",
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="features" className="bg-white py-24 md:py-32 border-t border-[#E8E4DC]">
      <div className="mx-auto max-w-7xl px-6 md:px-10">

        {/* Header */}
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

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Accent top bar */}
                <div
                  className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ backgroundColor: feature.accent }}
                />

                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>

                <h3 className="mt-5 text-base font-bold tracking-tight text-[#0F0F0F]">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">
                  {feature.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
