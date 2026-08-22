/**
 * src/server/preprocessing/extractors/jsonFilter.ts
 *
 * Deterministic. Real API responses are full of null fields, internal
 * IDs, and pagination/metadata wrappers a given question rarely needs.
 * Recursively strips null/undefined/empty-string/empty-array/empty-object
 * values — never removes a field with actual content, only genuinely
 * empty ones, so nothing meaningful is lost.
 */

import { buildResult, type PreprocessResult } from "../types";

function pruneEmpty(value: any): any {
  if (Array.isArray(value)) {
    const pruned = value.map(pruneEmpty).filter((v) => !isEmpty(v));
    return pruned;
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      const prunedV = pruneEmpty(v);
      if (!isEmpty(prunedV)) result[k] = prunedV;
    }
    return result;
  }
  return value;
}

function isEmpty(v: any): boolean {
  if (v === null || v === undefined || v === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === "object" && Object.keys(v).length === 0) return true;
  return false;
}

export function filterJsonResponse(jsonText: string): PreprocessResult {
  try {
    const parsed = JSON.parse(jsonText);
    const pruned = pruneEmpty(parsed);
    const processed = JSON.stringify(pruned, null, 0); // compact, not pretty — pretty-printing whitespace itself costs tokens for no benefit to the model

    if (isEmpty(pruned)) {
      return buildResult(jsonText, jsonText, false, "json-filter", "Pruning removed everything — the response may be entirely null/empty fields, which is unusual. Falling back to the original.");
    }

    return buildResult(jsonText, processed, true, "json-filter");
  } catch (err: any) {
    return buildResult(jsonText, jsonText, false, "json-filter", `Not valid JSON (${err.message}) — falling back to the original.`);
  }
}
