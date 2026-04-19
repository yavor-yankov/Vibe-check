import { describe, it, expect } from "vitest";
import {
  ChatBodySchema,
  AnalyzeBodySchema,
  SearchBodySchema,
  RedTeamBodySchema,
  ChatMessageSchema,
  parseBody,
} from "@/lib/validation";

// ---------------------------------------------------------------------------
// ChatMessageSchema
// ---------------------------------------------------------------------------

describe("ChatMessageSchema", () => {
  const valid = {
    id: "msg-1",
    role: "user",
    content: "Hello",
    createdAt: Date.now(),
  };

  it("accepts a valid message", () => {
    expect(ChatMessageSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects unknown roles", () => {
    expect(
      ChatMessageSchema.safeParse({ ...valid, role: "admin" }).success
    ).toBe(false);
  });

  it("rejects content over 8000 chars", () => {
    const result = ChatMessageSchema.safeParse({
      ...valid,
      content: "x".repeat(8001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts content exactly at the 8000 char limit", () => {
    const result = ChatMessageSchema.safeParse({
      ...valid,
      content: "x".repeat(8000),
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ChatBodySchema
// ---------------------------------------------------------------------------

describe("ChatBodySchema", () => {
  const msg = { id: "1", role: "user", content: "hi", createdAt: 0 };

  it("accepts an array of valid messages", () => {
    expect(ChatBodySchema.safeParse({ messages: [msg] }).success).toBe(true);
  });

  it("rejects more than 30 messages", () => {
    const result = ChatBodySchema.safeParse({
      messages: Array.from({ length: 31 }, (_, i) => ({
        ...msg,
        id: String(i),
      })),
    });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 30 messages", () => {
    const result = ChatBodySchema.safeParse({
      messages: Array.from({ length: 30 }, (_, i) => ({
        ...msg,
        id: String(i),
      })),
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AnalyzeBodySchema
// ---------------------------------------------------------------------------

describe("AnalyzeBodySchema", () => {
  const base = {
    ideaSummary: "An app that does X",
    messages: [],
    competitors: [],
  };

  it("accepts a valid analyze body", () => {
    expect(AnalyzeBodySchema.safeParse(base).success).toBe(true);
  });

  it("rejects missing ideaSummary", () => {
    const { ideaSummary: _, ...rest } = base;
    expect(AnalyzeBodySchema.safeParse(rest).success).toBe(false);
  });

  it("rejects empty ideaSummary", () => {
    expect(
      AnalyzeBodySchema.safeParse({ ...base, ideaSummary: "" }).success
    ).toBe(false);
  });

  it("rejects ideaSummary over 2000 chars", () => {
    expect(
      AnalyzeBodySchema.safeParse({
        ...base,
        ideaSummary: "x".repeat(2001),
      }).success
    ).toBe(false);
  });

  it("defaults messages to [] when omitted", () => {
    const result = AnalyzeBodySchema.safeParse({
      ideaSummary: "An app that does X",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toEqual([]);
    }
  });

  it("rejects competitor with invalid URL", () => {
    expect(
      AnalyzeBodySchema.safeParse({
        ...base,
        competitors: [{ title: "A", url: "not-a-url", snippet: "s" }],
      }).success
    ).toBe(false);
  });

  it("rejects more than 20 competitors", () => {
    const competitor = { title: "A", url: "https://example.com", snippet: "s" };
    expect(
      AnalyzeBodySchema.safeParse({
        ...base,
        competitors: Array.from({ length: 21 }, () => competitor),
      }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SearchBodySchema
// ---------------------------------------------------------------------------

describe("SearchBodySchema", () => {
  it("accepts a valid idea summary", () => {
    expect(
      SearchBodySchema.safeParse({ ideaSummary: "A SaaS for X" }).success
    ).toBe(true);
  });

  it("rejects empty summary", () => {
    expect(SearchBodySchema.safeParse({ ideaSummary: "" }).success).toBe(false);
  });

  it("rejects summary over 2000 chars", () => {
    expect(
      SearchBodySchema.safeParse({ ideaSummary: "a".repeat(2001) }).success
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RedTeamBodySchema
// ---------------------------------------------------------------------------

describe("RedTeamBodySchema", () => {
  const base = {
    ideaSummary: "An app that does Y",
  };

  it("accepts minimal body", () => {
    expect(RedTeamBodySchema.safeParse(base).success).toBe(true);
  });

  it("accepts with a full report context", () => {
    expect(
      RedTeamBodySchema.safeParse({
        ...base,
        report: {
          verdict: "build_it",
          verdictLabel: "Build it",
          summary: "Solid idea",
          risks: ["one risk"],
        },
      }).success
    ).toBe(true);
  });

  it("accepts null report", () => {
    expect(
      RedTeamBodySchema.safeParse({ ...base, report: null }).success
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// parseBody helper
// ---------------------------------------------------------------------------

describe("parseBody", () => {
  it("returns ok:true with parsed data on success", () => {
    const result = parseBody(SearchBodySchema, { ideaSummary: "test idea" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.ideaSummary).toBe("test idea");
    }
  });

  it("returns ok:false with a 400 Response on failure", () => {
    const result = parseBody(SearchBodySchema, { ideaSummary: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
    }
  });

  it("includes field path in error message", async () => {
    const result = parseBody(SearchBodySchema, { ideaSummary: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = (await result.response.json()) as { error: string };
      expect(body.error).toContain("ideaSummary");
    }
  });
});
