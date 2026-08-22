/**
 * src/server/preprocessing/extractors/pdf.ts
 *
 * Real text extraction via pdf-parse — for text-native PDFs, this
 * replaces sending page images to a vision model (hundreds of tokens
 * per page regardless of actual content density) with the actual
 * embedded text.
 *
 * SAFETY: a scanned PDF (photographed or scanned pages, no embedded
 * text layer) will "succeed" at extraction while returning almost
 * nothing — pdf-parse doesn't OCR. The check below compares extracted
 * character count against page count; if it's implausibly low, this is
 * flagged as likely-scanned and the pipeline falls back to sending the
 * PDF through as-is (for vision-capable models to read as images)
 * rather than silently shipping a near-empty extraction.
 */

import { PDFParse } from "pdf-parse";
import { buildResult, type PreprocessResult } from "../types";

const MIN_CHARS_PER_PAGE_THRESHOLD = 15; // below this average, treat as likely-scanned rather than trust the extraction

export async function extractPdf(buffer: Buffer, originalPlaceholder: string): Promise<PreprocessResult> {
  try {
    let text = "";
    let pageCount = 1;

    if (typeof (PDFParse as any) === "function") {
      try {
        const parser = new (PDFParse as any)({ data: buffer });
        const result = await parser.getText();
        text = (result.text || "").replace(/--\s*\d+\s*of\s*\d+\s*--/g, "").trim();
        pageCount = result.pages?.length || result.total || 1;
      } catch {
        const data = await (PDFParse as any)(buffer);
        text = (data.text || "").replace(/--\s*\d+\s*of\s*\d+\s*--/g, "").trim();
        pageCount = data.numpages || 1;
      }
    }

    const charsPerPage = text.length / pageCount;

    if (charsPerPage < MIN_CHARS_PER_PAGE_THRESHOLD) {
      return buildResult(
        originalPlaceholder, originalPlaceholder, false, "pdf-text-extract",
        `Extracted only ~${Math.round(charsPerPage)} chars/page across ${pageCount} page(s) — likely a scanned/image PDF with no embedded text layer. Falling back to sending the file as-is for a vision-capable model to read.`
      );
    }

    return buildResult(originalPlaceholder, text, true, "pdf-text-extract");
  } catch (err: any) {
    return buildResult(
      originalPlaceholder, originalPlaceholder, false, "pdf-text-extract",
      `PDF parsing failed (${err.message}) — falling back to sending the file as-is.`
    );
  }
}
