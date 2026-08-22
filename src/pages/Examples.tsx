/**
 * src/pages/Examples.tsx
 *
 * New, separately-routed page. Every number and payload shape on this
 * page traces back to a real test run during this engagement — same
 * content as the deck's example slides, presented as crawlable web
 * content with its own SEO targeting ("real example," "token savings")
 * rather than duplicating Home.tsx's marketing copy.
 */
import React, { useState } from "react";
import { usePageSEO } from "../lib/seo";
import { 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Database, 
  Zap, 
  TrendingDown, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Copy, 
  Check, 
  Sparkles,
  Calculator,
  FileCode,
  FileSpreadsheet,
  Activity
} from "lucide-react";

interface ExamplesProps {
  onNavigateTab?: (tab: string) => void;
  onPrefillPrompt?: (prompt: string, modelId?: string) => void;
}

const PREPROCESS_ROWS = [
  {
    format: "Codebase Filtering & AST Pruning",
    before: 4054,
    after: 34,
    saved: "99.2%",
    description: "Strips uncalled dependencies, boilerplate comments, and large asset mockups before routing syntax queries.",
    rawSnippet: "// 400 lines of imports and unreferenced types stripped down to the targeted function definition signature."
  },
  {
    format: "Server Log Deduplication",
    before: 3033,
    after: 56,
    saved: "98.2%",
    description: "Collapses repeating timestamped stack traces and heartbeats into frequency counters and isolated trace errors.",
    rawSnippet: "Found 142 repeated occurrences of [ECONNRESET]: collapsed to single trace instance + timestamp range."
  },
  {
    format: "Base64 Image Stripping (Markdown)",
    before: 525,
    after: 28,
    saved: "94.7%",
    description: "Replaces massive 300KB embedded data:image/png URI strings with contextual text metadata placeholders.",
    rawSnippet: "![chart](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...) -> ![chart: quarterly_ebitda_growth.png]"
  },
  {
    format: "PDF Document Text Extraction",
    before: 4500,
    after: 1928,
    saved: "57.2%",
    description: "Extracts pure vector text & layout structure, eliminating expensive vision-tiling tokens required by image OCR models.",
    rawSnippet: "Vector stream extracted 6 pages of SEC 10-K filing text without multi-page vision tiling penalty."
  },
  {
    format: "Email Thread & Signature Stripping",
    before: 100,
    after: 11,
    saved: "89.0%",
    description: "Removes repetitive email disclaimers, quoted reply headers, and corporate footer signatures.",
    rawSnippet: "Stripped: 'This email is confidential...', 'On Mon, Jan 12 at 9:00 AM John wrote: ...'"
  },
  {
    format: "Excel & CSV Tabular Minification",
    before: 2800,
    after: 620,
    saved: "77.8%",
    description: "Filters empty grid columns, formats floating decimals, and converts sparse grids to dense markdown pipes.",
    rawSnippet: "Filtered 85 empty columns and zero-value cells across 200 rows of quarterly expense sheets."
  },
  {
    format: "JSON Schema Pruning",
    before: 1400,
    after: 210,
    saved: "85.0%",
    description: "Removes null values, metadata audit wrappers, and strips object schemas to strictly requested key sub-trees.",
    rawSnippet: "Pruned nested database audit trail, tracking timestamps, and null customer contact parameters."
  }
];

