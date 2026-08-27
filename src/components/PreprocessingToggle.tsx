/**
 * src/components/PreprocessingToggle.tsx
 *
 * New. Sits directly above the composer, next to the file-attach control
 * — lets the user opt out of preprocessing per-message (default: on).
 * Shows a live "X tokens saved" badge once files are attached and
 * checked, so the benefit is visible before sending, not just implied.
 *
 * Deliberately defaults ON: preprocessing already has its own
 * per-extractor safety fallback (a bad extraction skips itself and
 * falls back to the original — built and tested in the preceding
 * patch), so leaving it on by default doesn't risk losing content. The
 * toggle exists for cases where a user wants to guarantee the model
 * sees the literal original bytes — e.g. reviewing exact PDF formatting,
 * or debugging why an extraction looks off — not because the default is
 * unsafe.
 */
import { useEffect, useState } from "react";
import { authedFetch } from "../lib/firebaseClient";
import type { UploadedFile } from "./FileUploadZone";

interface PreviewStats {
  totalOriginalTokens: number;
  totalProcessedTokens: number;
  totalTokensSaved: number;
  percentSaved: number;
  perFile: { filename: string; wasPreprocessed: boolean; tokensSaved: number; skippedReason: string | null }[];
}

export default function PreprocessingToggle({
  enabled,
  onToggle,
  files,
}: {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  files: UploadedFile[];
}) {
  const [stats, setStats] = useState<PreviewStats | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (files.length === 0) {
      setStats(null);
      return;
    }
    if (!enabled) return; // don't bother computing savings for a preview the user has already opted out of

    let cancelled = false;
    setChecking(true);

    (async () => {
      const results = await Promise.all(
        files.map(async (f) => {
          try {
            const base64 = f.base64 || (await import("./FileUploadZone").then((m) => m.readAsBase64(f.file)));
            const res = await authedFetch("/api/preprocess/file", {
              method: "POST",
              body: JSON.stringify({ filename: f.file.name, mimeType: f.mimeType, base64Data: base64 }),
            });
            const data = await res.json();
            return { filename: f.file.name, wasPreprocessed: data.wasPreprocessed, tokensSaved: data.tokensSaved || 0, skippedReason: data.skippedReason, originalTokenEstimate: data.originalTokenEstimate || 0, processedTokenEstimate: data.processedTokenEstimate || 0 };
          } catch {
            return { filename: f.file.name, wasPreprocessed: false, tokensSaved: 0, skippedReason: "Preview check failed", originalTokenEstimate: 0, processedTokenEstimate: 0 };
          }
        })
      );
      if (cancelled) return;

      const totalOriginalTokens = results.reduce((s, r) => s + r.originalTokenEstimate, 0);
      const totalProcessedTokens = results.reduce((s, r) => s + (r.wasPreprocessed ? r.processedTokenEstimate : r.originalTokenEstimate), 0);
      const totalTokensSaved = results.reduce((s, r) => s + r.tokensSaved, 0);

      setStats({
        totalOriginalTokens, totalProcessedTokens, totalTokensSaved,
        percentSaved: totalOriginalTokens > 0 ? Math.round((totalTokensSaved / totalOriginalTokens) * 1000) / 10 : 0,
        perFile: results.map((r) => ({ filename: r.filename, wasPreprocessed: r.wasPreprocessed, tokensSaved: r.tokensSaved, skippedReason: r.skippedReason })),
      });
      setChecking(false);
    })();

    return () => { cancelled = true; };
  }, [files, enabled]);

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap py-1">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={`w-8 h-4.5 rounded-full relative transition-colors shrink-0 ${enabled ? "bg-orange-500" : "bg-slate-800"}`}
        >
          <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-slate-950 transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
        <span className="text-xs font-mono text-slate-400 whitespace-nowrap">Optimize files before sending (AST &amp; Deduplication)</span>
      </label>

      {enabled && files.length > 0 && (
        <span className="text-[11px] font-mono">
          {checking ? (
            <span className="text-slate-500">Checking savings…</span>
          ) : stats && stats.totalTokensSaved > 0 ? (
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ⚡ Saves ~{stats.totalTokensSaved} tokens ({stats.percentSaved}%)
            </span>
          ) : stats ? (
            <span className="text-slate-500">No AST compression delta</span>
          ) : null}
        </span>
      )}
      {!enabled && files.length > 0 && (
        <span className="text-[11px] font-mono text-slate-500">Sending files uncompressed</span>
      )}
    </div>
  );
}
