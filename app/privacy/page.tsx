import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#0F0F0F]">
      <LandingNav />
      
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-32">
        <header className="mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm font-medium text-[#6B6B6B]">
            Last updated: April 13, 2026
          </p>
        </header>

        <div className="prose prose-slate max-w-none space-y-12 text-[#3D3D3D]">
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">1. Data Sovereignty for Treasury</h2>
            <p className="leading-relaxed">
              At FlowPilot, we recognize that treasury data is the lifeblood of your business. Our platform is designed to provide 
              total traceability without compromising the confidentiality of your financial operations. We collect data necessary 
              to execute supervised runs, reconcile accounts, and score risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <p>To provide our execution layer services, we collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Entity Information:</strong> Business registration details and authorized operator identities.</li>
                <li><strong>Financial Data:</strong> Bank account details and balance information synchronized via our Interswitch API integration.</li>
                <li><strong>Operational Logs:</strong> A complete record of every supervised run, including goal definitions and agent actions.</li>
                <li><strong>Communication:</strong> Interactions between operators and AI agents during the supervision process.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">3. Supervised AI & Data Processing</h2>
            <p className="leading-relaxed">
              FlowPilot uses AI agents to automate the "drag" of treasury operations. These agents process your data under 
              strict human supervision. Your data is used exclusively to refine the accuracy of reconciliation and risk 
              scoring for your specific entity. We do not sell your financial data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">4. Third-Party Integrations</h2>
            <p className="leading-relaxed">
              Our platform leverages the Interswitch Protocol to facilitate secure account synchronization and payout execution. 
              Data shared with Interswitch is subject to their enterprise-grade security standards and is only transmitted as 
              required to fulfill the execution goals defined by your operators.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">5. Security & Traceability</h2>
            <p className="leading-relaxed">
              All data is encrypted using AES-256 at rest and TLS 1.3 in transit. Because FlowPilot is "audit-ready by default," 
              we maintain an immutable system of record for 10 years, ensuring your treasury team can reconstruct any 
              decision or payout with total clarity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">6. Your Rights</h2>
            <p className="leading-relaxed">
              You maintain full control over your data. Authorized administrators can export operational logs or request 
              data deletion at any time, subject to local financial record-keeping regulations.
            </p>
          </section>

          <section className="pt-8 border-t border-[#D9D4C8]">
            <p className="text-sm font-medium">
              Questions about our privacy standards? Reach out to our security team:
              <a href="mailto:security@flowpilot.ai" className="ml-1 text-[#e86727] hover:underline">security@flowpilot.ai</a>
            </p>
          </section>
        </div>
      </article>

      <LandingFooter />
    </main>
  );
}
