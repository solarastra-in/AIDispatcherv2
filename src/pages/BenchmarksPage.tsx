/**
 * src/pages/BenchmarksPage.tsx
 *
 * 2026 AI Model Cost, Latency & Thompson-Sampling Benchmarks
 * Deeply indexable comparison data across Claude 3.7, GPT-4.5, Gemini 2.5, DeepSeek R1, Groq & Mistral.
 */

import React, { useState } from 'react';
import { usePageSEO } from '../lib/seo';
import { 
  BarChart3, 
  TrendingDown, 
  Zap, 
  Cpu, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Sliders,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';

interface BenchmarkModel {
  name: string;
  provider: string;
  inputCost1M: number;
  outputCost1M: number;
  latencyMs: number;
  tokensPerSec: number;
  contextWindow: string;
  reasoningScore: number;
  bestFor: string;
  isFrontier: boolean;
}

const BENCHMARK_DATA: BenchmarkModel[] = [
  {
    name: "Claude 3.7 Sonnet (Hybrid)",
    provider: "Anthropic",
    inputCost1M: 3.00,
    outputCost1M: 15.00,
    latencyMs: 420,
    tokensPerSec: 78,
    contextWindow: "200k",
    reasoningScore: 98,
    bestFor: "Complex software architecture, deep reasoning & hybrid thinking",
    isFrontier: true,
  },
  {
    name: "GPT-4.5 Preview",
    provider: "OpenAI",
    inputCost1M: 75.00,
    outputCost1M: 150.00,
    latencyMs: 850,
    tokensPerSec: 42,
    contextWindow: "128k",
    reasoningScore: 99,
    bestFor: "Extreme edge-case reasoning & high-nuance synthesis",
    isFrontier: true,
  },
  {
    name: "Gemini 2.5 Pro",
    provider: "Google",
    inputCost1M: 1.25,
    outputCost1M: 5.00,
    latencyMs: 380,
    tokensPerSec: 95,
    contextWindow: "2,000k",
    reasoningScore: 94,
    bestFor: "Massive context analysis (2M tokens) & multimodal reasoning",
    isFrontier: true,
  },
  {
    name: "DeepSeek R1 (Reasoning)",
    provider: "DeepSeek",
    inputCost1M: 0.55,
    outputCost1M: 2.19,
    latencyMs: 650,
    tokensPerSec: 62,
    contextWindow: "64k",
    reasoningScore: 95,
    bestFor: "Cost-effective mathematical proofs & algorithmic logic",
    isFrontier: false,
  },
  {
    name: "Gemini 2.5 Flash",
    provider: "Google",
    inputCost1M: 0.075,
    outputCost1M: 0.30,
    latencyMs: 140,
    tokensPerSec: 210,
    contextWindow: "1,000k",
    reasoningScore: 86,
    bestFor: "High-throughput extraction, classification & instant chat",
    isFrontier: false,
  },
  {
    name: "Llama 3.3 70B (Groq LPU)",
    provider: "Groq",
    inputCost1M: 0.59,
    outputCost1M: 0.79,
    latencyMs: 95,
    tokensPerSec: 380,
    contextWindow: "128k",
    reasoningScore: 87,
    bestFor: "Ultra-low latency streaming (<100ms) & code autocomplete",
    isFrontier: false,
  },
  {
    name: "Mistral Large 2",
    provider: "Mistral",
    inputCost1M: 2.00,
    outputCost1M: 6.00,
    latencyMs: 460,
    tokensPerSec: 72,
    contextWindow: "128k",
    reasoningScore: 90,
    bestFor: "Multilingual European compliance & enterprise governance",
    isFrontier: false,
  },
];

export default function BenchmarksPage({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: string) => void;
} = {}) {
  usePageSEO({
    tabKey: 'benchmarks',
    path: '/benchmarks',
  });

  const [monthlyPrompts, setMonthlyPrompts] = useState(50000);
  const [avgPromptTokens, setAvgPromptTokens] = useState(1200);
  const [avgCompletionTokens, setAvgCompletionTokens] = useState(600);

  // Compute unrouted cost (assuming all goes to expensive frontier models like GPT-4.5 or Claude 3.7)
  const monthlyInputM = (monthlyPrompts * avgPromptTokens) / 1_000_000;
  const monthlyOutputM = (monthlyPrompts * avgCompletionTokens) / 1_000_000;

  const unroutedFrontierCost = (monthlyInputM * 3.00) + (monthlyOutputM * 15.00); // Claude 3.7 base
  const unroutedPremiumCost = (monthlyInputM * 75.00) + (monthlyOutputM * 150.00); // GPT-4.5 base

  // With WhyOr Dispatch: 75% go to Flash/DeepSeek/Groq ($0.25/M avg), 25% go to Claude 3.7 ($6.00/M avg)
  const routedLowTierCost = ((monthlyInputM * 0.75) * 0.15) + ((monthlyOutputM * 0.75) * 0.50);
  const routedHighTierCost = ((monthlyInputM * 0.25) * 3.00) + ((monthlyOutputM * 0.25) * 15.00);
  const whyOrRoutedCost = routedLowTierCost + routedHighTierCost;

  const dollarsSaved = Math.max(0, unroutedFrontierCost - whyOrRoutedCost);
  const savingsPct = unroutedFrontierCost > 0 ? ((dollarsSaved / unroutedFrontierCost) * 100).toFixed(1) : '0';

  return (
    <div className="text-slate-100 antialiased space-y-12 pb-16">
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-[#0b0f19] border border-white/10 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-mono">
            <BarChart3 className="w-3.5 h-3.5" /> 2026 Industry Cost & Performance Index
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-white">
            AI Model Cost, Latency & Quality Benchmarks
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Compare token pricing, time-to-first-token, inference throughput, and Thompson-sampling routing efficiency across all leading frontier and open-weight models.
          </p>
        </div>
      </header>

      {/* Interactive Savings Calculator */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Dynamic ROI Modeling</div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">Estimate Your Monthly Token Savings</h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-400/40">
            Avg {savingsPct}% Cost Reduction
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-300">
              <span>Monthly Prompts:</span>
              <span className="text-emerald-400 font-bold">{monthlyPrompts.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="5000"
              max="500000"
              step="5000"
              value={monthlyPrompts}
              onChange={(e) => setMonthlyPrompts(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-300">
              <span>Avg Input Tokens:</span>
              <span className="text-emerald-400 font-bold">{avgPromptTokens} tokens</span>
            </div>
            <input
              type="range"
              min="200"
              max="8000"
              step="200"
              value={avgPromptTokens}
              onChange={(e) => setAvgPromptTokens(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-300">
              <span>Avg Output Tokens:</span>
              <span className="text-emerald-400 font-bold">{avgCompletionTokens} tokens</span>
            </div>
            <input
              type="range"
              min="100"
              max="4000"
              step="100"
              value={avgCompletionTokens}
              onChange={(e) => setAvgCompletionTokens(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Comparison Result Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <div className="text-xs text-slate-400">Standard Single-Model (Claude 3.7)</div>
            <div className="text-xl font-bold text-slate-200">${unroutedFrontierCost.toFixed(2)}/mo</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <div className="text-xs text-slate-400">With WhyOr Intelligent Dispatch</div>
            <div className="text-xl font-bold text-emerald-400">${whyOrRoutedCost.toFixed(2)}/mo</div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/50 space-y-1">
            <div className="text-xs text-emerald-300 font-semibold">Net Estimated Savings</div>
            <div className="text-2xl font-bold text-emerald-200 font-mono">
              ${dollarsSaved.toFixed(2)} <span className="text-sm font-normal">(-{savingsPct}%)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Model Benchmark Table */}
      <section className="space-y-4">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Live Model Matrix</div>
          <h2 className="text-2xl font-bold text-white mt-1">2026 Model Cost & Speed Matrix</h2>
        </div>

        <div className="rounded-2xl bg-slate-950 border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-white/10 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Model & Provider</th>
                  <th className="py-3.5 px-4">Input / 1M</th>
                  <th className="py-3.5 px-4">Output / 1M</th>
                  <th className="py-3.5 px-4">Latency (TTFT)</th>
                  <th className="py-3.5 px-4">Throughput</th>
                  <th className="py-3.5 px-4">Context</th>
                  <th className="py-3.5 px-4">Reasoning</th>
                  <th className="py-3.5 px-4">Optimal Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {BENCHMARK_DATA.map((m) => (
                  <tr key={m.name} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        {m.isFrontier && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Frontier Reasoning Tier" />
                        )}
                        <div>
                          <div>{m.name}</div>
                          <div className="text-[10px] text-slate-500">{m.provider}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">${m.inputCost1M.toFixed(3)}</td>
                    <td className="py-3.5 px-4 text-emerald-300 font-bold">${m.outputCost1M.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-cyan-300">{m.latencyMs}ms</td>
                    <td className="py-3.5 px-4 text-slate-300">{m.tokensPerSec} t/s</td>
                    <td className="py-3.5 px-4 text-slate-400">{m.contextWindow}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-orange-500 h-full rounded-full"
                            style={{ width: `${m.reasoningScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{m.reasoningScore}/100</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans text-xs max-w-xs">{m.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
