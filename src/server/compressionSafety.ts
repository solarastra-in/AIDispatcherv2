/**
 * src/server/compressionSafety.ts
 *
 * "Same applies to compressing the context and prompt if it makes
 * sense" — this is the missing safety check for
 * contextCompressor.ts's recordTurnAndMaybeCompress(). That function
 * (built earlier in this engagement) always trusts whatever summary the
 * utility model returns once the token threshold is crossed — there was
 * no check for a degenerate case: the model returns an empty, truncated,
 * or suspiciously short summary (a bad model call, a content filter
 * trip, a malformed response), and compression would silently replace
 * real conversation history with almost nothing.
 *
 * This module provides that check as a wrapper — call it around the
 * existing compression call site rather than modifying
 * contextCompressor.ts's already-tested core logic directly.
 */

export interface CompressionSafetyCheck {
  safe: boolean;
  reason: string | null;
}

const MIN_SUMMARY_CHARS = 40;
const MAX_COMPRESSION_RATIO = 0.15; // a summary claiming to compress folded content by more than ~85% is more likely a truncated/failed response than a genuinely great summary

export function checkCompressionSafety(foldedTranscript: string, generatedSummary: string): CompressionSafetyCheck {
  const summary = generatedSummary.trim();

  if (summary.length < MIN_SUMMARY_CHARS) {
    return { safe: false, reason: `Generated summary is only ${summary.length} characters — too short to trust as a faithful compression of the conversation. Keeping the original turns verbatim instead.` };
  }

  const ratio = summary.length / Math.max(1, foldedTranscript.length);
  if (ratio < MAX_COMPRESSION_RATIO) {
    return { safe: false, reason: `Summary compressed the folded content by ${Math.round((1 - ratio) * 100)}%, beyond the ${Math.round((1 - MAX_COMPRESSION_RATIO) * 100)}% threshold this pipeline trusts without review — likely a truncated or degenerate response rather than a genuinely excellent summary. Keeping the original turns verbatim instead.` };
  }

  // A summary that's suspiciously close to a common failure-mode phrase
  // (the model declining, apologizing, or returning a placeholder)
  // rather than an actual summary.
  const FAILURE_PATTERNS = [/^i (can't|cannot|am unable)/i, /^sorry[,.]?/i, /^\[?(no content|empty|n\/a)\]?$/i];
  if (FAILURE_PATTERNS.some((p) => p.test(summary))) {
    return { safe: false, reason: "Generated summary looks like a model refusal or placeholder rather than an actual summary. Keeping the original turns verbatim instead." };
  }

  return { safe: true, reason: null };
}
