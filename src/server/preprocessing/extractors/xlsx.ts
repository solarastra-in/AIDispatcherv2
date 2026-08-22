/**
 * src/server/preprocessing/extractors/xlsx.ts
 *
 * Real extraction via exceljs (already a dependency from the output-
 * generation work earlier in this engagement). Converts each sheet to a
 * compact pipe-table representation — far cheaper than a raw binary
 * dump (meaningless to a text model) or a rendered screenshot (full
 * vision-token cost for what's fundamentally structured numeric data).
 */

import ExcelJS from "exceljs";
import { buildResult, type PreprocessResult } from "../types";

const MAX_ROWS_PER_SHEET = 200; // guards against dumping a 50,000-row sheet as raw text — truncated sheets are flagged, not silently cut

export async function extractXlsx(buffer: Buffer, originalPlaceholder: string): Promise<PreprocessResult> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    if (workbook.worksheets.length === 0) {
      return buildResult(originalPlaceholder, originalPlaceholder, false, "xlsx-extract", "Workbook has no sheets — falling back to the original file.");
    }

    const parts: string[] = [];
    for (const sheet of workbook.worksheets) {
      const rows: string[][] = [];
      sheet.eachRow((row) => {
        rows.push(row.values ? (row.values as any[]).slice(1).map((v) => (v === null || v === undefined ? "" : String(v))) : []);
      });
      if (rows.length === 0) continue;

      const truncated = rows.length > MAX_ROWS_PER_SHEET;
      const rowsToShow = truncated ? rows.slice(0, MAX_ROWS_PER_SHEET) : rows;

      parts.push(`## Sheet: ${sheet.name}`);
      parts.push(rowsToShow.map((r) => `| ${r.join(" | ")} |`).join("\n"));
      if (truncated) parts.push(`_(showing first ${MAX_ROWS_PER_SHEET} of ${rows.length} rows)_`);
    }

    const text = parts.join("\n\n").trim();
    if (!text) {
      return buildResult(originalPlaceholder, originalPlaceholder, false, "xlsx-extract", "All sheets were empty — falling back to the original file.");
    }

    return buildResult(originalPlaceholder, text, true, "xlsx-extract");
  } catch (err: any) {
    return buildResult(
      originalPlaceholder, originalPlaceholder, false, "xlsx-extract",
      `XLSX parsing failed (${err.message}) — falling back to the original file.`
    );
  }
}
