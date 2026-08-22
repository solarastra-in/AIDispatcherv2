/**
 * src/server/preprocessing/extractors/html.ts
 *
 * Real extraction via cheerio. Strips <script>, <style>, and common
 * boilerplate containers (nav, header, footer, aside), then pulls text
 * from content-bearing elements — a blunter heuristic than a full
 * Readability-style algorithm, but real and testable without an extra
 * heavyweight dependency. Flagged as an extension point, not a claim of
 * matching Mozilla Readability's precision.
 */

import * as cheerio from "cheerio";
import { buildResult, looksSuspiciouslyThin, type PreprocessResult } from "../types";

const BOILERPLATE_SELECTORS = ["script", "style", "nav", "header", "footer", "aside", "noscript", "svg", "[aria-hidden='true']"];

export function extractHtml(html: string): PreprocessResult {
  try {
    const $ = cheerio.load(html);
    BOILERPLATE_SELECTORS.forEach((sel) => $(sel).remove());

    // Prefer <article> or <main> if present — a strong signal of the
    // actual content region; fall back to <body> otherwise.
    const contentRoot = $("article").length ? $("article") : $("main").length ? $("main") : $("body");
    const text = contentRoot
      .find("p, h1, h2, h3, h4, li, blockquote")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .join("\n\n");

    if (looksSuspiciouslyThin(text, 50)) {
      return buildResult(
        html, html, false, "html-readable-extract",
        `Extraction produced only ${text.length} characters — likely a JS-rendered page with no server-side content, or an unusual page structure. Falling back to the raw HTML.`
      );
    }

    return buildResult(html, text, true, "html-readable-extract");
  } catch (err: any) {
    return buildResult(html, html, false, "html-readable-extract", `HTML parsing failed (${err.message}) — falling back to the raw HTML.`);
  }
}
