import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | LinkFlow AI',
  description: 'How LinkFlow AI collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-slate-300">
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-slate-500 mb-10">Effective date: March 18, 2026 · Last updated: March 18, 2026</p>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white">1. Who We Are</h2>
        <p>LinkFlow AI (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the LinkFlow AI platform at&nbsp;
          <a href="https://linkflow.ai" className="text-cyan-400 underline">linkflow.ai</a>.
          We are a SaaS company providing AI-powered backlink automation services.
        </p>

        <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Account data:</strong> name, email address, OAuth provider ID.</li>
          <li><strong>Task data:</strong> URLs, anchor text, article content you submit.</li>
          <li><strong>Usage data:</strong> task logs, IP address, browser type, timestamps.</li>
          <li><strong>Payment data:</strong> processed by Creem (we do not store card numbers).</li>
        </ul>

        <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>To operate and deliver the backlink automation service.</li>
          <li>To send transactional emails (task completion, 2FA alerts, failures).</li>
          <li>To improve platform reliability and debug issues.</li>
          <li>To comply with legal obligations.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white">4. Data Sharing</h2>
        <p>We do not sell your data. We share data only with:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Neon (database):</strong> task and user storage.</li>
          <li><strong>Cloudinary:</strong> screenshot proof storage.</li>
          <li><strong>Resend:</strong> transactional email delivery.</li>
          <li><strong>OpenAI:</strong> article content for AI processing (no PII sent).</li>
          <li><strong>Creem:</strong> payment processing.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white">5. Data Retention</h2>
        <p>Task records are retained for 12 months. Account data is retained until you
          delete your account. Screenshots are retained for 90 days.</p>

        <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
        <p>You may request access, correction, or deletion of your data at any time.
          Email <a href="mailto:privacy@linkflow.ai" className="text-cyan-400 underline">privacy@linkflow.ai</a>.
        </p>

        <h2 className="text-xl font-semibold text-white">7. Cookies</h2>
        <p>We use session cookies for authentication (NextAuth.js) only.
          No third-party advertising cookies are used.</p>

        <h2 className="text-xl font-semibold text-white">8. Contact</h2>
        <p>For privacy questions: <a href="mailto:privacy@linkflow.ai" className="text-cyan-400 underline">privacy@linkflow.ai</a></p>
      </section>
    </main>
  );
}


