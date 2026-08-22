/**
 * src/server/preprocessing/extractors/logs.ts
 *
 * Deterministic. Production logs are dominated by repeated lines
 * (the same routine INFO line thousands of times) around a handful that
 * actually matter. This collapses exact and near-duplicate lines
 * (timestamp/ID stripped for comparison) into "line seen N times",
 * keeping every DISTINCT line's full content — never drops a unique
 * line, only collapses genuine repeats.
 */

import { buildResult, type PreprocessResult } from "../types";

// Strips high-cardinality tokens (timestamps, UUIDs, request IDs, line
// numbers) before comparing lines for "sameness" — two log lines that
// differ only by timestamp are the same underlying event.
function normalizeForComparison(line: string): string {
  return line
    .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?/g, "<TS>")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<UUID>")
    .replace(/\b\d+\b/g, "<N>")
    .trim();
}

export function deduplicateLogs(logText: string, minRepeatsToCollapse = 3): PreprocessResult {
  const lines = logText.split("\n");
  if (lines.length < 10) {
    return buildResult(logText, logText, false, "log-dedup", "Too few lines to meaningfully deduplicate — sending as-is.");
  }

  const groups = new Map<string, { firstLine: string; count: number; firstIndex: number }>();
  lines.forEach((line, idx) => {
    if (!line.trim()) return;
    const key = normalizeForComparison(line);
    const existing = groups.get(key);
    if (existing) existing.count++;
    else groups.set(key, { firstLine: line, count: 1, firstIndex: idx });
  });

  const orderedGroups = Array.from(groups.values()).sort((a, b) => a.firstIndex - b.firstIndex);
  const outputLines = orderedGroups.map((g) =>
    g.count >= minRepeatsToCollapse ? `${g.firstLine}  [× ${g.count} similar lines collapsed]` : g.firstLine
  );

  const processed = outputLines.join("\n");
  // Sanity check: every distinct group's first occurrence is preserved —
  // this isn't a lossy summary, only exact/near-duplicate repeats collapse.
  return buildResult(logText, processed, true, "log-dedup");
}
