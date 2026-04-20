import "server-only";
/**
 * Branded transactional email via Resend.
 *
 * When RESEND_API_KEY is set, this module sends custom HTML emails so users
 * see the Vibe Check brand instead of bare Supabase templates.
 *
 * When the key is absent the module throws so callers can fall back to the
 * native Supabase OTP flow.
 */

import { Resend } from "resend";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "email" });

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

/** The "From" address. Use a verified Resend domain in production. */
const FROM =
  process.env.EMAIL_FROM ?? "Vibe Check <noreply@vibecheck.app>";

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

function magicLinkHtml(magicUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to Vibe Check</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">

          <!-- Header / Brand -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #1f1f1f;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="width:40px;height:40px;background:#f97316;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;text-align:center;line-height:40px;font-size:20px;">✦</div>
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <div style="font-size:18px;font-weight:700;color:#ffffff;line-height:1.2;">Vibe Check</div>
                    <div style="font-size:12px;color:#666;line-height:1.2;margin-top:2px;">Pressure-test your app idea</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">
                Your sign-in link ✦
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#888;line-height:1.6;">
                Click the button below to sign in. This link expires in 1 hour and can only be used once.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#f97316;border-radius:10px;">
                    <a href="${magicUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
                      Sign in to Vibe Check →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
                <tr>
                  <td style="border-top:1px solid #1f1f1f;font-size:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Feature reminder -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="33%" style="padding-right:8px;vertical-align:top;">
                    <div style="background:#1a1a1a;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:20px;margin-bottom:8px;">🔍</div>
                      <div style="font-size:12px;font-weight:600;color:#ffffff;margin-bottom:4px;">Web Research</div>
                      <div style="font-size:11px;color:#555;line-height:1.4;">Scans the web for real competitors</div>
                    </div>
                  </td>
                  <td width="33%" style="padding:0 4px;vertical-align:top;">
                    <div style="background:#1a1a1a;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:20px;margin-bottom:8px;">🎯</div>
                      <div style="font-size:12px;font-weight:600;color:#ffffff;margin-bottom:4px;">AI Scoring</div>
                      <div style="font-size:11px;color:#555;line-height:1.4;">Scores viability, market fit &amp; more</div>
                    </div>
                  </td>
                  <td width="33%" style="padding-left:8px;vertical-align:top;">
                    <div style="background:#1a1a1a;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:20px;margin-bottom:8px;">🚀</div>
                      <div style="font-size:12px;font-weight:600;color:#ffffff;margin-bottom:4px;">Action Plan</div>
                      <div style="font-size:11px;color:#555;line-height:1.4;">MVP roadmap &amp; tech stack picks</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #1f1f1f;background:#0f0f0f;">
              <p style="margin:0;font-size:12px;color:#444;line-height:1.5;text-align:center;">
                If you didn't request this, you can safely ignore this email.<br />
                We only use your email to authenticate you — no marketing, ever.
              </p>
            </td>
          </tr>

        </table>

        <p style="margin:24px 0 0;font-size:11px;color:#333;text-align:center;">
          Powered by Vibe Check · <a href="${magicUrl}" style="color:#f97316;text-decoration:none;">Can't click the button? Use this link</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function magicLinkText(magicUrl: string): string {
  return `Sign in to Vibe Check

Click the link below to sign in. It expires in 1 hour and can only be used once.

${magicUrl}

If you didn't request this, you can safely ignore this email.
We only use your email to authenticate you — no marketing, ever.

— Vibe Check`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function sendMagicLinkEmail(
  to: string,
  magicUrl: string
): Promise<void> {
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Vibe Check sign-in link",
    html: magicLinkHtml(magicUrl),
    text: magicLinkText(magicUrl),
  });

  if (error) {
    log.error({ err: error, to }, "Failed to send magic link email via Resend");
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  log.info({ to }, "Magic link email sent via Resend");
}

export async function sendReportEmail(
  to: string,
  reportUrl: string,
  verdict: string,
  verdictLabel: string,
  overallScore: number,
  summary: string
): Promise<void> {
  const resend = getResend();

  const scoreColor = overallScore >= 7.5 ? "#10b981" : overallScore >= 5 ? "#f59e0b" : "#ef4444";

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#fafaf9;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
  <tr><td style="padding:32px 32px 0;">
    <div style="color:#f97316;font-size:12px;font-weight:600;margin-bottom:8px;">VIBE CHECK REPORT</div>
    <h1 style="margin:0 0 8px;font-size:24px;color:#18181b;">${verdictLabel}</h1>
    <p style="margin:0 0 20px;color:#71717a;font-size:14px;line-height:1.5;">${summary}</p>
  </td></tr>
  <tr><td style="padding:0 32px 24px;">
    <div style="display:inline-block;padding:6px 16px;border-radius:999px;background:${scoreColor};color:#fff;font-size:14px;font-weight:600;">
      Score: ${overallScore.toFixed(1)}/10
    </div>
  </td></tr>
  <tr><td style="padding:0 32px 32px;">
    <a href="${reportUrl}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      View full report
    </a>
  </td></tr>
  <tr><td style="padding:16px 32px;border-top:1px solid #e4e4e7;color:#a1a1aa;font-size:11px;">
    Sent by Vibe Check &mdash; AI startup idea validator
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = `Vibe Check Report: ${verdictLabel}\n\nScore: ${overallScore.toFixed(1)}/10\n\n${summary}\n\nView full report: ${reportUrl}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Vibe Check: ${verdictLabel} (${overallScore.toFixed(1)}/10)`,
    html,
    text,
  });

  if (error) {
    log.error({ err: error, to }, "Failed to send report email");
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  log.info({ to }, "Report email sent");
}
