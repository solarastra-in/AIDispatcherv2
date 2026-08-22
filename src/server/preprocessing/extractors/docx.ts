/**
 * src/server/preprocessing/extractors/docx.ts
 *
 * Real extraction via mammoth — a .docx is a zip of XML; without this,
 * there's no clean way for a model to use it at all, let alone
 * efficiently. mammoth converts to clean text/markdown-ish output,
 * discarding the XML/formatting scaffolding that carries no meaning for
 * a text task.
 */

import mammoth from "mammoth";
import { buildResult, looksSuspiciouslyThin, type PreprocessResult } from "../types";

export async function extractDocx(buffer: Buffer, originalPlaceholder: string): Promise<PreprocessResult> {
  try {
    const result = await (mammoth as any).extractRawText({ buffer });
    const text = (result.value || "").trim();

    if (looksSuspiciouslyThin(text)) {
      return buildResult(
        originalPlaceholder, originalPlaceholder, false, "docx-text-extract",
        `Extraction produced only ${text.length} characters — likely an empty, corrupted, or unusually-structured document. Falling back to the original file.`
      );
    }

    return buildResult(originalPlaceholder, text, true, "docx-text-extract");
  } catch (err: any) {
    return buildResult(
      originalPlaceholder, originalPlaceholder, false, "docx-text-extract",
      `DOCX parsing failed (${err.message}) — falling back to the original file.`
    );
  }
}
