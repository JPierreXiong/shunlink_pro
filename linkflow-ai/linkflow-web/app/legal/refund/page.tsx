import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy | LinkFlow AI',
  description: 'Our credit refund and billing policy for LinkFlow AI.',
};

export default function RefundPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-slate-300">
      <h1 className="text-3xl font-bold text-white mb-2">Refund Policy</h1>
      <p className="text-slate-500 mb-10">Effective date: March 18, 2026 · Last updated: March 18, 2026</p>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white">1. Automatic Credit Refunds</h2>
        <p>LinkFlow AI automatically refunds credits to your account in the following cases:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Task failure after 3 retries:</strong> 1 credit refunded automatically.</li>
          <li><strong>Platform unavailability:</strong> if a platform is taken offline, credits for affected tasks are refunded.</li>
          <li><strong>Deadline expiry:</strong> tasks that exceed their 48-hour processing window are refunded.</li>
        </ul>
        <p>Refunds appear in your credit balance within minutes and are visible on your dashboard.</p>

        <h2 className="text-xl font-semibold text-white">2. Cash Refunds</h2>
        <p>Cash refunds for purchased credit packs are available within <strong>7 days</strong> of
          purchase, provided fewer than 20% of credits in that pack have been consumed.
          To request a cash refund, email <a href="mailto:billing@linkflow.ai" className="text-cyan-400 underline">billing@linkflow.ai</a> with
          your order ID.
        </p>

        <h2 className="text-xl font-semibold text-white">3. Non-Refundable Cases</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Tasks that completed successfully (live URL provided).</li>
          <li>Credits consumed on tasks where 2FA was required but not provided within 24 hours.</li>
          <li>Accounts terminated for Terms of Service violations.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white">4. Subscription Plans</h2>
        <p>Monthly subscription fees are non-refundable once a billing cycle has begun.
          You may cancel at any time to prevent future charges — cancellation takes
          effect at the end of the current billing period.
        </p>

        <h2 className="text-xl font-semibold text-white">5. How to Request</h2>
        <p>Email <a href="mailto:billing@linkflow.ai" className="text-cyan-400 underline">billing@linkflow.ai</a> with:
          your account email, order ID (from Creem receipt), and the reason for the refund.
          We respond within 2 business days.
        </p>
      </section>
    </main>
  );
}


