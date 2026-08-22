/**
 * src/server/preprocessing/extractors/markdownImages.ts
 *
 * Deterministic. Markdown files sometimes embed images as inline base64
 * data URIs (`![alt](data:image/png;base64,iVBORw0K...)`), which can
 * dwarf the actual prose while masquerading as "just text." Strips these
 * to a short placeholder — the image itself should travel as a real
 * file input if it's actually needed, not as inflated markdown text.
 */

import { buildResult, type PreprocessResult } from "../types";

const BASE64_IMAGE_PATTERN = /!\[([^\]]*)\]\(data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+\)/g;

export function stripBase64Images(markdown: string): PreprocessResult {
  let count = 0;
  const processed = markdown.replace(BASE64_IMAGE_PATTERN, (_, alt) => {
    count++;
    return `[image: ${alt || "untitled"} — attach separately if needed]`;
  });

  if (count === 0) {
    return buildResult(markdown, markdown, false, "markdown-image-strip", "No embedded base64 images found — nothing to strip.");
  }

  return buildResult(markdown, processed, true, "markdown-image-strip");
}
