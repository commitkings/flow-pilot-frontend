import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#0F0F0F]">
      <LandingNav />

      <article className="mx-auto max-w-3xl px-6 py-20 md:py-32">
        <header className="mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm font-medium text-[#6B6B6B]">
            Effective Date: April 16, 2026 &nbsp;·&nbsp; Last Updated: April 16, 2026
          </p>
          <p className="mt-3 text-sm text-[#6B6B6B] leading-relaxed">
            Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using the FlowPilot
            platform. By accessing or using FlowPilot, you agree to be bound by these Terms and our
            Privacy Policy. If you do not agree, you must not use the platform.
          </p>
        </header>

        <div className="prose prose-slate max-w-none space-y-12 text-[#3D3D3D]">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">1. About FlowPilot</h2>
            <p className="leading-relaxed">
              FlowPilot is an AI-powered bulk payment platform that enables both individuals and
              organisations (&ldquo;Users&rdquo;) to automate, verify, and execute payouts at scale —
              from a single person paying contractors to a business disbursing payroll across an entire team.
              FlowPilot integrates with licensed payment infrastructure providers to facilitate fund
              disbursement. FlowPilot is <strong>not</strong> a bank, payment processor, or licensed
              financial institution. All fund movements are executed through third-party licensed payment partners.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">2. Eligibility &amp; Account Registration</h2>
            <div className="space-y-4">
              <p className="leading-relaxed">
                FlowPilot is available to two account types:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Individual Accounts:</strong> You must be a natural person who is 18 years of age
                  or older, resident or operating in an eligible jurisdiction, and able to successfully
                  complete our Know Your Customer (&ldquo;KYC&rdquo;) verification process.
                </li>
                <li>
                  <strong>Business Accounts:</strong> You must be a registered legal business entity, have
                  at least one authorised account owner who is 18 years of age or older, and successfully
                  complete our Know Your Customer (&ldquo;KYC&rdquo;) and Know Your Business (&ldquo;KYB&rdquo;)
                  verification process.
                </li>
              </ul>
              <p className="leading-relaxed">
                In all cases, you must not be prohibited by applicable law from using financial services
                platforms, and you must not be on any sanctions list maintained by relevant authorities.
              </p>
              <p className="leading-relaxed">
                You are responsible for maintaining the confidentiality of your credentials. You must
                immediately notify us at{" "}
                <a href="mailto:security@flowpilot.ai" className="text-[#e86727] hover:underline">security@flowpilot.ai</a>{" "}
                if you suspect any unauthorised access to your account. FlowPilot shall not be liable
                for any loss arising from unauthorised access resulting from your failure to safeguard
                your credentials.
              </p>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">3. KYC / KYB Verification &amp; Compliance</h2>
            <div className="space-y-4">
              <p className="leading-relaxed">
                Access to payout execution, wallet top-up, scheduled payouts, and AI credit features
                requires a <strong>verified</strong> account status. For individuals, this means passing
                KYC verification (government-issued ID, BVN/NIN, and biometric check). For business
                accounts, this includes both KYC for authorised signatories and KYB verification of the
                business entity. FlowPilot reserves the right to suspend, restrict, or permanently
                terminate access to any account that fails verification, provides false or misleading
                information, or is flagged by our compliance systems or regulatory authorities.
              </p>
              <p className="leading-relaxed">
                You agree to provide accurate, current, and complete information during verification and
                to promptly update this information if it changes. FlowPilot may request additional
                documentation at any time to comply with applicable anti-money laundering (AML),
                counter-terrorism financing (CTF), and other applicable regulations.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">4. Account Tiers &amp; Transaction Limits</h2>
            <div className="space-y-4">
              <p className="leading-relaxed">
                FlowPilot operates a tiered account system. Transaction limits apply based on your
                account type and verification level:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Individual (Verified):</strong> Subject to a monthly payout limit of ₦300,000.
                  Aggregate per-run limits apply as determined by our compliance engine.
                </li>
                <li>
                  <strong>Business (Verified):</strong> Subject to a monthly payout limit of ₦1,500,000
                  or as otherwise agreed in writing. Limits may be reviewed upon request with supporting
                  documentation.
                </li>
              </ul>
              <p className="leading-relaxed">
                FlowPilot reserves the right to modify tier limits at any time with reasonable notice
                to comply with regulatory requirements or risk management policies.
              </p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">5. Human-in-the-Loop Mandate</h2>
            <p className="leading-relaxed">
              FlowPilot operates on a strict <strong>Human-in-the-Loop</strong> principle. AI agents
              assist with reconciliation, risk scoring, and candidate analysis, but <strong>no payout
              can execute without your explicit approval</strong>. You acknowledge and agree that the
              final legal and financial responsibility for every approved payout rests solely with you
              as the account holder or your designated approvers. FlowPilot&apos;s AI outputs are
              advisory in nature and do not constitute a guarantee of accuracy or appropriateness.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">6. Wallet, Payments &amp; Fees</h2>
            <div className="space-y-4">
              <p className="leading-relaxed">
                FlowPilot maintains an internal wallet ledger on your behalf. Wallet balances are
                pre-funded and are not held in a separate trust account. You acknowledge:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Wallet funds are used to settle payout disbursements on your instruction.</li>
                <li>
                  A <strong>platform fee of 0.2% of the total payout value</strong> is charged per
                  executed payout run and deducted from your wallet balance automatically upon execution.
                </li>
                <li>
                  AI processing credits are consumed at the rate of <strong>1 credit per payout run</strong>,
                  including reruns. Credits are non-refundable once consumed.
                </li>
                <li>FlowPilot reserves the right to modify its fee structure with 30 days&apos; written notice.</li>
                <li>
                  FlowPilot is not responsible for payout failures caused by insufficient recipient account
                  details, third-party bank outages, or network interruptions.
                </li>
              </ul>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">7. Data Collection &amp; Privacy</h2>
            <div className="space-y-4">
              <p className="leading-relaxed">We collect and process data appropriate to your account type, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Identity data:</strong> For individuals — full name, date of birth, government ID,
                  BVN/NIN, and biometric data. For businesses — entity name, registration number, TIN,
                  director details, and authorised signatory identities.
                </li>
                <li>
                  <strong>User data:</strong> Email addresses, phone numbers, login timestamps, and
                  IP addresses of account holders and team members.
                </li>
                <li>
                  <strong>Payout data:</strong> Beneficiary names, bank account numbers, payment amounts,
                  purposes, and risk assessments associated with your payout runs.
                </li>
                <li>
                  <strong>Transactional data:</strong> Wallet top-up history, payout execution records,
                  platform fee logs, and AI credit usage.
                </li>
                <li>
                  <strong>Usage &amp; technical data:</strong> Browser type, device information, feature
                  usage, API call logs, and audit trails generated during platform use.
                </li>
              </ul>
              <p className="leading-relaxed">
                We process this data to (a) deliver and improve our services; (b) comply with legal and
                regulatory obligations; (c) detect fraud and maintain platform security; and (d) communicate
                important service updates. We do not sell your personal data to third parties. Data is retained
                for a minimum of 7 years to comply with financial recordkeeping requirements, or longer where
                required by law. For full details, see our{" "}
                <a href="/privacy" className="text-[#e86727] hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">8. Data Security</h2>
            <p className="leading-relaxed">
              FlowPilot employs industry-standard security measures including encryption at rest and in
              transit, role-based access controls, multi-factor authentication enforcement, and continuous
              audit logging. However, no system is completely secure. You agree that FlowPilot shall not
              be liable for any breach of security or unauthorised access that is beyond our reasonable
              control, provided we have implemented reasonable safeguards. You must report any suspected
              security incidents to{" "}
              <a href="mailto:security@flowpilot.ai" className="text-[#e86727] hover:underline">security@flowpilot.ai</a>{" "}
              immediately.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">9. Acceptable Use</h2>
            <div className="space-y-4">
              <p className="leading-relaxed">You must not use FlowPilot to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Execute payouts for illegal, fraudulent, or money-laundering purposes.</li>
                <li>Pay individuals or entities on any sanctioned persons or entities list.</li>
                <li>Attempt to bypass, reverse-engineer, or exploit any security or approval control.</li>
                <li>Share account credentials with unauthorised persons.</li>
                <li>Upload beneficiary data that you do not have legal authority to process.</li>
                <li>Misrepresent your account type, identity, or the nature of your payout activity.</li>
              </ul>
              <p className="leading-relaxed">
                Violation of this policy may result in immediate account suspension, fund freezing, and
                referral to relevant regulatory or law enforcement authorities.
              </p>
            </div>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">10. AI &amp; Risk Scoring Disclaimer</h2>
            <p className="leading-relaxed">
              Risk scores, reconciliation results, and recommendations produced by FlowPilot&apos;s AI agents
              are generated using statistical models and are provided <strong>&ldquo;as-is&rdquo;</strong>. They
              do not constitute professional financial, legal, or compliance advice. FlowPilot makes no
              warranty that AI outputs are free from error. You remain solely responsible for reviewing AI
              recommendations and exercising independent judgement before approving any payout.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">11. Limitation of Liability</h2>
            <div className="space-y-4">
              <p className="leading-relaxed">
                To the maximum extent permitted by applicable law, FlowPilot and its officers, directors,
                employees, and affiliates shall not be liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Any indirect, incidental, special, consequential, or punitive damages.</li>
                <li>Loss of profits, data, goodwill, or business opportunity.</li>
                <li>Payout failures caused by third-party banking infrastructure outages.</li>
                <li>Erroneous payouts approved by you or your authorised team members.</li>
                <li>
                  Any loss arising from your failure to maintain adequate internal controls or approval
                  workflows.
                </li>
              </ul>
              <p className="leading-relaxed">
                FlowPilot&apos;s total aggregate liability to you for any claim arising from or related to
                these Terms or your use of the platform shall not exceed the total fees paid by you to
                FlowPilot in the <strong>three (3) months</strong> preceding the event giving rise to the claim.
              </p>
            </div>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">12. Indemnification</h2>
            <p className="leading-relaxed">
              You agree to indemnify, defend, and hold harmless FlowPilot and its affiliates from any
              claims, damages, liabilities, and expenses (including reasonable legal fees) arising from:
              (a) your use of the platform in violation of these Terms; (b) your breach of any applicable
              law or regulation; (c) payouts approved by you or your team; or (d) any dispute with a
              beneficiary or third party relating to a payout you initiated.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">13. Service Availability</h2>
            <p className="leading-relaxed">
              FlowPilot targets 99.5% platform uptime but does not guarantee uninterrupted availability.
              Scheduled maintenance, third-party infrastructure failures, regulatory interventions, or
              events beyond our control may result in temporary unavailability. FlowPilot shall not be
              liable for any losses incurred during platform downtime.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">14. Termination</h2>
            <p className="leading-relaxed">
              Either party may terminate access to FlowPilot with 30 days&apos; written notice. FlowPilot
              may terminate or suspend access immediately without notice if you breach these Terms,
              fail KYC/KYB requirements, are subject to a legal or regulatory order, or pose a risk
              of harm to the platform or other users. Upon termination, outstanding wallet balances
              (net of any fees owed) will be returned to your registered bank account within
              30 business days, subject to any legal holds.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">15. Governing Law &amp; Dispute Resolution</h2>
            <p className="leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the Federal
              Republic of Nigeria. Any dispute arising from these Terms shall first be subject to good-faith
              negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration
              in accordance with the Arbitration and Mediation Act 2023 (Nigeria). The arbitration shall
              take place in Lagos, Nigeria, and the language of the proceedings shall be English.
            </p>
          </section>

          {/* 16 */}
          <section>
            <h2 className="text-xl font-bold text-[#0F0F0F] mb-4">16. Changes to These Terms</h2>
            <p className="leading-relaxed">
              FlowPilot reserves the right to update these Terms at any time. We will notify you of
              material changes via email or in-app notification at least 14 days before the changes take
              effect. Continued use of the platform after the effective date constitutes acceptance of
              the revised Terms.
            </p>
          </section>

          {/* Contact */}
          <section className="pt-8 border-t border-[#D9D4C8]">
            <p className="text-sm font-semibold text-[#0F0F0F] mb-2">Contact &amp; Legal Inquiries</p>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              For questions about these Terms or to exercise your data rights, contact us at:
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                Legal:{" "}
                <a href="mailto:legal@flowpilot.ai" className="text-[#e86727] hover:underline">
                  legal@flowpilot.ai
                </a>
              </li>
              <li>
                Security:{" "}
                <a href="mailto:security@flowpilot.ai" className="text-[#e86727] hover:underline">
                  security@flowpilot.ai
                </a>
              </li>
              <li>
                Privacy:{" "}
                <a href="mailto:privacy@flowpilot.ai" className="text-[#e86727] hover:underline">
                  privacy@flowpilot.ai
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
