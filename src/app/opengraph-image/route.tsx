/**
 * Dynamic Open Graph image for Vibe Check.
 * Rendered by @vercel/og at /opengraph-image — used as the default og:image
 * for all pages that don't override it.
 *
 * To preview locally: GET http://localhost:3000/opengraph-image
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "200px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)",
          }}
        />

        {/* Emoji badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "32px",
            background: "rgba(99,102,241,0.2)",
            border: "1px solid rgba(99,102,241,0.4)",
            borderRadius: "100px",
            padding: "8px 20px",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "24px" }}>✅</span>
          <span
            style={{
              fontSize: "18px",
              color: "#a5b4fc",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            AI-POWERED IDEA VALIDATOR
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "#f8fafc",
            lineHeight: 1.1,
            marginBottom: "24px",
            maxWidth: "800px",
          }}
        >
          Does your app idea
          <br />
          <span style={{ color: "#818cf8" }}>pass the vibe check?</span>
        </div>

        {/* Sub-heading */}
        <div
          style={{
            fontSize: "28px",
            color: "#94a3b8",
            maxWidth: "700px",
            lineHeight: 1.5,
            marginBottom: "48px",
          }}
        >
          AI coach that pressure-tests your idea, scans competitors, and scores viability — in minutes.
        </div>

        {/* Stat pills */}
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            { emoji: "🤖", label: "AI Interview" },
            { emoji: "🔍", label: "Competitor Scan" },
            { emoji: "📊", label: "Viability Score" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                padding: "10px 20px",
              }}
            >
              <span style={{ fontSize: "20px" }}>{item.emoji}</span>
              <span style={{ fontSize: "18px", color: "#e2e8f0", fontWeight: 600 }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Domain watermark */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "80px",
            fontSize: "20px",
            color: "#475569",
            fontWeight: 500,
          }}
        >
          vibecheck.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
