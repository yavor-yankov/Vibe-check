import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Privacy Policy – Vibe Check",
  description: "Privacy Policy for Vibe Check",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Nav */}
      <nav className="border-b border-[color:var(--border)] bg-[color:var(--background)]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="w-7 h-7 rounded-lg bg-[color:var(--accent)] flex items-center justify-center text-white">
              <Sparkles size={14} />
            </span>
            Vibe Check
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Privacy Policy</h1>
        <p className="text-[color:var(--muted)] mb-10">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="prose prose-neutral max-w-none space-y-8 text-[color:var(--foreground)]">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. What We Collect</h2>
            <p className="text-[color:var(--muted)] leading-relaxed mb-3">
              We collect the minimum data necessary to provide the Service:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[color:var(--muted)]">
              <li><strong>Account data:</strong> email address (used only for authentication)</li>
              <li><strong>Session data:</strong> the idea descriptions and conversation history you input</li>
              <li><strong>Usage data:</strong> how many vibe checks you have run this month</li>
              <li><strong>Billing data:</strong> Stripe customer ID and subscription status (we never store card numbers)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use It</h2>
            <ul className="list-disc list-inside space-y-1 text-[color:var(--muted)]">
              <li>To authenticate you and maintain your session</li>
              <li>To send your idea through our AI pipeline (Google Gemini) and web search (Tavily)</li>
              <li>To enforce monthly usage quotas and process payments</li>
              <li>To improve the reliability and quality of the Service</li>
            </ul>
            <p className="text-[color:var(--muted)] leading-relaxed mt-3">
              We do not sell your data, use it for advertising, or share it with third parties other than the
              processors listed below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Third-Party Processors</h2>
            <ul className="list-disc list-inside space-y-1 text-[color:var(--muted)]">
              <li><strong>Supabase</strong> — database and authentication (EU data residency available)</li>
              <li><strong>Google Gemini</strong> — AI language model for idea analysis</li>
              <li><strong>Tavily</strong> — web search for competitor discovery</li>
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Vercel</strong> — hosting and edge network</li>
            </ul>
            <p className="text-[color:var(--muted)] leading-relaxed mt-3">
              Each processor operates under their own privacy policies and data processing agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              Your session data is retained as long as your account is active, or until you delete it. You can
              delete individual sessions from within the app. Deleting your account removes all associated data
              within 30 days. Web search cache entries expire automatically after 7 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Cookies and Local Storage</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              We use HTTP-only cookies strictly for authentication (Supabase session tokens). We do not use
              tracking cookies or third-party analytics pixels. No advertising cookies are set.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              Depending on your jurisdiction you may have rights to access, correct, delete, or export your
              personal data. To exercise any of these rights, email{" "}
              <a href="mailto:privacy@vibe-check.app" className="text-[color:var(--accent)] hover:underline">
                privacy@vibe-check.app
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Security</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              All data is encrypted in transit (TLS) and at rest. Server-side operations use a scoped
              service-role key that bypasses row-level security only for administrative operations (e.g.,
              usage accounting). User data is isolated via Postgres RLS — a user can only read and write
              their own rows.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Children</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              The Service is not directed at children under 13. We do not knowingly collect personal
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              We may update this policy periodically. Material changes will be communicated via email or
              in-app notice at least 14 days before they take effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              Privacy questions? Email{" "}
              <a href="mailto:privacy@vibe-check.app" className="text-[color:var(--accent)] hover:underline">
                privacy@vibe-check.app
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[color:var(--border)] flex gap-4 text-sm text-[color:var(--muted)]">
          <Link href="/" className="hover:text-[color:var(--foreground)] transition">← Home</Link>
          <Link href="/terms" className="hover:text-[color:var(--foreground)] transition">Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}
