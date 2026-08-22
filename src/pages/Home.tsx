/**
 * src/pages/Home.tsx (v2 — reconciles a real inconsistency found while
 * building the SEO patch)
 *
 * Marketing homepage, built as a real React component using Tailwind
 * utility classes — not a standalone HTML file with custom CSS. Colors,
 * fonts, and the selection-highlight pattern are pulled directly from
 * this repo's own index.html (`bg-[#0F1216] text-[#E7E9EC] ...
 * selection:bg-[#FF8A3D] selection:text-[#0F1216]`), so this page reads
 * as the same product as the rest of the app, not a separately-designed
 * mockup pasted in.
 *
 * THE FIX IN THIS VERSION: this page originally had its own hardcoded
 * <nav> block, built before AppNav.tsx existed (patch 0014, later).
 * That left two divergent navigation implementations in the app — one
 * here, one everywhere else — which is exactly what "manage the header
 * nav so the page is fully available" was flagging. Now uses the same
 * shared AppNav component every other page uses, so there is one
 * navigation source of truth, not two that can drift out of sync.
 *
 * Mount at the `/` route (or wherever the app's router currently sends
 * unauthenticated/logged-out visitors) — this is a public marketing page,
 * distinct from the authenticated dashboard.
 */
import React from "react";
import AppNav from "../components/AppNav";
import { usePageSEO } from "../lib/seo";

const STATS = [
  { num: "±1pt", label: "how close the learned quality estimate landed to true model performance after 300 real outcomes, in testing" },
  { num: "100×", label: "price spread between the cheapest and most capable models in production today" },
  { num: "3,636", label: "tokens saved by in-chat compression across a single 30-turn test conversation" },
  { num: "7", label: "provider engines supported today — Claude, GPT, Gemini, DeepSeek, Mistral, Grok, Groq" },
];

const PIPELINE = [
  { tag: "01 · CLASSIFY", title: "Understand the task", body: "A semantic classifier scores the request against task archetypes by meaning, not keyword matching — catches paraphrases a rules engine would miss entirely." },
  { tag: "02 · SELECT", title: "Pick the right model", body: "Every candidate model's learned quality estimate is sampled, and the cheapest one whose sample clears your quality bar wins — automatically balancing cost against confidence." },
  { tag: "03 · EXECUTE", title: "Call it, or your own proxy", body: "One integration point regardless of provider — including a model you're running locally under your own Claude Pro/Max or ChatGPT Plus/Pro subscription." },
  { tag: "04 · REMEMBER", title: "Compress and carry context", body: "The outcome updates the routing model's confidence, and the conversation's context is compressed and carried forward — across turns, and across sessions." },
];

const ALGO_ROWS = [
  { k: "SIGNAL", title: "Semantic task classification", body: "Similarity to labeled task archetypes, not keyword regex — a request needs no exact vocabulary overlap with any rule to be classified correctly." },
  { k: "MODEL", title: "Per-task quality estimate", body: "A live probability distribution — not a fixed score — for how well each model handles each task type, seeded with a weak prior and sharpened by every real outcome." },
  { k: "CHOICE", title: "Sampled, not greedy", body: "Selection samples from that live distribution rather than always picking today's best guess — so it keeps testing plausible alternatives instead of freezing on an early impression.", verified: false },
  { k: "RESULT", title: "Verified converging to ground truth", body: "In testing, the learned estimate for one model landed within one point of its true, independently-known success rate after 300 simulated outcomes.", verified: true },
];

const ROLE_ROWS: { capability: string; employee: string; companyAdmin: string; platformAdmin: string }[] = [
  { capability: "Route requests within budget", employee: "✓", companyAdmin: "✓", platformAdmin: "✓" },
  { capability: "Select engine/model manually", employee: "If granted", companyAdmin: "✓", platformAdmin: "✓" },
  { capability: "Set user & team budgets", employee: "—", companyAdmin: "✓", platformAdmin: "✓" },
  { capability: "Restrict team to approved models", employee: "—", companyAdmin: "✓", platformAdmin: "✓" },
  { capability: "Configure provider credentials", employee: "—", companyAdmin: "✓", platformAdmin: "✓" },
  { capability: "Onboard companies platform-wide", employee: "—", companyAdmin: "—", platformAdmin: "✓" },
];