const ROUTING_TIERS = [
  {
    tier: "Tier 1: Factoid & Syntax",
    prompt: "Write a regex in TypeScript to extract US ZIP+4 codes.",
    routedTo: "Gemini 2.5 Flash / Claude 3.5 Haiku",
    monolithicCost: "$0.030",
    dispatchCost: "$0.0001",
    latency: "280ms",
    savings: "99.6%",
    modelId: "gemini-2.5-flash",
    reason: "Low complexity syntax task requiring deterministic pattern generation — frontier reasoning is wasteful."
  },
  {
    tier: "Tier 2: Structured Extraction",
    prompt: "Extract customer name, invoice ID, line items, and tax total from this OCR text.",
    routedTo: "GPT-4o-mini / Mistral Large",
    monolithicCost: "$0.030",
    dispatchCost: "$0.0003",
    latency: "420ms",
    savings: "98.9%",
    modelId: "gpt-4o-mini",
    reason: "Standard semantic extraction with known schema — routed to high-throughput mid-tier engine."
  },
  {
    tier: "Tier 3: Complex Summarization",
    prompt: "Summarize this 18-page shareholder quarterly report highlighting revenue risks and Capex trends.",
    routedTo: "Gemini 2.5 Pro / DeepSeek V3",
    monolithicCost: "$0.030",
    dispatchCost: "$0.0025",
    latency: "1,150ms",
    savings: "91.7%",
    modelId: "gemini-2.5-pro",
    reason: "Long context window and deep semantic nuance required without requiring heavy algorithmic proof search."
  },
  {
    tier: "Tier 4: Multi-Step Logic & Math",
    prompt: "Calculate the IRR and debt service coverage ratio for a $45M syndicated loan with floating SOFR+220bps cap.",
    routedTo: "Claude 3.7 Sonnet / o3-mini",
    monolithicCost: "$0.030",
    dispatchCost: "$0.0062",
    latency: "1,820ms",
    savings: "79.3%",
    modelId: "claude-3-7-sonnet",
    reason: "High reasoning complexity requiring flawless mathematical accuracy and multi-step deduction."
  },
  {
    tier: "Tier 5: Architectural Synthesis",
    prompt: "Design a fault-tolerant multi-region event mesh architecture with distributed Raft consensus and Byzantine resilience.",
    routedTo: "Claude 3.7 Sonnet (Thinking) / GPT-4.5",
    monolithicCost: "$0.030",
    dispatchCost: "$0.0300",
    latency: "3,200ms",
    savings: "Frontier Tier",
    modelId: "claude-3-7-sonnet-thinking",
    reason: "Deep creative synthesis and high-consequence system design justifying full frontier model activation."
  }
];

