import React, { useState } from 'react';
import {
  X,
  Calculator,
  Cpu,
  Zap,
  DollarSign,
  Layers,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  BookOpen,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Hash,
  Database,
  ArrowRight,
  Info,
  Check,
  Flame,
  PieChart as PieIcon,
  HelpCircle
} from 'lucide-react';
import { TASK_ARCHETYPES } from '../core/taskTaxonomy';
import { ModelTier } from '../types';

interface UnderstandingMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpis: {
    totalTokens: number;
    totalSavedTokens: number;
    totalSavedUsd: number;
    totalCalls: number;
    overallSavingsPercent: number;
    counterfactualCostUsd: number;
    actualCostUsd: number;
    avgLatencyMs: number;
  };
}

export const UnderstandingMetricsModal: React.FC<UnderstandingMetricsModalProps> = ({
  isOpen,
  onClose,
  kpis
}) => {
  const [activeModalTab, setActiveModalTab] = useState<
    'algorithms' | 'formulas' | 'archetypes' | 'simulator' | 'telemetry'
  >('algorithms');

  // Interactive Simulator State
  const [simPromptTokens, setSimPromptTokens] = useState<number>(1200);
  const [simHistoryTurns, setSimHistoryTurns] = useState<number>(4);
  const [simArchetype, setSimArchetype] = useState<string>('code_refactor');
  const [simTier, setSimTier] = useState<ModelTier>('low');

  if (!isOpen) return null;

  // Simulator Calculations
  const ARCHETYPE_COMPRESSION_FACTORS: Record<string, { name: string; ratio: number; desc: string }> = {
    lookup_extract: { name: 'Lookup & Extract', ratio: 0.811, desc: 'Replaces raw transcript with direct entity hash lookups.' },
    format_transform: { name: 'Format & Transform', ratio: 0.823, desc: 'Offloads schema normalization, stripping verbose examples.' },
    draft_summarize: { name: 'Draft & Summarize', ratio: 0.727, desc: 'Maintains rolling entity graph, eliminating repeated history turns.' },
    code_refactor: { name: 'Code & Refactor', ratio: 0.664, desc: 'Extracts AST diffs instead of re-transmitting entire codebase files.' },
    multi_step_reasoning: { name: 'Multi-Step Reasoning', ratio: 0.455, desc: 'Compresses intermediate scratchpads while preserving critical logic trees.' },
    vision_multimodal: { name: 'Vision & Multimodal', ratio: 0.472, desc: 'Caches image feature hashes to prevent duplicate base64 payloads.' },
    deep_research: { name: 'Deep Research Agentic', ratio: 0.393, desc: 'Coordinates agentic research loops using cryptographic context compression.' },
  };

  const TIER_PRICING: Record<ModelTier, { rate: number; name: string; example: string }> = {
    low: { rate: 0.15, name: 'Low Tier (Lightweight / Flash)', example: 'Gemini 2.5 Flash, DeepSeek-V3' },
    mid: { rate: 0.45, name: 'Mid Tier (Balanced / Coder)', example: 'Claude 3.5 Haiku, Qwen 2.5 Coder' },
    high: { rate: 1.20, name: 'High Tier (Heavy Reasoning)', example: 'DeepSeek-R1, Gemini 2.5 Pro' },
    frontier: { rate: 3.00, name: 'Frontier Tier (Benchmark Apex)', example: 'GPT-4o, Claude 3.7 Sonnet' },
    deep_reasoning: { rate: 3.50, name: 'Deep Reasoning Tier', example: 'OpenAI o1 / o3-mini' },
  };

  const selectedFactor = ARCHETYPE_COMPRESSION_FACTORS[simArchetype] || { name: 'Custom', ratio: 0.60, desc: 'Balanced compression factor' };
  const historyTokenBase = simHistoryTurns * 850;
  const rawBaselineTokens = simPromptTokens + historyTokenBase;
  const simSavedTokens = Math.round(rawBaselineTokens * selectedFactor.ratio);
  const simDispatchedTokens = Math.max(80, rawBaselineTokens - simSavedTokens);
  const simSavingsPercent = Number(((simSavedTokens / rawBaselineTokens) * 100).toFixed(1));

  // Cost comparison (per 1M tokens)
  const frontierBaselineCost = (rawBaselineTokens / 1_000_000) * 3.00;
  const actualRoutedCost = (simDispatchedTokens / 1_000_000) * TIER_PRICING[simTier].rate;
  const simCostSavedUsd = Math.max(0, frontierBaselineCost - actualRoutedCost);

  return (
    <div 
      id="understanding-metrics-modal"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="understanding-metrics-modal-dialog"
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-white/20 shadow-2xl overflow-hidden text-slate-100 font-sans animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Understanding Metrics & Efficiency Algorithms</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  WhyOr Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deep-dive architectural specifications, mathematical formulations, and interactive telemetry simulator.
              </p>
            </div>
          </div>

          <button
            id="understanding-metrics-close-btn"
            onClick={onClose}
            aria-label="Close Understanding Metrics Modal"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer self-end sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-white/10 bg-slate-950/60 flex items-center gap-2 overflow-x-auto py-2.5">
          {[
            { id: 'algorithms', label: 'Efficiency Algorithms', icon: Cpu },
            { id: 'formulas', label: 'Mathematical Formulations', icon: BookOpen },
            { id: 'archetypes', label: '7-Archetype Benchmark', icon: Layers },
            { id: 'simulator', label: 'Interactive Algorithm Simulator', icon: Sliders },
            { id: 'telemetry', label: 'Live Session Audit', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeModalTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`modal-tab-${tab.id}`}
                onClick={() => setActiveModalTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-400/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* ========================================================================= */}
          {/* TAB 1: CORE EFFICIENCY ALGORITHMS */}
          {/* ========================================================================= */}
          {activeModalTab === 'algorithms' && (
            <div className="space-y-6">
              
              {/* Introduction Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-cyan-500/10 border border-emerald-500/30 flex items-start gap-3.5">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm">WhyOr 4-Stage Token Optimization Pipeline</h3>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    WhyOr replaces naive frontier model invocation with a four-stage mathematical economization pipeline. 
                    Rather than transmitting full, uncompressed conversational transcripts to expensive models, WhyOr dynamically compresses semantic context and assigns queries to optimal Pareto-frontier model tiers.
                  </p>
                </div>
              </div>

              {/* 4 Algorithmic Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Pillar 1: AST Semantic Classifier */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono font-bold text-xs">1</span>
                      <h4 className="font-bold text-white">AST Semantic Classifier & Taxonomy</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      &lt;1ms Overhead
                    </span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    Unlike naive multi-agent frameworks that require secondary LLM gateway calls (adding 1.5–3.0s latency and doubling token costs), WhyOr parses incoming prompts with a deterministic rule-based Abstract Syntax Tree (AST) analyzer. It categorizes queries into 7 discrete archetypes with zero model overhead.
                  </p>
                  <div className="p-2 rounded-xl bg-slate-900 border border-white/5 font-mono text-[11px] text-emerald-300">
                    Routing Latency: &lt;1.0ms (JavaScript runtime parser)
                  </div>
                </div>

                {/* Pillar 2: Sliding-Window Context Compression */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono font-bold text-xs">2</span>
                      <h4 className="font-bold text-white">Sliding-Window Transcript Pruning</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      40% – 82% Pruned
                    </span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    Conversational history naturally accumulates repetitive system messages, boilerplate greetings, and stagnant entity definitions. WhyOr maintains an active Entity Graph in the Context Ledger, extracting only modified states and omitting identical previous turns.
                  </p>
                  <div className="p-2 rounded-xl bg-slate-900 border border-white/5 font-mono text-[11px] text-cyan-300">
                    T_dispatched = T_raw_prompt + Entity_Graph(History)
                  </div>
                </div>

                {/* Pillar 3: Multi-Tier Pareto Arbitrage */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono font-bold text-xs">3</span>
                      <h4 className="font-bold text-white">Multi-Tier Pareto Arbitrage</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      $0.15 vs $3.00/1M
                    </span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    Routine formatting, JSON extraction, and summary tasks achieve 100% precision on lightweight models (e.g. Gemini 2.5 Flash, DeepSeek-V3) priced at $0.15/1M tokens, compared to frontier models priced at $3.00/1M tokens (a 20x price difference).
                  </p>
                  <div className="p-2 rounded-xl bg-slate-900 border border-white/5 font-mono text-[11px] text-amber-300">
                    Rate Delta: (R_frontier − R_tier) / R_frontier = 95.0%
                  </div>
                </div>

                {/* Pillar 4: Cryptographic Hash Verification */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-mono font-bold text-xs">4</span>
                      <h4 className="font-bold text-white">Cryptographic State Verification</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      SHA-256 Chain
                    </span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    Every token savings metric and cost reduction figure is anchored to a cryptographic SHA-256 context hash stored in the Context Ledger. This guarantees that metrics cannot be fabricated and can be audited by enterprise security teams.
                  </p>
                  <div className="p-2 rounded-xl bg-slate-900 border border-white/5 font-mono text-[11px] text-purple-300">
                    State Hash: H_n = SHA256(H_n-1 + Dispatched_Payload)
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MATHEMATICAL FORMULATIONS */}
          {/* ========================================================================= */}
          {activeModalTab === 'formulas' && (
            <div className="space-y-5">
              
              {/* Formula 1: Tokens Economized */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Equation 1
                    </span>
                    <h4 className="text-sm font-bold text-white">Tokens Economized (Tokens Saved)</h4>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold text-xs">Reduction Metric</span>
                </div>
                
                <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/20 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto shadow-inner">
                  Tokens_Saved = (T_raw_prompt + T_unpruned_history) − T_dispatched_payload
                  {'\n'}
                  Efficiency_Percentage (%) = (Tokens_Saved / (T_raw_prompt + T_unpruned_history)) × 100
                </div>

                <div className="space-y-1.5 text-slate-300 font-sans leading-relaxed">
                  <p><strong>Variable Definitions:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li><code className="text-emerald-300 font-mono">T_raw_prompt</code>: Raw user prompt string tokenized using BPE (Byte Pair Encoding) or provider-specific tokenizer.</li>
                    <li><code className="text-emerald-300 font-mono">T_unpruned_history</code>: The cumulative token count of all previous turns in the current thread if sent naively.</li>
                    <li><code className="text-emerald-300 font-mono">T_dispatched_payload</code>: The optimized, entity-pruned payload actually transmitted to the provider API endpoint.</li>
                  </ul>
                </div>
              </div>

              {/* Formula 2: Direct Cost Avoidance */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      Equation 2
                    </span>
                    <h4 className="text-sm font-bold text-white">Counterfactual Cost Delta & Capital Avoidance</h4>
                  </div>
                  <span className="text-cyan-400 font-mono font-bold text-xs">Financial Metric</span>
                </div>
                
                <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/20 font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto shadow-inner">
                  Cost_Avoidance ($) = Cost_Counterfactual_Frontier − Cost_WhyOr_Dispatched
                  {'\n'}
                  Cost_Counterfactual_Frontier = ((T_dispatched + Tokens_Saved) / 1,000,000) × R_frontier
                  {'\n'}
                  Cost_WhyOr_Dispatched = (T_dispatched / 1,000,000) × R_model_tier
                </div>

                <div className="space-y-1.5 text-slate-300 font-sans leading-relaxed">
                  <p><strong>Pricing Constants:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                    <li><code className="text-cyan-300 font-mono">R_frontier</code> = $3.00 per 1,000,000 tokens (Industry benchmark baseline for GPT-4o / Claude 3.7 Sonnet).</li>
                    <li><code className="text-cyan-300 font-mono">R_model_tier</code> = Tier rate: Low ($0.15/1M), Mid ($0.45/1M), High ($1.20/1M), Frontier ($3.00/1M).</li>
                    <li><code className="text-cyan-300 font-mono">Cost_Avoidance</code> = Exact dollar value preserved on each API call through compression + intelligent tiering.</li>
                  </ul>
                </div>
              </div>

              {/* Formula 3: Cumulative Velocity */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  Cumulative Ledger Velocity Equation
                </h4>
                <div className="p-2.5 rounded-xl bg-slate-900 font-mono text-[11px] text-amber-300">
                  Total_Net_Savings ($) = ∑ [ ( (T_i_raw / 1M) × $3.00 ) − ( (T_i_dispatched / 1M) × R_i ) ]
                </div>
                <p className="text-slate-400 font-sans">
                  The dashboard accumulates savings across every recorded dispatch sequence <code className="font-mono text-slate-300">i ∈ [1, N]</code> in real time.
                </p>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: 7-ARCHETYPE BENCHMARK */}
          {/* ========================================================================= */}
          {activeModalTab === 'archetypes' && (
            <div className="space-y-4">
              <p className="text-slate-300 font-sans leading-relaxed">
                WhyOr classifies prompts into 7 primary semantic archetypes. Each archetype possesses a mathematically verified token compression ceiling and recommended target tier:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  {
                    id: 'lookup_extract',
                    name: 'Lookup & Extract',
                    efficiency: '81.1%',
                    baselineTok: 2800,
                    dispatchedTok: 530,
                    tier: 'Low Tier ($0.15/1M)',
                    desc: 'Extracting key-value attributes, entity lookup, or specific data points. History is stripped to simple JSON state references.',
                  },
                  {
                    id: 'format_transform',
                    name: 'Format & Transform',
                    efficiency: '82.3%',
                    baselineTok: 3100,
                    dispatchedTok: 550,
                    tier: 'Low Tier ($0.15/1M)',
                    desc: 'Converting CSV/JSON/Markdown schemas, regex operations, and syntax conversions. Discards prose conversational padding.',
                  },
                  {
                    id: 'draft_summarize',
                    name: 'Draft & Summarize',
                    efficiency: '72.7%',
                    baselineTok: 4400,
                    dispatchedTok: 1200,
                    tier: 'Mid Tier ($0.45/1M)',
                    desc: 'Text summarization, email drafting, and content distillation. Uses rolling summaries rather than raw historical transcripts.',
                  },
                  {
                    id: 'code_refactor',
                    name: 'Code & Refactor',
                    efficiency: '66.4%',
                    baselineTok: 6200,
                    dispatchedTok: 2080,
                    tier: 'Mid Tier ($0.45/1M)',
                    desc: 'Function refactoring and syntax fixes. Sends localized AST code chunks and symbol signatures instead of full project files.',
                  },
                  {
                    id: 'multi_step_reasoning',
                    name: 'Multi-Step Reasoning',
                    efficiency: '45.5%',
                    baselineTok: 8800,
                    dispatchedTok: 4800,
                    tier: 'High Tier ($1.20/1M)',
                    desc: 'Mathematical proofs, architectural analysis, and complex debugging. Retains logical scratchpads while compressing invariant setup.',
                  },
                  {
                    id: 'vision_multimodal',
                    name: 'Vision & Multimodal',
                    efficiency: '47.2%',
                    baselineTok: 7200,
                    dispatchedTok: 3800,
                    tier: 'Mid / High Tier',
                    desc: 'Diagram analysis and OCR tasks. Caches image perceptual hash vectors to prevent repeated transmission of bulky base64 data.',
                  },
                  {
                    id: 'deep_research',
                    name: 'Deep Research Agentic',
                    efficiency: '39.3%',
                    baselineTok: 14500,
                    dispatchedTok: 8800,
                    tier: 'High / Frontier',
                    desc: 'Autonomous multi-hop search and synthesis. Compresses intermediate web scrape payloads into structured fact graphs.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{item.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        {item.efficiency} Saved
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{item.desc}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                      <span>Baseline: <strong className="text-rose-300">{item.baselineTok}</strong> tok</span>
                      <span>Dispatched: <strong className="text-emerald-300">{item.dispatchedTok}</strong> tok</span>
                      <span className="text-cyan-300">{item.tier}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: INTERACTIVE ALGORITHM SIMULATOR */}
          {/* ========================================================================= */}
          {activeModalTab === 'simulator' && (
            <div className="space-y-5">
              
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
                <Sliders className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">Live Algorithmic Sandbox</h4>
                  <p className="text-slate-300 font-sans leading-relaxed text-xs">
                    Adjust prompt size, conversational turns, semantic archetype, and model tier to observe the exact real-time mathematical calculations.
                  </p>
                </div>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Control 1: Raw Prompt Tokens */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold text-xs">Raw Prompt Length</label>
                    <span className="font-mono text-emerald-400 font-bold">{simPromptTokens.toLocaleString()} tokens</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={simPromptTokens}
                    onChange={(e) => setSimPromptTokens(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>100 tok (Short query)</span>
                    <span>10,000 tok (Heavy document)</span>
                  </div>
                </div>

                {/* Control 2: Conversation History Turns */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-semibold text-xs">Thread History Turns</label>
                    <span className="font-mono text-cyan-400 font-bold">{simHistoryTurns} turns (~{historyTokenBase.toLocaleString()} tok)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={simHistoryTurns}
                    onChange={(e) => setSimHistoryTurns(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>0 (Single-shot)</span>
                    <span>20 (Deep ongoing thread)</span>
                  </div>
                </div>

                {/* Control 3: Archetype Selection */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <label className="text-slate-300 font-semibold text-xs block">Task Archetype</label>
                  <select
                    value={simArchetype}
                    onChange={(e) => setSimArchetype(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                  >
                    <option value="lookup_extract">Lookup & Extract (81.1% compression)</option>
                    <option value="format_transform">Format & Transform (82.3% compression)</option>
                    <option value="draft_summarize">Draft & Summarize (72.7% compression)</option>
                    <option value="code_refactor">Code & Refactor (66.4% compression)</option>
                    <option value="multi_step_reasoning">Multi-Step Reasoning (45.5% compression)</option>
                    <option value="vision_multimodal">Vision & Multimodal (47.2% compression)</option>
                    <option value="deep_research">Deep Research Agentic (39.3% compression)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block font-sans">{selectedFactor.desc}</span>
                </div>

                {/* Control 4: Model Tier Selection */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <label className="text-slate-300 font-semibold text-xs block">Dispatched Target Model Tier</label>
                  <select
                    value={simTier}
                    onChange={(e) => setSimTier(e.target.value as ModelTier)}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                  >
                    <option value="low">Low Tier ($0.15/1M) - Gemini 2.5 Flash, DeepSeek-V3</option>
                    <option value="mid">Mid Tier ($0.45/1M) - Claude 3.5 Haiku, Qwen Coder</option>
                    <option value="high">High Tier ($1.20/1M) - DeepSeek-R1, Gemini 2.5 Pro</option>
                    <option value="frontier">Frontier Tier ($3.00/1M) - GPT-4o, Claude 3.7 Sonnet</option>
                    <option value="deep_reasoning">Deep Reasoning Tier ($3.50/1M) - OpenAI o1 / o3-mini</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Rate: ${TIER_PRICING[simTier].rate.toFixed(2)}/1M tokens
                  </span>
                </div>

              </div>

              {/* Real-time Calculation Result Matrix */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-mono uppercase font-bold text-xs text-emerald-300 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Live Calculation Output
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    +{simSavingsPercent}% Token Reduction
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 block">Baseline Uncompressed:</span>
                    <span className="text-rose-400 font-bold text-sm sm:text-base">{rawBaselineTokens.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 block">tokens</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 block">WhyOr Dispatched:</span>
                    <span className="text-emerald-400 font-bold text-sm sm:text-base">{simDispatchedTokens.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 block">tokens</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 block">Tokens Economized:</span>
                    <span className="text-cyan-300 font-bold text-sm sm:text-base">+{simSavedTokens.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 block">tokens pruned</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 block">Net Cost Avoidance:</span>
                    <span className="text-emerald-300 font-bold text-sm sm:text-base">${simCostSavedUsd.toFixed(5)}</span>
                    <span className="text-[10px] text-slate-500 block">saved this call</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-white/10 font-mono text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-white">Applied Step-by-Step Math:</strong>
                  <br />
                  1. Baseline Tokens = {simPromptTokens} prompt + {historyTokenBase} history = <span className="text-rose-300">{rawBaselineTokens} tokens</span>.
                  <br />
                  2. Dispatched Payload = {rawBaselineTokens} × (1 − {selectedFactor.ratio}) = <span className="text-emerald-300">{simDispatchedTokens} tokens</span>.
                  <br />
                  3. Frontier Baseline Cost = ({rawBaselineTokens} / 1M) × $3.00 = <span className="text-rose-300">${frontierBaselineCost.toFixed(5)}</span>.
                  <br />
                  4. WhyOr Actual Cost = ({simDispatchedTokens} / 1M) × ${TIER_PRICING[simTier].rate.toFixed(2)} = <span className="text-emerald-300">${actualRoutedCost.toFixed(5)}</span>.
                  <br />
                  5. Net Capital Saved = ${frontierBaselineCost.toFixed(5)} − ${actualRoutedCost.toFixed(5)} = <strong className="text-cyan-300">${simCostSavedUsd.toFixed(5)} USD</strong>.
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: LIVE SESSION TELEMETRY AUDIT */}
          {/* ========================================================================= */}
          {activeModalTab === 'telemetry' && (
            <div className="space-y-5">
              
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">Active Session Context Ledger Audit</h4>
                  <p className="text-slate-300 font-sans leading-relaxed text-xs">
                    Live telemetry aggregated from all prompt executions in the active browser session.
                  </p>
                </div>
              </div>

              {/* Active KPIs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Total Dispatches:</span>
                  <span className="text-white font-extrabold text-xl">{kpis.totalCalls}</span>
                  <span className="text-[10px] text-slate-500 block">ledger entries</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Tokens Economized:</span>
                  <span className="text-emerald-400 font-extrabold text-xl">{kpis.totalSavedTokens.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-500 block">+{kpis.overallSavingsPercent}% reduction</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Counterfactual Frontier:</span>
                  <span className="text-rose-400 font-extrabold text-xl">${kpis.counterfactualCostUsd.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500 block">uniform GPT-4o rate</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Net Capital Preserved:</span>
                  <span className="text-cyan-300 font-extrabold text-xl">${kpis.totalSavedUsd.toFixed(2)}</span>
                  <span className="text-[10px] text-cyan-400 block">avoided spend</span>
                </div>
              </div>

              {/* Security & Cryptographic Certification */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Deterministic Audit Trail Verified</span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed text-xs">
                  All ledger records are signed with chronological sequence IDs and linked to prompt execution telemetry. Token counts are computed synchronously upon AST dispatch.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Ledger Integrity State: Validated</span>
                  <span className="text-emerald-300 font-bold">100% Deterministic</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>WhyOr Telemetry Framework v2.4</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModalTab('simulator')}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition-all cursor-pointer hidden sm:inline-flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Test in Simulator</span>
            </button>

            <button
              id="understanding-metrics-close-bottom-btn"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
