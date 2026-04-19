import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We test logger behaviour without importing it directly, to avoid the
// singleton being affected by other test files. Instead we re-import it
// fresh inside each test by resetting the module registry.

describe("logger (structured output)", () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Patch process.stdout.write so we can inspect NDJSON output.
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    // Force production mode so the logger emits JSON.
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    writeSpy.mockRestore();
    process.env.NODE_ENV = "test";
    vi.resetModules();
  });

  it("writes valid JSON to stdout in production mode", async () => {
    const { logger } = await import("@/lib/logger");
    logger.info("hello from test");

    expect(writeSpy).toHaveBeenCalled();
    const raw = writeSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(raw.trim()) as Record<string, unknown>;
    expect(parsed.level).toBe("info");
    expect(parsed.msg).toBe("hello from test");
    expect(typeof parsed.time).toBe("string");
  });

  it("includes bound context fields from child()", async () => {
    const { logger } = await import("@/lib/logger");
    const child = logger.child({ module: "test-module" });
    child.warn({ extra: 42 }, "child warning");

    const raw = writeSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(raw.trim()) as Record<string, unknown>;
    expect(parsed.module).toBe("test-module");
    expect(parsed.extra).toBe(42);
    expect(parsed.level).toBe("warn");
  });

  it("serializes Error objects in the err field", async () => {
    const { logger } = await import("@/lib/logger");
    const err = new Error("boom");
    logger.error({ err }, "something failed");

    const raw = writeSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(raw.trim()) as Record<string, unknown>;
    const serializedErr = parsed.err as Record<string, unknown>;
    expect(serializedErr.message).toBe("boom");
    expect(serializedErr.type).toBe("Error");
    expect(typeof serializedErr.stack).toBe("string");
  });

  it("respects LOG_LEVEL — suppresses debug when level is info", async () => {
    process.env.LOG_LEVEL = "info";
    const { logger } = await import("@/lib/logger");
    logger.debug("this should be suppressed");

    expect(writeSpy).not.toHaveBeenCalled();
  });
});