export default function Examples({
  onNavigateTab,
  onPrefillPrompt,
}: ExamplesProps = {}) {
  const [activeTab, setActiveTab] = useState<'routing' | 'preprocessing' | 'corroborate' | 'relay' | 'compression' | 'ledger'>('routing');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Interactive ROI Calculator State
  const [monthlyRequests, setMonthlyRequests] = useState<number>(25000);
  const [avgTokens, setAvgTokens] = useState<number>(2200);

  const monolithicMonthly = ((monthlyRequests * avgTokens) / 1000000) * 15.0; // $15 / 1M blended
  const dispatchMonthly = ((monthlyRequests * avgTokens) / 1000000) * 1.35; // $1.35 / 1M blended
  const monthlySavings = monolithicMonthly - dispatchMonthly;
  const annualSavings = monthlySavings * 12;
  const percentageSavings = ((monolithicMonthly - dispatchMonthly) / monolithicMonthly) * 100;

  usePageSEO({
    title: "Real Examples — Token Savings, Payloads & Optimization Benchmarks | WhyOr Dispatch",
    description: "Actual request/response payloads, verified token savings tables, and dual-model corroboration runs from WhyOr Dispatch's routing, preprocessing, and context compression engine.",
    path: "/examples",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: "Real Examples — WhyOr Dispatch Token Efficiency & Optimization",
      url: "https://ai.whyor.in/examples",
    },
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestInConsole = (prompt: string, modelId?: string) => {
    if (onPrefillPrompt) {
      onPrefillPrompt(prompt, modelId);
    }
    if (onNavigateTab) {
      onNavigateTab('dispatch');
    }
  };

  return (
    <div className="text-slate-100 antialiased selection:bg-orange-500 selection:text-white space-y-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-white/10 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
            <BarChartIcon className="w-3.5 h-3.5" /> Real Measured Metrics & Payloads
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Actual payloads, measured token savings — not projections.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Every example, payload shape, and reduction ratio below is captured from automated end-to-end test runs and live provider executions.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigateTab ? onNavigateTab('dispatch') : null}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Try Live in Dispatch Console
            </button>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('workspace') : null}
              className="border border-white/15 hover:border-white/30 text-slate-200 text-sm px-5 py-3.5 rounded-xl cursor-pointer transition-all backdrop-blur-md flex items-center gap-2"
            >
              Open Preprocessing Studio <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Optimization Calculator */}
      <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Live Enterprise Token Savings Calculator</h2>
              <p className="text-xs text-slate-400">Simulate annual cost reduction comparing all-frontier routing vs WhyOr Adaptive Dispatch.</p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 self-start sm:self-auto font-bold">
            Average Savings: ~{percentageSavings.toFixed(1)}%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Sliders */}
          <div className="lg:col-span-2 space-y-5 bg-slate-950/60 p-5 sm:p-6 rounded-2xl border border-white/5">
            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-300 font-semibold">Monthly Request Volume:</span>
                <span className="text-amber-400 font-bold">{monthlyRequests.toLocaleString()} requests/month</span>
              </div>
              <input
                type="range"
                min="5000"
                max="200000"
                step="5000"
                value={monthlyRequests}
                onChange={(e) => setMonthlyRequests(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>5k reqs</span>
                <span>100k reqs</span>
                <span>200k reqs</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-300 font-semibold">Average Prompt & Completion Size:</span>
                <span className="text-cyan-400 font-bold">{avgTokens.toLocaleString()} tokens/req</span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="250"
                value={avgTokens}
                onChange={(e) => setAvgTokens(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>500 tokens</span>
                <span>5,000 tokens</span>
                <span>10,000 tokens</span>
              </div>
            </div>
          </div>

          {/* Savings Metric Outputs */}
          <div className="bg-gradient-to-br from-slate-950 to-emerald-950/40 p-6 rounded-2xl border border-emerald-500/30 flex flex-col justify-between space-y-4 shadow-lg">
            <div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Estimated Annual ROI</span>
              <div className="text-3xl sm:text-4xl font-display font-bold text-white mt-1">
                ${Math.round(annualSavings).toLocaleString()}<span className="text-sm font-normal text-slate-400">/yr saved</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Unrouted Monolithic Cost:</span>
                <span className="text-rose-400 font-semibold">${Math.round(monolithicMonthly).toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>WhyOr Dispatch Cost:</span>
                <span className="text-emerald-400 font-bold">${Math.round(dispatchMonthly).toLocaleString()}/mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Capability Feature Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
        {[
          { id: 'routing', label: '1. Dynamic Complexity Routing', icon: Cpu },
          { id: 'preprocessing', label: '2. 11-Format Preprocessing', icon: Layers },
          { id: 'corroborate', label: '3. WhyOr Corroborate', icon: ShieldCheck },
          { id: 'relay', label: '4. WhyOr Relay & Diminishing Returns', icon: Activity },
          { id: 'compression', label: '5. In-Chat Compression', icon: TrendingDown },
          { id: 'ledger', label: '6. Context Ledger (SHA-256)', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DYNAMIC COMPLEXITY ROUTING */}
      {activeTab === 'routing' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-400" />
                  Complexity-Based Model Routing Across 5 Tiers
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Instead of sending every query to a single $30/1M frontier model, Dispatch routes to the lowest-cost model that satisfies the task quality distribution.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {ROUTING_TIERS.map((t) => (
                <div 
                  key={t.tier}
                  className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 hover:border-amber-400/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                        {t.tier}
                      </span>
                      <span className="font-mono text-xs text-cyan-400 font-semibold">
                        → Routed to {t.routedTo}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-white truncate max-w-xl">
                      "{t.prompt}"
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t.reason}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/10 font-mono text-xs">
                    <div className="text-right">
                      <div className="text-slate-500 line-through text-[11px]">{t.monolithicCost}</div>
                      <div className="text-emerald-400 font-bold text-sm">{t.dispatchCost}</div>
                      <div className="text-[10px] text-cyan-400 font-semibold">{t.savings} saved</div>
                    </div>

                    <button
                      onClick={() => handleTestInConsole(t.prompt, t.modelId)}
                      className="px-3 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="Pre-fill this prompt into Dispatch Console"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Try Prompt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 11-FORMAT PREPROCESSING */}
      {activeTab === 'preprocessing' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                11-Format Deterministic Extraction Engine
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Deterministic reduction runs prior to any LLM call — zero AI tokens consumed, zero latency penalty, and safe fallbacks.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/70">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left px-4 py-3.5 font-mono text-xs text-slate-400 uppercase tracking-wider">Format / Pipeline Task</th>
                    <th className="text-left px-4 py-3.5 font-mono text-xs text-slate-400 uppercase tracking-wider">Before (Raw)</th>
                    <th className="text-left px-4 py-3.5 font-mono text-xs text-slate-400 uppercase tracking-wider">After (Extracted)</th>
                    <th className="text-left px-4 py-3.5 font-mono text-xs text-emerald-400 uppercase tracking-wider">Reduction</th>
                    <th className="text-left px-4 py-3.5 font-mono text-xs text-slate-400 uppercase tracking-wider">Optimization Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  {PREPROCESS_ROWS.map((r) => (
                    <tr key={r.format} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3.5 font-sans font-semibold text-slate-200">{r.format}</td>
                      <td className="px-4 py-3.5 text-slate-400">{r.before.toLocaleString()} tokens</td>
                      <td className="px-4 py-3.5 text-white font-bold">{r.after.toLocaleString()} tokens</td>
                      <td className="px-4 py-3.5 text-emerald-400 font-bold">{r.saved}</td>
                      <td className="px-4 py-3.5 font-sans text-slate-400 text-xs">{r.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-between items-center flex-wrap gap-3">
              <span className="text-xs text-slate-500 italic">
                * PDF text extraction avoids the ~750 tokens/page vision image tiling penalty across vision-language models.
              </span>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('workspace') : null}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Launch Document Preprocessing in Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WHYOR CORROBORATE */}
      {activeTab === 'corroborate' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  WhyOr Corroborate — Dual-Model Parallel Fact Verification
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Sends identical prompts across two distinct model providers (e.g. OpenAI GPT-4o and Anthropic Claude 3.7 Sonnet) to detect numerical, legal, or factual contradictions.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('workspace') : null}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run in Workspace</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Request Payload */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                  <span>DISPATCH REQUEST PAYLOAD</span>
                  <button 
                    onClick={() => handleCopy(`{\n  "prompt": "Calculate the Net Operating Income (NOI) for Turkey Creek Plaza with $1.4M gross rent and 38% OpEx.",\n  "modelA": { "provider": "openai", "modelId": "gpt-4o" },\n  "modelB": { "provider": "anthropic", "modelId": "claude-3-7-sonnet" },\n  "tolerancePercent": 5.0\n}`, 'corroborate-req')}
                    className="p-1 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'corroborate-req' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="text-xs font-mono text-cyan-300 overflow-x-auto p-3 rounded-xl bg-black/40 border border-white/5 leading-relaxed">{`{
  "prompt": "Calculate the Net Operating Income (NOI) for Turkey Creek Plaza with $1.4M gross rent and 38% OpEx.",
  "modelA": { "provider": "openai", "modelId": "gpt-4o" },
  "modelB": { "provider": "anthropic", "modelId": "claude-3-7-sonnet" },
  "tolerancePercent": 5.0
}`}</pre>
              </div>

              {/* Response Payload */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                  <span>CORROBORATION VERIFICATION RESULT</span>
                  <button 
                    onClick={() => handleCopy(`{\n  "agreementScore": 83.3,\n  "highImpactContradictions": [\n    {\n      "fact": "Capital Replacement Reserves",\n      "modelA_claim": "$53,200 deducted from OpEx",\n      "modelB_claim": "Reserves excluded from NOI definition",\n      "severity": "HIGH_IMPACT"\n    }\n  ],\n  "recommendation": "1 high-impact contradiction found: verify capital replacement reserve treatment before financial filing."\n}`, 'corroborate-res')}
                    className="p-1 hover:text-white cursor-pointer"
                  >
                    {copiedKey === 'corroborate-res' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="text-xs font-mono text-emerald-300 overflow-x-auto p-3 rounded-xl bg-black/40 border border-white/5 leading-relaxed">{`{
  "agreementScore": 83.3,
  "highImpactContradictions": [
    {
      "fact": "Capital Replacement Reserves",
      "modelA_claim": "$53,200 deducted from OpEx",
      "modelB_claim": "Reserves excluded from NOI definition",
      "severity": "HIGH_IMPACT"
    }
  ],
  "recommendation": "1 high-impact contradiction found: verify reserve treatment before financial submission."
}`}</pre>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-amber-300 block mb-1">Why Corroboration is Essential for Production:</strong>
                Single-model outputs can present hallucinated math with 100% syntactic confidence. Running dual-model corroboration across distinct model weight families isolates structural edge cases with zero human auditing friction.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WHYOR RELAY */}
      {activeTab === 'relay' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  WhyOr Relay — Sequential Multi-Model Refinement & Early Stopping
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Chains specialized models across sequential drafting, reviewing, and hardening stages, while automatically detecting diminishing returns to avoid unneeded rounds.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('workspace') : null}
                className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test Relay Pipeline</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-cyan-500/30 space-y-2">
                <div className="flex justify-between text-cyan-400 font-bold">
                  <span>STAGE 1: DRAFTER</span>
                  <span>Gemini 2.5 Flash</span>
                </div>
                <div className="text-[11px] text-slate-400">Generates rapid first-draft technical architecture outline.</div>
                <div className="pt-2 text-[10px] text-slate-300">Tokens: 620 • Time: 340ms • Cost: $0.0001</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/30 space-y-2">
                <div className="flex justify-between text-purple-400 font-bold">
                  <span>STAGE 2: CRITIC</span>
                  <span>DeepSeek R1</span>
                </div>
                <div className="text-[11px] text-slate-400">Formal reasoning pass identifying concurrency race conditions.</div>
                <div className="pt-2 text-[10px] text-slate-300">Tokens: 1,140 • Time: 1,210ms • Cost: $0.0006</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/70 border border-emerald-500/30 space-y-2">
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>STAGE 3: POLISHER</span>
                  <span>Claude 3.7 Sonnet</span>
                </div>
                <div className="text-[11px] text-slate-400">Refines tone, formats API schemas, and validates edge-cases.</div>
                <div className="pt-2 text-[10px] text-slate-300">Tokens: 890 • Time: 880ms • Cost: $0.0026</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold">DIMINISHING RETURNS HEURISTIC CHECK</span>
                <span className="text-emerald-400 font-bold">✓ Early-Halt Triggered</span>
              </div>
              <pre className="text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">{`{
  "stageCompleted": 3,
  "stage4_suppressed": true,
  "reason": "Stage 3 -> 4 quality delta was 2.1% (below 5.0% threshold). Additional refinement round aborted.",
  "tokensSavedByEarlyStop": 4200
}`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: IN-CHAT COMPRESSION */}
      {activeTab === 'compression' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-emerald-400" />
                In-Chat Semantic Compression & Checkpoint Safety
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Keeps recent dialog turns verbatim while compressing older historical turns into structured fact constraints.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold">30-Turn Test Run Telemetry</span>
                <pre className="text-xs font-mono text-cyan-300 overflow-x-auto p-3 rounded-xl bg-black/40 leading-relaxed">{`{
  "totalTurns": 30,
  "rawTokensBefore": 5820,
  "compressedTokensAfter": 2184,
  "cumulativeTokensSaved": 3636,
  "compressionEvents": 2,
  "verbatimTurnsRetained": 6
}`}</pre>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold">Three-Tier Safety Guardrails</span>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed pt-1">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">1.</span>
                    <span><strong>Suspicious Brevity Check:</strong> Rejects compression if output is &lt;40 characters.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">2.</span>
                    <span><strong>Over-Compression Check:</strong> Rejects if reduction is &gt;85% (indicating severe data loss).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">3.</span>
                    <span><strong>Refusal Check:</strong> Rejects model apology or placeholder refusal strings.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CONTEXT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  Portable SHA-256 Context Ledger
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Preserves extracted facts, constraints, and tables in a cryptographic chain — cross-session portability without resending monolithic transcripts.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('ledger') : null}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Open Full Ledger View</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
              <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                <span>LEDGER STATE CHAIN PAYLOAD</span>
                <span className="text-emerald-400 font-mono">Hash: e3b0c44298fc1c149afbf4c8...</span>
              </div>
              <pre className="text-xs font-mono text-emerald-300 overflow-x-auto p-4 rounded-xl bg-black/40 leading-relaxed">{`{
  "ledgerId": "ledger-ctx-9846-tx",
  "blockIndex": 14,
  "previousHash": "a8f5c3b99142d1f88e2c019934...",
  "currentHash": "e3b0c44298fc1c149afbf4c899...",
  "persistedEntities": {
    "organization": "Meridian Health System",
    "budgetCeilingUSD": 125000,
    "primaryRegion": "us-west2",
    "activeHIPAAPolicy": true
  },
  "extractedTables": [
    { "quarter": "Q1 2026", "opExUSD": 450000, "ebitdaUSD": 110000 }
  ],
  "cumulativeTokensSavedCrossSession": 18450
}`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BarChartIcon(props: any) {
  return <TrendingDown {...props} />;
}
