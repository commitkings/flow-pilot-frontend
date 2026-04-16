"use client";

import { Bolt, BrainCircuit, FileCheck2, Hand, ShieldCheck, Cpu } from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "Catches Payment Errors Automatically",
    text: "Detects duplicate payments, mismatched references, and orphaned transactions before they cause problems — no manual reconciliation needed.",
    accent: "#0A84FF",
    tone: "bg-[#EAF2FF] text-[#0A84FF]",
  },
  {
    icon: ShieldCheck,
    title: "Verifies Every Recipient Before Money Moves",
    text: "Every account number is cross-checked against Interswitch's KYC database before a single Naira is staged for payout.",
    accent: "#0D9D6D",
    tone: "bg-[#E8FBF2] text-[#0D9D6D]",
  },
  {
    icon: Bolt,
    title: "Checks You Can Afford It First",
    text: "FlowPilot stress-tests your balance against the payout batch — so you never accidentally overdraw your operating account.",
    accent: "#D98700",
    tone: "bg-[#FFF5E6] text-[#D98700]",
  },
  {
    icon: Hand,
    title: "Nothing Moves Without Your Approval",
    text: "Every payout run pauses for your sign-off. No AI executes transactions on its own — you stay in control, always.",
    accent: "#C0445E",
    tone: "bg-[#FFF0F2] text-[#C0445E]",
  },
  {
    icon: Cpu,
    title: "Powered by Interswitch — Bank-Grade Speed",
    text: "Native connection to Interswitch's search, lookup, and payout APIs. Payments execute in real time, not overnight batches.",
    accent: "#1B2A44",
    tone: "bg-[#EEF0F5] text-[#1B2A44]",
  },
  {
    icon: FileCheck2,
    title: "Automatic Audit Report — Every Time",
    text: "Every completed run generates a compliance-ready report with timestamps, agent reasoning, and full transaction history.",
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
              Everything you need <br className="hidden md:block" />
              to pay with confidence.
            </h2>
          </div>
          <p className="max-w-xs text-sm font-medium leading-relaxed text-[#6B6B6B]">
            Not a chatbot — an active payment system that verifies, checks, and executes. Built for individuals and teams alike, with you in control at every step.
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