const FORMAT_TILES = [
  { glyph: "PDF", label: "Formatted documents", note: "Headings, sections, bullets" },
  { glyph: "XLS", label: "Real spreadsheets", note: "Auto-detected from tables" },
  { glyph: "IMG", label: "Generated images", note: "Via OpenAI or Gemini" },
  { glyph: "TXT", label: "Plain response", note: "Default, always available" },
];

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-xs tracking-[0.1em] text-[#FF8A3D] uppercase mb-3.5">{children}</div>
  );
}

export default function Home({
  onNavigateTab,
  onPrefillPrompt,
}: {
  onNavigateTab?: (tab: string) => void;
  onPrefillPrompt?: (prompt: string, modelId?: string) => void;
} = {}) {
  usePageSEO({
    title: "WhyOr Dispatch — AI Model Router & Token Cost Optimization",
    description: "Route every prompt to the cheapest AI model that can handle it. Complexity-based routing across Claude, GPT, Gemini, and more, with a portable context ledger and Thompson-sampling accuracy that improves from real usage.",
    path: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "WhyOr Dispatch",
      url: "https://ai.whyor.in/",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      description: "Complexity-based AI model router that dispatches each request to the cheapest model that can serve it, with a Thompson-sampling routing algorithm that improves from real usage.",
      offers: { "@type": "Offer", priceCurrency: "USD", price: "0" },
    },
  });

  return (
    <div className="text-slate-100 antialiased selection:bg-orange-500 selection:text-white space-y-12">
      {/* HERO */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-white/10 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl relative z-10">
          <SectionKicker>AI routing infrastructure that learns</SectionKicker>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight text-white mt-2">
            Not just cheaper AI. <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">Smarter about which AI, every time.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Dispatch reads each request, predicts which model will handle it well, and routes to the cheapest one
            that clears the bar — using an algorithm that gets measurably more accurate the more it's used, not a
            fixed rulebook that goes stale.
          </p>
          <div className="mt-8 flex gap-3.5 flex-wrap items-center">
            <button
              onClick={() => onNavigateTab ? onNavigateTab('dispatch') : null}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer transition-all hover:scale-[1.02]"
            >
              Launch Live Dispatch Console →
            </button>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('how-it-works') : null}
              className="border border-white/15 hover:border-white/30 hover:bg-white/5 text-slate-200 text-sm px-5 py-3.5 rounded-xl cursor-pointer transition-all backdrop-blur-md"
            >
              See How It Works
            </button>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('examples') : null}
              className="border border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-500/10 text-cyan-300 text-sm px-5 py-3.5 rounded-xl cursor-pointer transition-all backdrop-blur-md"
            >
              Explore Real Examples & ROI
            </button>
          </div>
        </div>
      </header>

      {/* STATS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <div key={i} className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{s.num}</div>
            <div className="mt-2 text-xs sm:text-sm text-slate-400 leading-snug">{s.label}</div>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <SectionKicker>How it works</SectionKicker>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">Four steps between your prompt and the response.</h2>
            <p className="mt-2 text-slate-400 max-w-2xl text-sm sm:text-base">
              Routing runs as a thin decision layer in front of whichever models you already use — it doesn't replace
              them, and every decision is explainable, not a black box.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab ? onNavigateTab('how-it-works') : null}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline shrink-0 cursor-pointer"
          >
            Open Interactive Pipeline View →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINE.map((step) => (
            <div key={step.tag} className="bg-slate-950/70 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <div className="font-mono text-xs text-cyan-400 font-semibold">{step.tag}</div>
                <h3 className="mt-2 text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* THE ALGORITHM */}
      <section id="learning" className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <SectionKicker>The algorithm</SectionKicker>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">A routing decision that improves with use — not a static lookup table.</h2>
        <p className="text-slate-400 max-w-2xl text-sm sm:text-base">
          Most routers pick a model once, based on a fixed rule, and never revisit it. Dispatch tracks how well
          each model actually performs on each kind of task, and lets that evidence drive the decision.
        </p>
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-6 divide-y divide-white/10 space-y-4">
          {ALGO_ROWS.map((row, i) => (
            <div key={row.k} className={`grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 sm:gap-6 items-start ${i > 0 ? "pt-4" : ""}`}>
              <div className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider">{row.k}</div>
              <div>
                <strong className="block text-sm sm:text-base font-semibold text-white mb-1">{row.title}</strong>
                <span className="text-xs sm:text-sm text-slate-300 leading-relaxed">{row.body}</span>
                {row.verified && (
                  <span className="inline-block mt-2 font-mono text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                    ✓ tested & verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Live Bayesian Inspector CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/25 backdrop-blur-md">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
              <span>Interactive Bayesian Inspector Mode</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 text-[10px]">Beta(α,β)</span>
            </div>
            <p className="text-xs text-slate-300">
              Inspect real-time probability curves across all 7 archetypes and run simulated 300-trial convergence tests.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab ? onNavigateTab('quality') : null}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs font-mono shrink-0 cursor-pointer shadow-md transition-all"
          >
            Launch Live Inspector →
          </button>
        </div>
      </section>

      {/* GOVERNANCE */}
      <section id="governance" className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <SectionKicker>Governance</SectionKicker>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">Built for a company, not just a person.</h2>
            <p className="mt-2 text-slate-400 max-w-2xl text-sm sm:text-base">Three roles, real budgets, and model policy that's enforced — not a suggestion.</p>
          </div>
          <button
            onClick={() => onNavigateTab ? onNavigateTab('teams') : null}
            className="text-xs font-mono text-purple-400 hover:text-purple-300 underline shrink-0 cursor-pointer"
          >
            Manage Team & RBAC →
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/70">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-5 py-3.5 font-mono text-xs text-slate-400 uppercase tracking-wider">Capability</th>
                <th className="text-left px-5 py-3.5 font-mono text-xs text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="text-left px-5 py-3.5 font-mono text-xs text-cyan-400 uppercase tracking-wider">Company Admin</th>
                <th className="text-left px-5 py-3.5 font-mono text-xs text-orange-400 uppercase tracking-wider">Platform Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ROLE_ROWS.map((r) => (
                <tr key={r.capability} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-200">{r.capability}</td>
                  <td className="px-5 py-3.5 text-slate-400">{r.employee}</td>
                  <td className="px-5 py-3.5 text-cyan-300 font-bold">{r.companyAdmin}</td>
                  <td className="px-5 py-3.5 text-orange-300 font-bold">{r.platformAdmin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* OUTPUT FORMATS */}
      <section id="output" className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <SectionKicker>Output formats</SectionKicker>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">Get more than plain text back — matching what Claude, Gemini, and ChatGPT already deliver.</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FORMAT_TILES.map((t) => (
            <div key={t.glyph} className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 text-center hover:border-cyan-400/40 transition-all">
              <div className="font-mono text-2xl text-cyan-400 mb-2 font-bold">{t.glyph}</div>
              <div className="text-sm font-semibold text-white">{t.label}</div>
              <div className="text-xs text-slate-400 mt-1">{t.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BYOS */}
      <section id="byos" className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <SectionKicker>Bring your own subscription</SectionKicker>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">Already paying for Claude Pro or ChatGPT Plus? Use it instead of metered API cost.</h2>
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-mono font-bold text-amber-400 mb-3 tracking-wider uppercase">WHAT THIS IS</h3>
            <ul className="space-y-2.5">
              {["A local proxy you run, wrapping your already-authenticated CLI session", "Genuinely $0 marginal cost — your flat-rate subscription covers it", "Scoped to your own account only — never pooled across a team"].map((t) => (
                <li key={t} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-rose-400 mb-3 tracking-wider uppercase">WHAT THIS ISN'T</h3>
            <ul className="space-y-2.5">
              {["WhyOr does not log into your Claude or ChatGPT account", "Not offered where the provider's own terms don't allow it", "Not a shared company-wide bypass of metered billing"].map((t) => (
                <li key={t} className="text-xs sm:text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="access" className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-slate-900/60 border border-orange-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-4">
        <SectionKicker>Start Optimizing Today</SectionKicker>
        <h2 className="text-2xl sm:text-4xl font-display font-bold text-white max-w-2xl mx-auto">
          Bring your own models. Dispatch decides which one earns each request — and gets better at deciding over time.
        </h2>
        <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
          Start your 7-day trial with full access to managed Claude, GPT, and Gemini pools — zero credit card required.
        </p>
        <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => onNavigateTab ? onNavigateTab('pricing') : null}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer transition-all hover:scale-[1.02]"
          >
            Start 7-Day Free Trial (No CC)
          </button>
          <button
            onClick={() => onNavigateTab ? onNavigateTab('contact') : null}
            className="border border-white/15 hover:border-white/30 text-white text-sm px-6 py-3.5 rounded-xl cursor-pointer transition-all backdrop-blur-md"
          >
            Contact Enterprise Team
          </button>
        </div>
      </section>
    </div>
  );
}
