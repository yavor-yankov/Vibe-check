import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Terms of Service – Vibe Check",
  description: "Terms of Service for Vibe Check",
};

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold tracking-tight mb-3">Terms of Service</h1>
        <p className="text-[color:var(--muted)] mb-10">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="prose prose-neutral max-w-none space-y-8 text-[color:var(--foreground)]">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              By accessing or using Vibe Check (&ldquo;Service&rdquo;), you agree to be bound by these Terms of
              Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              Vibe Check is an AI-powered tool that helps founders and entrepreneurs evaluate app ideas through
              a Socratic interview, competitive analysis, and scored report. The Service is provided &ldquo;as
              is&rdquo; and the output is informational only — it does not constitute business, legal, or
              financial advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              You must create an account to use the Service. You are responsible for maintaining the
              confidentiality of your account and for all activities under your account. You agree to provide
              accurate information and to notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Subscription and Billing</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              Paid plans are billed through Stripe. You may cancel at any time; cancellation takes effect at
              the end of the current billing period. We reserve the right to change pricing with 30 days&apos;
              notice. All fees are non-refundable except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Acceptable Use</h2>
            <p className="text-[color:var(--muted)] leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 text-[color:var(--muted)]">
              <li>Attempt to circumvent usage limits or rate limiting</li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Reverse-engineer or copy the Service&apos;s underlying AI prompts</li>
              <li>Resell or sublicense access to the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              You retain ownership of the ideas and content you submit. You grant us a limited license to
              process that content for the sole purpose of providing the Service. We do not use your ideas to
              train AI models or share them with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Disclaimer of Warranties</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied,
              including but not limited to merchantability, fitness for a particular purpose, or non-infringement.
              AI-generated analysis may be inaccurate or incomplete.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
              special, or consequential damages arising out of your use of the Service, even if advised of the
              possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              We may update these Terms at any time. Continued use of the Service after changes constitutes
              acceptance of the new Terms. We will notify users of material changes via email or in-app notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
            <p className="text-[color:var(--muted)] leading-relaxed">
              Questions about these Terms? Email us at{" "}
              <a href="mailto:hello@vibe-check.app" className="text-[color:var(--accent)] hover:underline">
                hello@vibe-check.app
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[color:var(--border)] flex gap-4 text-sm text-[color:var(--muted)]">
          <Link href="/" className="hover:text-[color:var(--foreground)] transition">← Home</Link>
          <Link href="/privacy" className="hover:text-[color:var(--foreground)] transition">Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}
