/**
 * src/components/AnimatedPipeline.tsx
 *
 * Real, moving animation — the thing PowerPoint genuinely cannot deliver
 * through pptxgenjs (confirmed: the library exposes zero animation or
 * transition API on either the presentation or slide object). This is
 * where "AI animation" actually belongs: data particles travel along
 * the pipeline on a continuous loop, each node pulses with a soft glow,
 * and a faint neural-network backdrop drifts subtly — all real CSS
 * keyframe animation, not a static image.
 *
 * Self-contained: scoped <style> with @keyframes (Tailwind alone can't
 * express custom keyframes without touching the project's tailwind
 * config, which this patch doesn't assume access to) — a real, standard
 * technique for component-local animation in a Tailwind app.
 *
 * Respects prefers-reduced-motion — every animation pauses for users who
 * have that OS-level preference set, matching accessibility norms this
 * codebase has followed elsewhere (see the earlier landing page's own
 * prefers-reduced-motion handling).
 */

const STAGES = [
  { id: "classify", label: "CLASSIFY", sub: "01", color: "#4FD1C5" },
  { id: "select", label: "SELECT", sub: "02", color: "#FF8A3D" },
  { id: "execute", label: "EXECUTE", sub: "03", color: "#4FD1C5" },
  { id: "remember", label: "REMEMBER", sub: "04", color: "#FF8A3D" },
];

export default function AnimatedPipeline() {
  return (
    <div className="relative bg-[#171B21] border border-[#2A2F38] rounded-lg p-8 overflow-hidden">
      <style>{`
        @keyframes ap-travel {
          0%   { offset-distance: 0%;   opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @keyframes ap-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,138,61,0.35); }
          50%      { box-shadow: 0 0 0 10px rgba(255,138,61,0); }
        }
        @keyframes ap-pulse-teal {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79,209,197,0.35); }
          50%      { box-shadow: 0 0 0 10px rgba(79,209,197,0); }
        }
        @keyframes ap-drift {
          0%   { transform: translateX(0) translateY(0); }
          50%  { transform: translateX(-6px) translateY(4px); }
          100% { transform: translateX(0) translateY(0); }
        }
        .ap-particle {
          offset-path: path("M 0 0 L 260 0");
          animation: ap-travel 2.6s linear infinite;
        }
        .ap-node-orange { animation: ap-pulse 2.4s ease-in-out infinite; }
        .ap-node-teal { animation: ap-pulse-teal 2.4s ease-in-out infinite; }
        .ap-bg-drift { animation: ap-drift 12s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ap-particle, .ap-node-orange, .ap-node-teal, .ap-bg-drift {
            animation: none !important;
          }
        }
      `}</style>

      {/* faint drifting background dots for ambiance — real motion, low opacity, not distracting */}
      <div className="absolute inset-0 opacity-[0.15] ap-bg-drift pointer-events-none" aria-hidden="true">
        <svg width="100%" height="100%" viewBox="0 0 800 300">
          {Array.from({ length: 18 }).map((_, i) => (
            <circle key={i} cx={(i * 53) % 800} cy={(i * 91) % 300} r="1.5" fill="#4FD1C5" />
          ))}
        </svg>
      </div>

      <div className="relative flex items-center justify-between">
        {STAGES.map((stage, i) => (
          <div key={stage.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center text-center relative">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                  i % 2 === 0 ? "ap-node-teal border-[#4FD1C5]" : "ap-node-orange border-[#FF8A3D]"
                } bg-[#0F1216]`}
              >
                <span className="text-[11px] font-mono text-[#93999F]">{stage.sub}</span>
              </div>
              <span className="mt-2 text-[11px] font-mono tracking-wide text-[#E7E9EC]">{stage.label}</span>
            </div>

            {i < STAGES.length - 1 && (
              <div className="relative flex-1 h-px bg-[#2A2F38] mx-2">
                {/* traveling particle — real CSS motion-path animation, staggered per connector */}
                <div
                  className="ap-particle absolute w-2 h-2 rounded-full"
                  style={{ backgroundColor: stage.color, animationDelay: `${i * 0.4}s`, top: "-3px" }}
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="relative mt-6 text-[11px] text-[#5B6169] text-center font-mono">
        Live routing pipeline — each dot represents a request moving through classify → select → execute → remember.
      </p>
    </div>
  );
}
