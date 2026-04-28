import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

const log = logger.child({ route: "/api/search" });
import { modelForTier, aiCall, generateContent } from "@/lib/ai";
import { getPlanSnapshot } from "@/lib/billing/usage";
import {
  readCachedSearch,
  writeCachedSearch,
} from "@/lib/billing/tavily-cache";
import { SearchBodySchema, parseBody } from "@/lib/validation";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import type { Competitor } from "@/lib/types";

export const runtime = "nodejs";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface TavilyResponse {
  results?: TavilyResult[];
}

async function generateSearchQueries(
  ideaSummary: string,
  modelName: string,
  count: number = 3
): Promise<string[]> {
  try {
    const systemPrompt = `You are a search query generator. Given a product idea summary, output ${count} short, high-signal web search queries (max 8 words each) that would surface existing competitor apps or similar products. Focus on product names/categories, not features. Return ONLY a JSON array of strings, no other text. Example: ["AI habit tracker app", "habit streak mobile app"]`;
    const raw = await aiCall(() =>
      generateContent({
        model: modelName,
        systemPrompt,
        userPrompt: ideaSummary,
        jsonMode: true,
        temperature: 0.7,
      })
    );
    // strip possible code fences
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.every((q) => typeof q === "string")) {
      return parsed.slice(0, count);
    }
  } catch {
    // fall through to fallback
  }
  // naive fallback: use the first 10 words as a single query
  const words = ideaSummary.split(/\s+/).slice(0, 10).join(" ");
  return [words];
}

async function tavilySearch(
  query: string,
  apiKey: string
): Promise<Competitor[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`Tavily error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as TavilyResponse;
  return (data.results ?? []).map((r) => ({
    title: (r.title ?? "").slice(0, 300),
    url: r.url,
    // Tavily `content` can be several KB — cap it to 2 000 chars so it
    // passes the CompetitorSchema and doesn't bloat the AI prompt.
    snippet: (r.content ?? "").slice(0, 2_000),
  }));
}

async function duckduckgoSearch(query: string): Promise<Competitor[]> {
  // DuckDuckGo's instant-answer API (limited but key-free)
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    RelatedTopics?: Array<{ FirstURL?: string; Text?: string }>;
    AbstractURL?: string;
    AbstractText?: string;
    Heading?: string;
  };
  const results: Competitor[] = [];
  if (data.AbstractURL && data.AbstractText) {
    results.push({
      title: (data.Heading ?? data.AbstractURL).slice(0, 300),
      url: data.AbstractURL,
      snippet: data.AbstractText.slice(0, 2_000),
    });
  }
  for (const t of data.RelatedTopics ?? []) {
    if (t.FirstURL && t.Text) {
      results.push({
        title: (t.Text.split(" - ")[0]?.slice(0, 80) ?? t.FirstURL),
        url: t.FirstURL,
        snippet: t.Text.slice(0, 2_000),
      });
    }
    if (results.length >= 5) break;
  }
  return results;
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseBody(SearchBodySchema, raw);
  if (!parsed.ok) return parsed.response;
  const { ideaSummary } = parsed.data;

  const plan = await getPlanSnapshot();
  if (!plan) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limiting — 20 req/min per user. Disabled when Upstash env vars absent.
  const rl = await checkRateLimit(plan.userId);
  if (rl && !rl.success) return rateLimitExceededResponse(rl.reset);

  // Free tier: 2 queries to reduce Tavily cost; Pro/Lifetime: 3 queries.
  const queryCount = plan.tier === "free" ? 2 : 3;
  const queries = await generateSearchQueries(
    ideaSummary,
    modelForTier(plan.tier),
    queryCount
  );
  const tavilyKey = process.env.TAVILY_API_KEY;

  const seen = new Set<string>();
  const competitors: Competitor[] = [];
  let cachedQueries = 0;

  for (const q of queries) {
    // Cache lookup first — a hit skips both Tavily and DuckDuckGo.
    const cached = await readCachedSearch(q);
    if (cached) {
      cachedQueries++;
      for (const c of cached) {
        if (!seen.has(c.url)) {
          seen.add(c.url);
          competitors.push(c);
        }
      }
      continue;
    }

    let batch: Competitor[] = [];
    try {
      if (tavilyKey) {
        batch = await tavilySearch(q, tavilyKey);
      } else {
        batch = await duckduckgoSearch(q);
      }
    } catch (err) {
      log.error({ err, query: q }, "Search error — falling back to DuckDuckGo");
      // fallback to ddg if tavily fails
      if (tavilyKey) {
        try {
          batch = await duckduckgoSearch(q);
        } catch {
          batch = [];
        }
      }
    }
    if (batch.length > 0) {
      // Only cache successful live calls. Failures shouldn't be memoized.
      void writeCachedSearch(q, batch);
    }
    for (const c of batch) {
      if (!seen.has(c.url)) {
        seen.add(c.url);
        competitors.push(c);
      }
    }
  }

  return Response.json({
    queries,
    competitors: competitors.slice(0, 10),
    provider: tavilyKey ? "tavily" : "duckduckgo",
    cacheHits: cachedQueries,
  });
}
