/**
 * src/server/preprocessing/types.ts
 *
 * Shared contract every extractor in this pipeline implements. The core
 * safety rule, enforced structurally by this type, not just by
 * convention: an extractor can never silently drop content. If it can't
 * extract with confidence, it reports why and the pipeline falls back to
 * the original — same principle applied to context compression
 * elsewhere in this codebase (a compression pass that produces a
 * suspiciously short summary should be distrusted, not trusted blindly).
 */

export interface PreprocessResult {
  processedContent: string;      // what actually gets sent downstream
  wasPreprocessed: boolean;      // false means processedContent === original, unmodified
  skippedReason: string | null;  // populated whenever wasPreprocessed is false
  method: string;                // which extractor ran, or "none"
  originalTokenEstimate: number;
  processedTokenEstimate: number;
  tokensSaved: number;
  percentSaved: number;
}

// Hybrid estimator, not the simpler word-count heuristic used elsewhere
// in this codebase (contextCompressor.ts, the local-proxy adapters).
// Word-count badly UNDERCOUNTS dense, non-whitespace content — a 2,000-
// character base64 blob with no spaces counts as roughly one "word" under
// a pure word-count estimate, when real BPE tokenizers produce roughly
// one token per ~4 characters for that kind of content. Caught in
// testing: the base64-image-stripping extractor showed tokens
// INCREASING after removing a 2,000-character embedded image, which is
// obviously wrong and would have undermined the credibility of every
// savings number this pipeline reports. Using max(word-based,
// char-based) fixes both regimes: natural language stays word-accurate,
// dense/base64/JSON/minified content gets a realistic character-based
// floor instead of being wildly undercounted.
export function estimateTokens(text: string): number {
  const wordBased = Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.35);
  const charBased = Math.ceil(text.length / 4);
  return Math.max(wordBased, charBased);
}

export function buildResult(
  original: string,
  processed: string,
  wasPreprocessed: boolean,
  method: string,
  skippedReason: string | null = null
): PreprocessResult {
  const originalTokenEstimate = estimateTokens(original);
  const processedTokenEstimate = estimateTokens(processed);
  const tokensSaved = Math.max(0, originalTokenEstimate - processedTokenEstimate);
  const percentSaved = originalTokenEstimate > 0 ? Math.round((tokensSaved / originalTokenEstimate) * 1000) / 10 : 0;
  return {
    processedContent: processed, wasPreprocessed, skippedReason, method,
    originalTokenEstimate, processedTokenEstimate, tokensSaved, percentSaved,
  };
}

/**
 * The core safety check every extractor should run before trusting its
 * own output: does the extracted content look suspiciously thin relative
 * to what went in? A scanned PDF with no text layer, a corrupted DOCX
 * that mammoth partially parses, an HTML page that's actually a JS-
 * rendered shell with no server-side content — all of these can "succeed"
 * technically while silently losing almost everything. This is a blunt,
 * generic heuristic; format-specific extractors layer their own more
 * precise checks on top where possible (see pdf.ts's pages-vs-chars ratio).
 */
export function looksSuspiciouslyThin(extractedText: string, minCharsAbsolute = 20): boolean {
  return extractedText.trim().length < minCharsAbsolute;
}
