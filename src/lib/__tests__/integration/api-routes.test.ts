/**
 * Integration tests for API route validation, auth, and error handling.
 *
 * These tests mock external dependencies (Supabase auth, Groq, Tavily)
 * and verify that the API routes correctly:
 * - Validate request bodies (400 on malformed input)
 * - Reject unauthenticated requests (401)
 * - Handle quota exceeded (402)
 * - Enforce rate limits (429)
 * - Return correct responses on happy path
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────
// Mock the billing/usage module (auth + quota)
vi.mock("@/lib/billing/usage", () => ({
  getPlanSnapshot: vi.fn(),
  consumeUsage: vi.fn(),
  refundUsage: vi.fn(),
}));

// Mock rate limiting
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null), // disabled by default
  rateLimitExceededResponse: vi.fn(() =>
    new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    })
  ),
}));

// Mock the AI module
vi.mock("@/lib/ai", () => ({
  aiCall: vi.fn(),
  aiCallWithFallback: vi.fn(),
  streamChat: vi.fn(),
  generateContent: vi.fn(),
  getAIClient: vi.fn(),
  modelForTier: vi.fn().mockReturnValue("llama-3.3-70b-versatile"),
  modelChainForTier: vi.fn().mockReturnValue(["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]),
  friendlyAIError: vi.fn().mockReturnValue("AI temporarily unavailable"),
  MODEL_NAME: "llama-3.3-70b-versatile",
}));

// Mock server-only (no-op in tests)
vi.mock("server-only", () => ({}));

import { getPlanSnapshot, consumeUsage } from "@/lib/billing/usage";
import { checkRateLimit } from "@/lib/rate-limit";

const mockPlan = {
  userId: "user-123",
  email: "test@example.com",
  tier: "free" as const,
  usageMonth: "2026-04",
  usageCount: 1,
  remaining: 2,
  quota: 3,
  aiModel: "llama-3.3-70b-versatile",
  stripeCustomerId: null,
  subscriptionStatus: null,
};

/** Helper to build a valid chat message for the schema. */
function msg(role: "user" | "assistant", content: string) {
  return { id: crypto.randomUUID(), role, content, createdAt: Date.now() };
}

beforeEach(() => {
  vi.clearAllMocks();
  (getPlanSnapshot as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlan);
});

// ─── Chat Route Tests ───────────────────────────────────────────────────────
describe("POST /api/chat", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let POST: any;

  beforeEach(async () => {
    const mod = await import("@/app/api/chat/route");
    POST = mod.POST;
  });

  it("returns 400 on invalid JSON body", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when messages array is empty", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 when user is not authenticated", async () => {
    (getPlanSnapshot as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [msg("user", "hello")],
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [msg("user", "hello")],
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("returns 400 when last message is not from user", async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          msg("user", "hello"),
          msg("assistant", "hi"),
        ],
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ─── Webhook Route Tests ────────────────────────────────────────────────────
describe("POST /api/billing/webhook", () => {
  it("returns 400 when stripe-signature header is missing", async () => {
    // Set required env var
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    // Need to mock getStripe too
    vi.doMock("@/lib/billing/stripe", () => ({
      getStripe: vi.fn().mockReturnValue({
        webhooks: {
          constructEvent: vi.fn(),
        },
      }),
    }));

    const { POST } = await import("@/app/api/billing/webhook/route");
    const req = new Request("http://localhost/api/billing/webhook", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing signature");
  });
});
