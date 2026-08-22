/**
 * src/pages/HowItWorks.tsx
 *
 * New, separately-routed page (not an anchor section on Home) — per the
 * request for "separate pages for better SEO." Distinct title,
 * description, and JSON-LD from the homepage, targeting how-it-works /
 * routing-explainer search intent specifically.
 */
import React from "react";
import { usePageSEO } from "../lib/seo";
import AnimatedPipeline from "../components/AnimatedPipeline";
import { Sparkles, ArrowRight, Zap, Cpu, Database, CheckCircle2, ShieldCheck, Play } from "lucide-react";

const PIPELINE = [
  { 
    tag: "01 · CLASSIFY", 
    title: "Understand the task & complexity tier", 
    body: "A semantic classifier scores the incoming request against 14 task archetypes and 5 complexity tiers by meaning rather than naive keyword matching. It catches intricate paraphrases, edge cases, and reasoning requirements.",
    icon: Sparkles,
    metrics: "Sub-5ms Latency • 14 Task Archetypes"
  },
  { 
    tag: "02 · SELECT", 
    title: "Thompson-Sampling Bayesian Model Selection", 
    body: "Every candidate model's live Beta(α,β) distribution is sampled. The cheapest model whose quality sample satisfies the task confidence threshold wins — automatically exploring alternatives without getting trapped in local optima.",
    icon: Cpu,
    metrics: "Beta(α,β) Quality Prior • Converges within ±1% of ground truth"
  },
  { 
    tag: "03 · EXECUTE", 
    title: "Direct Gateway or BYOS Local CLI Proxy", 
    body: "Dispatches the unified request to the target provider (Claude 3.7, GPT-4o, Gemini 2.5, DeepSeek, Mistral) or routes locally to your authenticated subscription proxy (Claude Pro / ChatGPT Plus) with $0 marginal cost.",
    icon: Zap,
    metrics: "18+ Providers • BYOK Direct Keys • BYOS Local CLI Proxy"
  },
  { 
    tag: "04 · REMEMBER", 
    title: "SHA-256 Context Ledger & Safe In-Chat Compression", 
    body: "The task outcome updates the routing model's quality priors. Conversational entities and state constraints are appended to an immutable SHA-256 hash-chain, while older dialogue turns are compressed safely.",
    icon: Database,
    metrics: "3,636 Tokens Saved per 30 Turns • Zero Fact Hallucination"
  },
];

export default function HowItWorks({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: string) => void;
} = {}) {
  usePageSEO({
    title: "How WhyOr Dispatch Works — Complexity-Based AI Model Routing",
    description: "A step-by-step look at how Dispatch classifies, routes, executes, and remembers each request — with real test results, not marketing claims.",
    path: "/how-it-works",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: "How WhyOr Dispatch Works",
      description: "Complexity-based AI model routing explained step by step, with real test results.",
      url: "https://ai.whyor.in/how-it-works",
    },
  });

  return (
    <div className="text-slate-100 antialiased selection:bg-orange-500 selection:text-white space-y-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-white/10 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> 4-Stage Architectural Pipeline
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Four deterministic steps between your prompt and the optimized response.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Routing runs as a thin, ultra-low-latency decision layer in front of whichever models you already use. Every decision is mathematically explainable, Bayesian-calibrated, and fully audited.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigateTab ? onNavigateTab('dispatch') : null}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Test Live in Dispatch Console
            </button>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('examples') : null}
              className="border border-white/15 hover:border-white/30 text-white text-sm px-5 py-3.5 rounded-xl cursor-pointer transition-all backdrop-blur-md flex items-center gap-2"
            >
              View Real Payload Benchmarks <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Visual Animated Pipeline */}
      <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Interactive Particle State Pipeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual representation of request lifecycle, from semantic tokenization to immutable ledger anchoring.
            </p>
          </div>
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-400/20">
            Avg Routing Overhead: ~4.8ms
          </span>
        </div>
        <AnimatedPipeline />
      </div>

      {/* 4 Pipeline Stages Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PIPELINE.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div 
              key={step.tag} 
              className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-7 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-cyan-400 font-bold px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-400/20">
                    {step.tag}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mt-1">{step.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-2.5">{step.body}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {step.metrics}
                </span>
                <span className="text-slate-500">Step {idx + 1}/4</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verified in Testing Section */}
      <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Verified in Automated Testing & Production</h2>
        </div>
        <p className="text-sm text-slate-300 max-w-2xl">
          Every efficiency claim and algorithm parameter is rigorously validated against synthetic adversarial benchmarks and real multi-turn production dialogue:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5">
            <div className="text-2xl font-mono font-bold text-cyan-400">±1.0 pt</div>
            <div className="text-xs text-slate-300 font-semibold">Bayesian Convergence</div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Learned Beta distribution converged within 1 point of ground truth after 300 test runs.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5">
            <div className="text-2xl font-mono font-bold text-emerald-400">3,636</div>
            <div className="text-xs text-slate-300 font-semibold">Tokens Saved / 30 Turns</div>
            <p className="text-[11px] text-slate-400 leading-snug">
              In-chat semantic compression saved 62.5% of payload volume with 0 entity loss.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5">
            <div className="text-2xl font-mono font-bold text-amber-400">57.2% – 99.2%</div>
            <div className="text-xs text-slate-300 font-semibold">Preprocessing Reduction</div>
            <p className="text-[11px] text-slate-400 leading-snug">
              11-format preprocessor strips visual tiling tokens, deduplicates server logs, and prunes AST code.
            </p>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => onNavigateTab ? onNavigateTab('examples') : null}
            className="text-sm font-semibold text-orange-400 hover:text-orange-300 underline cursor-pointer flex items-center gap-1"
          >
            See the full worked examples with real request/response payloads →
          </button>
          <button
            onClick={() => onNavigateTab ? onNavigateTab('workspace') : null}
            className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
          >
            Open Workspace Studio
          </button>
        </div>
      </div>
    </div>
  );
}
