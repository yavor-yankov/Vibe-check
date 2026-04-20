import failures from "@/lib/data/startup-failures.json";

export interface FailureMatch {
  company: string;
  year: string;
  reason: string;
  relevance: string;
}

/**
 * Returns the failure database as a formatted string for injection into
 * AI prompts. The model picks the most relevant failures based on the
 * idea's problem space, target user, and business model.
 */
export function getFailureDatabaseContext(): string {
  return failures
    .map(
      (f) =>
        `- ${f.company} (${f.year}, ${f.category}): ${f.reason} [tags: ${f.tags.join(", ")}]`
    )
    .join("\n");
}

/** Returns the raw failure entries for direct use. */
export function getAllFailures() {
  return failures;
}
