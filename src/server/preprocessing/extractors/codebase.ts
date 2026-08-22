/**
 * src/server/preprocessing/extractors/codebase.ts
 *
 * Deterministic, no external library needed. Filters a list of
 * {path, content} entries (e.g. from a directory upload or zip) against
 * .gitignore-style patterns before any of it is sent — vendored
 * dependencies, lockfiles, and generated/minified code add token cost
 * with zero value for almost any code-review or explanation task.
 *
 * SAFETY: never filters to zero files silently. If every file would be
 * excluded (a misconfigured pattern set, or genuinely unusual project
 * layout), the whole filter step is skipped and all files pass through
 * — better to over-include than to silently hand the model nothing.
 */

import { buildResult, type PreprocessResult } from "../types";

export interface CodeFile {
  path: string;
  content: string;
}

const DEFAULT_EXCLUDE_PATTERNS: RegExp[] = [
  /(^|\/)node_modules\//,
  /(^|\/)\.git\//,
  /(^|\/)dist\//,
  /(^|\/)build\//,
  /(^|\/)\.next\//,
  /(^|\/)coverage\//,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /bun\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.min\.(js|css)$/,
  /\.map$/,
  /(^|\/)vendor\//,
  /\.(png|jpg|jpeg|gif|ico|woff2?|ttf|eot)$/,
];

export function filterCodebaseFiles(files: CodeFile[], excludePatterns: RegExp[] = DEFAULT_EXCLUDE_PATTERNS): PreprocessResult {
  const originalText = files.map((f) => `// ${f.path}\n${f.content}`).join("\n\n");

  const kept = files.filter((f) => !excludePatterns.some((p) => p.test(f.path)));

  if (kept.length === 0) {
    return buildResult(
      originalText, originalText, false, "codebase-filter",
      `Filtering would exclude all ${files.length} file(s) — likely an overly broad pattern set for this project layout. Sending all files unfiltered rather than silently sending nothing.`
    );
  }

  const processedText = kept.map((f) => `// ${f.path}\n${f.content}`).join("\n\n");
  const result = buildResult(originalText, processedText, true, "codebase-filter");
  return { ...result, skippedReason: kept.length < files.length ? null : "No files matched exclude patterns — nothing to filter." };
}
