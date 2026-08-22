/**
 * src/server/preprocessing/pipeline.ts
 *
 * Single entry point — detects format, routes to the matching extractor,
 * and guarantees a safe result even when an extractor fails or produces
 * something untrustworthy (every extractor already implements its own
 * fallback; this is the dispatch layer that ties them together and adds
 * the file-vs-vision-cost baseline for PDFs specifically).
 */

import { extractPdf } from "./extractors/pdf";
import { extractDocx } from "./extractors/docx";
import { extractXlsx } from "./extractors/xlsx";
import { extractHtml } from "./extractors/html";
import { filterCodebaseFiles, type CodeFile } from "./extractors/codebase";
import { deduplicateLogs } from "./extractors/logs";
import { stripEmailQuotes } from "./extractors/emailThread";
import { filterJsonResponse } from "./extractors/jsonFilter";
import { stripBase64Images } from "./extractors/markdownImages";
import { downscaleImage } from "./extractors/image";
import { estimateTokens, type PreprocessResult } from "./types";

// Documented approximation — see extractors/image.ts's doc comment.
// Used ONLY as a supplementary "cost if sent as page images" figure for
// PDFs, never as the primary reported percentSaved (which compares
// extracted text against a short filename placeholder — an honest but
// less meaningful number for file formats; this supplements it with a
// more realistic "what you actually would have paid" baseline).
const ESTIMATED_VISION_TOKENS_PER_PAGE = 1500;

export interface FilePreprocessInput {
  mimeType: string;
  buffer: Buffer;
  filename: string;
}

export interface FilePreprocessOutput extends PreprocessResult {
  estimatedVisionCostIfUnprocessed: number | null; // populated for PDFs only — see doc comment
}

export async function preprocessFile(input: FilePreprocessInput): Promise<FilePreprocessOutput> {
  const placeholder = `[${input.filename}]`;

  if (input.mimeType === "application/pdf") {
    const result = await extractPdf(input.buffer, placeholder);
    let estimatedVisionCostIfUnprocessed: number | null = null;
    if (result.wasPreprocessed) {
      try {
        const pdfModule = await import("pdf-parse");
        let pageCount = 1;
        if (typeof (pdfModule as any).default === "function") {
          const meta = await (pdfModule as any).default(input.buffer);
          pageCount = meta.numpages || 1;
        } else if ((pdfModule as any).PDFParse) {
          const parser = new (pdfModule as any).PDFParse({ data: input.buffer });
          const meta = await parser.getText();
          pageCount = meta.pages?.length || meta.total || 1;
        }
        estimatedVisionCostIfUnprocessed = pageCount * ESTIMATED_VISION_TOKENS_PER_PAGE;
      } catch {
        estimatedVisionCostIfUnprocessed = null; // don't let a metadata-only failure break the successful extraction result
      }
    }
    return { ...result, estimatedVisionCostIfUnprocessed };
  }

  if (input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return { ...(await extractDocx(input.buffer, placeholder)), estimatedVisionCostIfUnprocessed: null };
  }

  if (input.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || input.mimeType === "application/vnd.ms-excel") {
    return { ...(await extractXlsx(input.buffer, placeholder)), estimatedVisionCostIfUnprocessed: null };
  }

  if (input.mimeType === "text/html") {
    const result = extractHtml(input.buffer.toString("utf-8"));
    return { ...result, estimatedVisionCostIfUnprocessed: null };
  }

  if (input.mimeType === "application/json") {
    const result = filterJsonResponse(input.buffer.toString("utf-8"));
    return { ...result, estimatedVisionCostIfUnprocessed: null };
  }

  // No matching extractor for this format — pass through unmodified.
  // This is the default safety behavior, not a special case: an unknown
  // format is never forced through an inappropriate extractor.
  const raw = input.buffer.toString("utf-8");
  return {
    processedContent: raw, wasPreprocessed: false, skippedReason: `No preprocessing extractor for '${input.mimeType}' — sending as-is.`,
    method: "none", originalTokenEstimate: estimateTokens(raw), processedTokenEstimate: estimateTokens(raw),
    tokensSaved: 0, percentSaved: 0, estimatedVisionCostIfUnprocessed: null,
  };
}

