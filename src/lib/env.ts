/**
 * Centralized environment variable validation.
 *
 * Import this module early (e.g., in instrumentation) to fail-fast on
 * missing critical configuration rather than discovering it when a user
 * hits the relevant flow.
 */

interface EnvVarSpec {
  name: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVarSpec[] = [
  // Required — app won't function without these
  { name: "GROQ_API_KEY", required: true, description: "Groq API key for LLM" },
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true, description: "Supabase project URL" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, description: "Supabase anon key" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true, description: "Supabase service role key" },
  { name: "STRIPE_SECRET_KEY", required: true, description: "Stripe API secret key" },
  { name: "STRIPE_WEBHOOK_SECRET", required: true, description: "Stripe webhook signing secret" },
  { name: "STRIPE_PRICE_PRO", required: true, description: "Stripe price ID for Pro plan" },
  { name: "STRIPE_PRICE_LIFETIME", required: true, description: "Stripe price ID for Lifetime plan" },
  { name: "NEXT_PUBLIC_APP_URL", required: true, description: "Canonical app URL for redirects" },

  // Optional — gracefully degraded when absent
  { name: "TAVILY_API_KEY", required: false, description: "Tavily API key (falls back to DuckDuckGo)" },
  { name: "UPSTASH_REDIS_REST_URL", required: false, description: "Upstash Redis URL for rate limiting" },
  { name: "UPSTASH_REDIS_REST_TOKEN", required: false, description: "Upstash Redis token" },
  { name: "RESEND_API_KEY", required: false, description: "Resend API key for branded emails" },
  { name: "EMAIL_FROM", required: false, description: "Email sender address" },
  { name: "NEXT_PUBLIC_SENTRY_DSN", required: false, description: "Sentry DSN for error tracking" },
];

/**
 * Validate all environment variables. Throws if any required vars are missing.
 * Logs warnings for missing optional vars.
 */
export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const spec of ENV_VARS) {
    const value = process.env[spec.name];
    if (!value || value === "placeholder") {
      if (spec.required) {
        missing.push(`  - ${spec.name}: ${spec.description}`);
      } else {
        warnings.push(`  - ${spec.name}: ${spec.description}`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `[env] Optional environment variables not set (features gracefully disabled):\n${warnings.join("\n")}`
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join("\n")}\n\nSee .env.example for setup instructions.`
    );
  }
}
