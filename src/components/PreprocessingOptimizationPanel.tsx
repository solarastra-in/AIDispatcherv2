/**
 * src/components/PreprocessingOptimizationPanel.tsx
 *
 * New. Shows what actually happened to an uploaded file before dispatch
 * — method used, tokens before/after, and honestly, when preprocessing
 * was skipped and why (a scanned PDF, a corrupted file, a JS-rendered
 * page with nothing to extract). Skipped is shown as a normal, expected
 * outcome, not an error state — the whole design principle of this
 * pipeline is that skipping is the correct behavior when extraction
 * isn't trustworthy, not a failure to hide.
 */
import { useEffect, useState } from "react";
import { authedFetch } from "../lib/firebaseClient";

interface PreprocessResult {
  wasPreprocessed: boolean;
  skippedReason: string | null;
  method: string;
  originalTokenEstimate: number;
  processedTokenEstimate: number;
  tokensSaved: number;
  percentSaved: number;
  estimatedVisionCostIfUnprocessed: number | null;
  imageDownscale: { originalDimensions: string; newDimensions: string; bytesSaved: number; percentBytesSaved: number } | null;
}

export default function PreprocessingOptimizationPanel({
  filename,
  mimeType,
  base64Data,
}: {
  filename: string;
  mimeType: string;
  base64Data: string;
}) {
  const [result, setResult] = useState<PreprocessResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch("/api/preprocess/file", { method: "POST", body: JSON.stringify({ filename, mimeType, base64Data }) })
      .then((r) => r.json())
      .then(setResult)
      .finally(() => setLoading(false));
  }, [filename, base64Data]);

  if (loading) return <p className="text-[10px] text-[#5B6169]">Checking preprocessing…</p>;
  if (!result) return null;

  if (!result.wasPreprocessed) {
    return (
      <p className="text-[10px] text-[#5B6169] mt-1">
        Sent as-is — {result.skippedReason}
      </p>
    );
  }

  return (
    <div className="mt-1.5 text-[10px]">
      <div className="flex items-center gap-2 text-[#4FD1C5]">
        <span className="font-mono">{result.method}</span>
        <span>{result.originalTokenEstimate} → {result.processedTokenEstimate} tokens</span>
        <span className="font-mono">({result.percentSaved}% saved)</span>
      </div>
      {result.estimatedVisionCostIfUnprocessed && (
        <p className="text-[#5B6169] mt-0.5">
          vs. ~{result.estimatedVisionCostIfUnprocessed} tokens if sent as page images instead
        </p>
      )}
      {result.imageDownscale && (
        <p className="text-[#5B6169] mt-0.5">
          Resized {result.imageDownscale.originalDimensions} → {result.imageDownscale.newDimensions} ({result.imageDownscale.percentBytesSaved}% smaller)
        </p>
      )}
    </div>
  );
}
