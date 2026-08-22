/**
 * src/server/preprocessing/extractors/emailThread.ts
 *
 * Deterministic. A long email thread quotes the entire prior chain in
 * every reply — a 10-message thread can have message #1 physically
 * present 10 times. Strips standard quote markers (">" prefixed blocks,
 * "On ... wrote:" headers, Outlook-style "From:/Sent:/To:" blocks),
 * keeping only each message's new content.
 *
 * SAFETY: if stripping would remove the ENTIRE message (edge case: a
 * forward with no new commentary, all content technically "quoted"),
 * falls back to the original rather than returning empty content.
 */

import { buildResult, looksSuspiciouslyThin, type PreprocessResult } from "../types";

const QUOTE_HEADER_PATTERNS = [
  /^On .+ wrote:$/,
  /^-{2,}\s*Original Message\s*-{2,}$/i,
  /^From:\s.+$/,
  /^Sent:\s.+$/,
  /^To:\s.+$/,
  /^Subject:\s.+$/,
];

export function stripEmailQuotes(emailText: string): PreprocessResult {
  const lines = emailText.split("\n");
  const kept: string[] = [];
  let inQuoteBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (QUOTE_HEADER_PATTERNS.some((p) => p.test(trimmed))) {
      inQuoteBlock = true;
      continue;
    }
    if (trimmed.startsWith(">")) {
      inQuoteBlock = true;
      continue;
    }
    // A blank line doesn't necessarily end a quote block on its own,
    // but two consecutive non-quote, non-empty lines after one does —
    // simple heuristic, not a full email-parsing library.
    if (inQuoteBlock && trimmed === "") continue;
    if (inQuoteBlock && !trimmed.startsWith(">")) inQuoteBlock = false;

    if (!inQuoteBlock) kept.push(line);
  }

  const processed = kept.join("\n").trim();

  if (looksSuspiciouslyThin(processed, 10)) {
    return buildResult(
      emailText, emailText, false, "email-quote-strip",
      "Stripping quoted content would leave almost nothing — this message may be entirely a forward with no new commentary. Falling back to the original."
    );
  }

  return buildResult(emailText, processed, true, "email-quote-strip");
}
