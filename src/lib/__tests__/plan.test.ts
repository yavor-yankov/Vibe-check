import { describe, it, expect } from "vitest";
import {
  PRICING_TIERS,
  getTier,
  currentUsageMonth,
} from "@/lib/billing/plan";

describe("PRICING_TIERS", () => {
  it("free tier has a finite monthly quota", () => {
    expect(Number.isFinite(PRICING_TIERS.free.monthlyQuota)).toBe(true);
    expect(PRICING_TIERS.free.monthlyQuota).toBeGreaterThan(0);
  });

  it("pro tier has unlimited quota (Infinity)", () => {
    expect(PRICING_TIERS.pro.monthlyQuota).toBe(Infinity);
  });

  it("lifetime tier has unlimited quota (Infinity)", () => {
    expect(PRICING_TIERS.lifetime.monthlyQuota).toBe(Infinity);
  });

  it("all tiers have a non-empty aiModel string", () => {
    for (const tier of Object.values(PRICING_TIERS)) {
      expect(typeof tier.aiModel).toBe("string");
      expect(tier.aiModel.length).toBeGreaterThan(0);
    }
  });

  it("all tiers have a non-negative USD price", () => {
    for (const tier of Object.values(PRICING_TIERS)) {
      expect(tier.priceUsd).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("getTier", () => {
  it("returns the correct tier object for 'free'", () => {
    expect(getTier("free")).toBe(PRICING_TIERS.free);
  });

  it("returns the correct tier object for 'pro'", () => {
    expect(getTier("pro")).toBe(PRICING_TIERS.pro);
  });

  it("returns the correct tier object for 'lifetime'", () => {
    expect(getTier("lifetime")).toBe(PRICING_TIERS.lifetime);
  });
});

describe("currentUsageMonth", () => {
  it("returns a YYYY-MM formatted string", () => {
    const result = currentUsageMonth();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });

  it("uses the UTC month from the provided date", () => {
    const jan = new Date("2025-01-15T12:00:00Z");
    expect(currentUsageMonth(jan)).toBe("2025-01");

    const dec = new Date("2024-12-31T23:59:59Z");
    expect(currentUsageMonth(dec)).toBe("2024-12");
  });

  it("zero-pads single-digit months", () => {
    const march = new Date("2025-03-01T00:00:00Z");
    expect(currentUsageMonth(march)).toBe("2025-03");
  });

  it("rolls over correctly at year boundary", () => {
    const nye = new Date("2025-12-31T23:59:59Z");
    expect(currentUsageMonth(nye)).toBe("2025-12");
    const jan = new Date("2026-01-01T00:00:00Z");
    expect(currentUsageMonth(jan)).toBe("2026-01");
  });
});