// Text-content pipeline (already-decoded strings, not files) — logs,
// email threads, markdown, raw code paste. Caller identifies which
// applies; unlike preprocessFile, there's no MIME type to auto-detect
// plain-text sub-categories from.
export function preprocessTextContent(content: string, kind: "logs" | "email" | "markdown"): PreprocessResult {
  if (kind === "logs") return deduplicateLogs(content);
  if (kind === "email") return stripEmailQuotes(content);
  return stripBase64Images(content);
}

export interface RawUploadedFileInput {
  mimeType: string;
  base64Data?: string;
  textContent?: string;
  filename?: string;
}

export interface ProcessedBatchFile extends PreprocessResult {
  filename?: string;
  mimeType?: string;
  extractedText?: string;
  base64Data?: string;
}

export interface BatchPreprocessOutput {
  processedFiles: ProcessedBatchFile[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokensSaved: number;
  totalSavingsPercent: number;
}

export async function preprocessSingleFile(input: RawUploadedFileInput): Promise<ProcessedBatchFile> {
  const filename = input.filename || "file";
  const mime = input.mimeType || "application/octet-stream";
  
  if (input.textContent) {
    const raw = input.textContent;
    const placeholder = `[${filename}]`;
    const tokens = estimateTokens(raw);
    return {
      processedContent: raw,
      extractedText: raw,
      wasPreprocessed: true,
      skippedReason: null,
      method: "text-direct",
      originalTokenEstimate: tokens,
      processedTokenEstimate: tokens,
      tokensSaved: 0,
      percentSaved: 0,
      filename,
      mimeType: mime,
    };
  }

  let buf = Buffer.alloc(0);
  if (input.base64Data) {
    const cleanB64 = input.base64Data.includes(",") ? input.base64Data.split(",")[1] : input.base64Data;
    buf = Buffer.from(cleanB64, "base64");
  }

  if (mime.startsWith("image/")) {
    const downscaled = await downscaleImage(buf, mime);
    const estBefore = Math.max(500, Math.ceil((downscaled.originalBytes / 1024) * 2.5));
    const estAfter = downscaled.wasResized ? Math.max(250, Math.ceil((downscaled.newBytes / 1024) * 2.5)) : estBefore;
    const saved = Math.max(0, estBefore - estAfter);
    const pct = estBefore > 0 ? Math.round((saved / estBefore) * 100) : 0;
    return {
      processedContent: `[Image: ${filename} downscaled (${downscaled.originalDimensions} -> ${downscaled.newDimensions})]`,
      wasPreprocessed: downscaled.wasResized,
      skippedReason: downscaled.wasResized ? null : "Image already within optimal token bounds",
      method: "image-downscale",
      originalTokenEstimate: estBefore,
      processedTokenEstimate: estAfter,
      tokensSaved: saved,
      percentSaved: pct,
      filename,
      mimeType: mime,
      base64Data: downscaled.buffer.toString("base64"),
    };
  }

  const result = await preprocessFile({
    filename,
    mimeType: mime,
    buffer: buf,
  });

  return {
    ...result,
    filename,
    mimeType: result.wasPreprocessed ? "text/plain" : mime,
    extractedText: result.wasPreprocessed ? result.processedContent : undefined,
    base64Data: !result.wasPreprocessed && input.base64Data ? input.base64Data : undefined,
  };
}

export async function preprocessFiles(files: RawUploadedFileInput[]): Promise<BatchPreprocessOutput> {
  const results: ProcessedBatchFile[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const f of files) {
    const single = await preprocessSingleFile(f);
    results.push(single);
    totalInputTokens += single.originalTokenEstimate;
    totalOutputTokens += single.processedTokenEstimate;
  }

  const totalTokensSaved = Math.max(0, totalInputTokens - totalOutputTokens);
  const totalSavingsPercent = totalInputTokens > 0 ? Math.round((totalTokensSaved / totalInputTokens) * 1000) / 10 : 0;

  return {
    processedFiles: results,
    totalInputTokens,
    totalOutputTokens,
    totalTokensSaved,
    totalSavingsPercent,
  };
}

export { filterCodebaseFiles, type CodeFile, downscaleImage, type PreprocessResult, estimateTokens };
