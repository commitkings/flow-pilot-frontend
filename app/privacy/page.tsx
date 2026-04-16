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
            Last updated: April 16, 2026
          </p>
          <p className="mt-3 text-sm text-[#6B6B6B] leading-relaxed">
            This Privacy Policy explains how FlowPilot collects, uses, and protects your personal and
            financial information — whether you use our platform as an individual or as part of a business.
          </p>
        </header>

        <div className="prose prose-slate max-w-none space-y-12 text-[#3D3D3D]">
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">1. Who We Are</h2>
            <p className="leading-relaxed">
              FlowPilot is an AI-powered bulk payment platform designed for both individuals and
              businesses operating across Africa. We provide tools to automate, verify, and execute
              bulk payouts safely — from a freelancer paying a handful of contractors to an enterprise
              disbursing payroll at scale. We treat the privacy and security of your financial data
              as a foundational responsibility, not an afterthought.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <p>
                The data we collect depends on whether you use FlowPilot as an individual or as a business.
                In all cases, we only collect what is necessary to deliver our services and meet regulatory obligations.
              </p>

              <h3 className="text-base font-semibold text-[#0F0F0F]">For Individual Accounts</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Identity Information:</strong> Full legal name, date of birth, government-issued ID (NIN, BVN, or passport), and a selfie for identity verification.</li>
                <li><strong>Contact Details:</strong> Email address and phone number used for account access and notifications.</li>
                <li><strong>Financial Data:</strong> Bank account details, wallet balance, and payout history.</li>
                <li><strong>Operational Logs:</strong> A record of every payout run you initiate, including recipient details and approval decisions.</li>
              </ul>

              <h3 className="text-base font-semibold text-[#0F0F0F] mt-4">For Business Accounts</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Entity Information:</strong> Business name, CAC registration number, tax identification number (TIN), and director or authorised signatory details.</li>
                <li><strong>Operator Identities:</strong> Names, email addresses, and roles of team members granted platform access.</li>
                <li><strong>Financial Data:</strong> Bank account details, wallet balances, and payout records linked to the business.</li>
                <li><strong>Operational Logs:</strong> A complete audit trail of every supervised payout run, including goal definitions, AI agent actions, and approval history.</li>
                <li><strong>Communication:</strong> Interactions between operators and the platform during the review and approval process.</li>
              </ul>

              <h3 className="text-base font-semibold text-[#0F0F0F] mt-4">For All Users</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage &amp; Technical Data:</strong> Browser type, device information, IP address, login timestamps, feature usage, and API call logs.</li>
                <li><strong>Beneficiary Data:</strong> Names and bank account details of recipients you add to a payout run. You are responsible for having lawful authority to process this information.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">3. How We Use Your Information</h2>
            <div className="space-y-4">
              <p>We process your data to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Verify your identity and complete KYC/KYB requirements under applicable regulations.</li>
                <li>Operate and improve our bulk payment, reconciliation, and risk-scoring features.</li>
                <li>Execute payout runs on your instruction via our licensed payment infrastructure partners.</li>
                <li>Detect fraud, prevent money laundering, and enforce sanctions compliance.</li>
                <li>Send important service updates, transaction confirmations, and compliance notifications.</li>
                <li>Generate immutable audit reports for every completed payout run.</li>
                <li>Comply with legal and regulatory obligations under Nigerian law and applicable AML/CTF frameworks.</li>
              </ul>
              <p className="leading-relaxed">
                We do <strong>not</strong> sell your personal data or financial information to third parties,
                and we do not use your data to train third-party AI models.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">4. Supervised AI &amp; Data Processing</h2>
            <p className="leading-relaxed">
              FlowPilot uses AI agents to automate verification, reconciliation, and risk scoring. These
              agents process your data under strict human supervision — no payout executes without your
              explicit approval. Your data is used exclusively within your account context to improve
              the accuracy of outputs for your specific runs. AI outputs are advisory and do not constitute
              financial or compliance advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">5. Third-Party Integrations</h2>
            <p className="leading-relaxed">
              FlowPilot integrates with licensed payment infrastructure providers to facilitate account
              verification and payout execution. Data shared with these partners is limited to what is
              strictly necessary to fulfil your payout instructions and is subject to their own security
              and compliance standards. We do not share your data with advertising networks, data brokers,
              or analytics platforms beyond standard, anonymised product analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">6. Security &amp; Data Retention</h2>
            <p className="leading-relaxed">
              All data is encrypted using AES-256 at rest and TLS 1.3 in transit. We enforce multi-factor
              authentication, role-based access controls, and continuous audit logging. Because FlowPilot
              is &ldquo;audit-ready by default,&rdquo; we maintain an immutable record of all payout activity
              for a minimum of 7 years to comply with Nigerian financial record-keeping regulations, or
              longer where required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">7. Your Rights</h2>
            <div className="space-y-4">
              <p>
                Whether you are an individual or a business administrator, you have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access</strong> the personal data we hold about you.</li>
                <li><strong>Correct</strong> inaccurate or outdated information.</li>
                <li><strong>Export</strong> your operational logs and payout history.</li>
                <li><strong>Request deletion</strong> of your account and associated data, subject to mandatory financial record-keeping obligations.</li>
                <li><strong>Withdraw consent</strong> for optional data processing at any time.</li>
              </ul>
              <p className="leading-relaxed">
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:privacy@flowpilot.ai" className="text-[#e86727] hover:underline">privacy@flowpilot.ai</a>.
                We will respond within 14 business days.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">8. Cookies &amp; Tracking</h2>
            <p className="leading-relaxed">
              We use strictly necessary cookies to maintain your login session and platform security.
              We may also use anonymised analytics to understand how the platform is used and where
              to improve it. We do not use cookies for targeted advertising or cross-site tracking.
              You can manage cookie preferences through your browser settings, though disabling
              essential cookies will affect platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">9. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices
              or applicable law. We will notify you of material changes via email or in-app notification
              at least 14 days before they take effect. Your continued use of the platform after the
              effective date constitutes acceptance of the revised policy.
            </p>
          </section>

          <section className="pt-8 border-t border-[#D9D4C8]">
            <p className="text-sm font-semibold text-[#0F0F0F] mb-2">Privacy &amp; Security Contact</p>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              For privacy inquiries, data requests, or to report a security concern:
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                Privacy:{" "}
                <a href="mailto:privacy@flowpilot.ai" className="text-[#e86727] hover:underline">
                  privacy@flowpilot.ai
                </a>
              </li>
              <li>
                Security:{" "}
                <a href="mailto:security@flowpilot.ai" className="text-[#e86727] hover:underline">
                  security@flowpilot.ai
                </a>
              </li>
            </ul>
          </section>
        </div>
      </article>

      <LandingFooter />
    </main>
  );
}
