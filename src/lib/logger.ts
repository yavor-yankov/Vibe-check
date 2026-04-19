/**
 * Structured logger for Vibe Check server-side code.
 *
 * Emits newline-delimited JSON (NDJSON) in production for log aggregators
 * (Vercel log drains, Datadog, Logtail, etc.) and human-readable output in
 * development.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.error({ err, userId }, "refundUsage failed");
 *
 *   // Scoped child logger:
 *   const log = logger.child({ route: "/api/search" });
 *   log.warn({ query }, "search error — falling back to DDG");
 *
 * Log levels (in severity order): trace < debug < info < warn < error
 * The minimum level is controlled by the LOG_LEVEL env var (default: "info").
 */

type Level = "trace" | "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

function parseLevel(raw: string | undefined): Level {
  const lvl = (raw ?? "info").toLowerCase() as Level;
  return LEVEL_ORDER[lvl] !== undefined ? lvl : "info";
}

const isProd =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production";

const minLevel = parseLevel(process.env.LOG_LEVEL);

function shouldLog(level: Level): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
}

/**
 * Serialise an unknown `err` value to a plain object safe for JSON.stringify.
 */
function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      type: err.constructor.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return { raw: String(err) };
}

type Context = Record<string, unknown>;

function write(
  level: Level,
  bindings: Context,
  data: Context,
  msg: string
): void {
  if (!shouldLog(level)) return;

  const entry: Context = {
    level,
    time: new Date().toISOString(),
    ...bindings,
    ...data,
  };
  if (entry.err !== undefined) {
    entry.err = serializeError(entry.err);
  }

  if (isProd) {
    // Newline-delimited JSON — picked up by Vercel log drains / aggregators.
    process.stdout.write(JSON.stringify({ ...entry, msg }) + "\n");
  } else {
    // Pretty-print in development.
    const levelUpper = level.toUpperCase().padEnd(5);
    const ctx = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : "";
    // eslint-disable-next-line no-console
    const consoleFn =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : console.log;
    consoleFn(`[${levelUpper}] ${msg}${ctx}`);
  }
}

class Logger {
  private bindings: Context;

  constructor(bindings: Context = {}) {
    this.bindings = bindings;
  }

  child(extra: Context): Logger {
    return new Logger({ ...this.bindings, ...extra });
  }

  trace(data: Context | string, msg?: string): void {
    this._log("trace", data, msg);
  }

  debug(data: Context | string, msg?: string): void {
    this._log("debug", data, msg);
  }

  info(data: Context | string, msg?: string): void {
    this._log("info", data, msg);
  }

  warn(data: Context | string, msg?: string): void {
    this._log("warn", data, msg);
  }

  error(data: Context | string, msg?: string): void {
    this._log("error", data, msg);
  }

  private _log(level: Level, data: Context | string, msg?: string): void {
    if (typeof data === "string") {
      write(level, this.bindings, {}, data);
    } else {
      write(level, this.bindings, data, msg ?? "");
    }
  }
}

/** Root logger. Import this in server-only modules. */
export const logger = new Logger({ service: "vibe-check" });
