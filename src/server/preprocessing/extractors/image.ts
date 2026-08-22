/**
 * src/server/preprocessing/extractors/image.ts
 *
 * Real downscaling via sharp. Vision models tile images into fixed-size
 * blocks and charge per tile — an oversized image (a 4000x3000 photo for
 * a question that doesn't need that resolution) costs meaningfully more
 * than the same image downscaled to what the model actually tiles at,
 * with no answer-quality difference for most questions (reading a chart,
 * describing a scene, OCR-ing a document photo at a readable size).
 *
 * DOCUMENTED APPROXIMATION, not a precise per-provider figure: vision
 * tiling costs vary by provider and aren't all public in exact detail.
 * The ~1500-3000-token-per-page range used elsewhere in this pipeline
 * for "cost if sent as an image" is a commonly-cited rough industry
 * range for a full-resolution document page — treated here as a labeled
 * estimate, not asserted as exact.
 */

import sharp from "sharp";
import { buildResult, type PreprocessResult } from "../types";

const MAX_DIMENSION = 1568; // matches the commonly-documented tiling threshold several vision APIs use — resizing to at or below this avoids paying for resolution the model would downscale internally anyway

export async function downscaleImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; wasResized: boolean; originalDimensions: string; newDimensions: string; originalBytes: number; newBytes: number }> {
  const metadata = await sharp(buffer).metadata();
  const { width = 0, height = 0 } = metadata;

  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { buffer, wasResized: false, originalDimensions: `${width}x${height}`, newDimensions: `${width}x${height}`, originalBytes: buffer.length, newBytes: buffer.length };
  }

  const resized = await sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
  const newMeta = await sharp(resized).metadata();

  return {
    buffer: resized, wasResized: true,
    originalDimensions: `${width}x${height}`, newDimensions: `${newMeta.width}x${newMeta.height}`,
    originalBytes: buffer.length, newBytes: resized.length,
  };
}
