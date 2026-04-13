import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Shield, Lock, FileCheck, Eye } from "lucide-react";

export default function SecurityAuditPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#0F0F0F]">
      <LandingNav />
      
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-32">
        <header className="mb-16">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e86727]/10 text-[#e86727]">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Security & Compliance
          </h1>
          <p className="mt-4 text-lg text-[#6B6B6B]">
            How FlowPilot protects the modern SME treasury. Built for total traceability and human-governed execution.
          </p>
        </header>

        <div className="space-y-16">
          {/* Section 1 */}
          <section className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-1">
              <Lock className="h-6 w-6 text-[#0F0F0F]" />
            </div>
            <div className="md:col-span-11">
              <h2 className="text-xl font-bold text-[#0F0F0F] mb-3">Enterprise-Grade Encryption</h2>
              <p className="leading-relaxed text-[#3D3D3D]">
                FlowPilot treats your treasury data as mission-critical. All sensitive information, including 
                bank account tokens and identifier documents, are encrypted using AES-256 at rest. Every 
                byte of data in transit is protected via TLS 1.3, ensuring secure handshakes between 
                your operators and our execution layer.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12 border-t border-[#D9D4C8] pt-12">
            <div className="md:col-span-1">
              <FileCheck className="h-6 w-6 text-[#0F0F0F]" />
            </div>
            <div className="md:col-span-11">
              <h2 className="text-xl font-bold text-[#0F0F0F] mb-3">Immutable Audit Trails</h2>
              <p className="leading-relaxed text-[#3D3D3D]">
                FlowPilot is "audit-ready by default." Our platform maintains an immutable system of record 
                for every action taken by both human operators and AI agents. This includes the goal 
                definitions, the agent's reconciliation logic, and the final operator approval timestamp. 
                Your external auditors can reconstruct any treasury "run" with total clarity.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12 border-t border-[#D9D4C8] pt-12">
            <div className="md:col-span-1">
              <Eye className="h-6 w-6 text-[#0F0F0F]" />
            </div>
            <div className="md:col-span-11">
              <h2 className="text-xl font-bold text-[#0F0F0F] mb-3">Supervised AI Guardrails</h2>
              <p className="leading-relaxed text-[#3D3D3D]">
                Our AI agents operate within strictly defined "Supervised Runs." Agents have zero autonomy to 
                execute financial movements without human oversight. Risk scoring models act as a second 
                pair of eyes, flagging anomalies in recipient behavior or reconciliation gaps before 
                they reach the payout stage.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12 border-t border-[#D9D4C8] pt-12">
            <div className="md:col-span-1">
              <Shield className="h-6 w-6 text-[#0F0F0F]" />
            </div>
            <div className="md:col-span-11">
              <h2 className="text-xl font-bold text-[#0F0F0F] mb-3">Interswitch Protocol Partnership</h2>
              <p className="leading-relaxed text-[#3D3D3D]">
                FlowPilot leverages the hardened infrastructure of Interswitch for banking connectivity 
                and payout execution. This partnership ensures that we never store your core banking 
                credentials directly; we utilize secure, scoped API tokens that provide the necessary 
                traceability without the security risk of legacy treasury tools.
              </p>
            </div>
          </section>

          <section className="rounded-3xl bg-[#0F0F0F] p-8 md:p-12 text-white mt-12">
            <h2 className="text-2xl font-bold mb-4">Ongoing Security Audits</h2>
            <p className="text-[#9A9A9A] leading-relaxed mb-6">
              We conduct internal penetration tests monthly and engage third-party security firms 
              for deep-dive audits bi-annually. Our security posture is designed to meet the 
              standards required by Pan-African regulators and modern SME compliance teams.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider">
                TLS 1.3 Certified
              </span>
              <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider">
                AES-256 Encrypted
              </span>
              <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider">
                Audit Ready
              </span>
            </div>
          </section>

          <section className="pt-8 border-t border-[#D9D4C8]">
            <p className="text-sm font-medium">
              Requested a full security report or whitepaper?
              <a href="mailto:security@flowpilot.club" className="ml-1 text-[#e86727] hover:underline">security@flowpilot.club</a>
            </p>
          </section>
        </div>
      </article>

      <LandingFooter />
    </main>
  );
}
