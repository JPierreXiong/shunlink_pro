import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | LinkFlow AI',
  description: 'Terms governing your use of the LinkFlow AI platform.',
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-slate-300">
      <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-slate-500 mb-10">Effective date: March 18, 2026 · Last updated: March 18, 2026</p>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white">1. Acceptance</h2>
        <p>By accessing or using LinkFlow AI, you agree to these Terms. If you do not agree,
          do not use the service.</p>

        <h2 className="text-xl font-semibold text-white">2. Service Description</h2>
        <p>LinkFlow AI provides an AI-powered platform that automates the submission of
          backlinks to public Web 2.0 platforms on your behalf. Results depend on
          third-party platform availability and policies.</p>

        <h2 className="text-xl font-semibold text-white">3. Acceptable Use</h2>
        <p>You agree NOT to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Submit URLs that violate any applicable law or platform terms.</li>
          <li>Use the service to promote spam, malware, or harmful content.</li>
          <li>Attempt to reverse-engineer or abuse the platform infrastructure.</li>
          <li>Share account credentials with unauthorized parties.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white">4. Credits and Payments</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Each successfully initiated task consumes 1 credit.</li>
          <li>Credits are refunded automatically if a task fails after all retries.</li>
          <li>All purchases are subject to our <a href="/legal/refund" className="text-cyan-400 underline">Refund Policy</a>.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white">5. No Guarantee of Results</h2>
        <p>We do not guarantee that any backlink submission will result in improved
          search engine rankings. SEO outcomes depend on many external factors
          outside our control. We guarantee task execution — not SEO results.</p>

        <h2 className="text-xl font-semibold text-white">6. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, LinkFlow AI shall not be liable
          for any indirect, incidental, special, or consequential damages arising
          from your use of the service. Our total liability shall not exceed the
          amount you paid in the 30 days prior to the claim.</p>

        <h2 className="text-xl font-semibold text-white">7. Termination</h2>
        <p>We may suspend or terminate accounts that violate these Terms. Upon
          termination, unused credits will be refunded at our discretion.</p>

        <h2 className="text-xl font-semibold text-white">8. Modifications</h2>
        <p>We may update these Terms at any time. Continued use of the service
          after changes constitutes acceptance of the new Terms.</p>

        <h2 className="text-xl font-semibold text-white">9. Governing Law</h2>
        <p>These Terms are governed by the laws of the applicable jurisdiction.
          Disputes shall be resolved by binding arbitration.</p>

        <h2 className="text-xl font-semibold text-white">10. Contact</h2>
        <p>For legal questions: <a href="mailto:legal@linkflow.ai" className="text-cyan-400 underline">legal@linkflow.ai</a></p>
      </section>
    </main>
  );
}
