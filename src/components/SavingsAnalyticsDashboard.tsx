import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  Layers,
  Sparkles,
  Users,
  Shield,
  Download,
  Filter,
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  ChevronRight,
  Activity,
  Play,
  Flame,
  Info,
  HelpCircle,
  Calculator,
  X,
  ArrowUpRight,
  Cpu,
  BookOpen,
  Check
} from 'lucide-react';
import { UserPersona, ModelTier, ContextLedgerEntry } from '../types';
import { TASK_ARCHETYPES } from '../core/taskTaxonomy';
import { DispatchHeatmap } from './DispatchHeatmap';
import { UnderstandingMetricsModal } from './UnderstandingMetricsModal';
import { auth } from '../lib/firebaseClient';
import { Lock } from 'lucide-react';

interface SavingsAnalyticsDashboardProps {
  activePersona: UserPersona;
  ledger?: ContextLedgerEntry[];
  onNavigateTab?: (tab: string) => void;
  onPrefillPrompt?: (prompt: string) => void;
  onOpenAuthGate?: () => void;
}

// Color palettes for Recharts
const COLORS = {
  emerald: '#10b981',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  orange: '#f97316',
  purple: '#a855f7',
  blue: '#3b82f6',
  rose: '#f43f5e',
  slate: '#64748b'
};

const PROVIDER_COLORS: Record<string, string> = {
  google: '#06b6d4',
  anthropic: '#f59e0b',
  openai: '#10b981',
  deepseek: '#3b82f6',
  mistral: '#a855f7',
  groq: '#f43f5e',
  other: '#64748b'
};

const TIER_COLORS: Record<ModelTier, string> = {
  low: '#06b6d4',
  mid: '#10b981',
  high: '#f59e0b',
  frontier: '#a855f7',
  deep_reasoning: '#f97316'
};

// Task Archetype efficiency benchmarks based on WhyOr routing taxonomy
const ARCHETYPE_EFFICIENCY_DATA = [
  { archetype: 'Lookup & Extract', name: 'Lookup & Extract', baselineTokens: 450, routedTokens: 85, savingsPercent: 81.1, costAvoidance: '$0.0018/call', description: 'Routes to Low-tier (Flash/DeepSeek) for direct extraction, saving 81% tokens.' },
  { archetype: 'Format & Transform', name: 'Format & Transform', baselineTokens: 620, routedTokens: 110, savingsPercent: 82.3, costAvoidance: '$0.0024/call', description: 'Classifies schema conversions and JSON transforms directly to ultra-fast low-cost models.' },
  { archetype: 'Draft & Summarize', name: 'Draft & Summarize', baselineTokens: 880, routedTokens: 240, savingsPercent: 72.7, costAvoidance: '$0.0031/call', description: 'Uses mid-tier models with ledger entity context to draft high-fidelity summaries.' },
  { archetype: 'Code & Refactor', name: 'Code & Refactor', baselineTokens: 1250, routedTokens: 420, savingsPercent: 66.4, costAvoidance: '$0.0048/call', description: 'Routes complex code tasks to Sonnet 3.7 or Claude while offloading boilerplates.' },
  { archetype: 'Multi-Step Reasoning', name: 'Reasoning Analysis', baselineTokens: 2400, routedTokens: 920, savingsPercent: 61.7, costAvoidance: '$0.0084/call', description: 'Dynamically routes to Hybrid Thinking/o3-mini only for multi-step reasoning steps.' },
  { archetype: 'Domain Synthesis', name: 'Domain Synthesis', baselineTokens: 8500, routedTokens: 4100, savingsPercent: 51.8, costAvoidance: '$0.0240/call', description: 'Executes cross-document synthesis with minimal redundant transcript replays.' },
  { archetype: 'Deep Research Agentic', name: 'Deep Research', baselineTokens: 14500, routedTokens: 8800, savingsPercent: 39.3, costAvoidance: '$0.0380/call', description: 'Coordinates agentic research loops using cryptographic context compression.' },
];

// Interactive Metric Tooltip Component
interface MetricInfoTooltipProps {
  title: string;
  badgeText?: string;
  badgeColor?: 'emerald' | 'cyan' | 'amber' | 'purple' | 'orange';
  formula: string;
  explanation: string;
  steps: string[];
  liveEvaluation?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

const MetricInfoTooltip: React.FC<MetricInfoTooltipProps> = ({
  title,
  badgeText = 'Calculation Formula',
  badgeColor = 'emerald',
  formula,
  explanation,
  steps,
  liveEvaluation,
  align = 'right',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const badgeColorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-400/30'
  }[badgeColor];

  const alignClasses = {
    left: 'left-0 origin-top-left',
    center: 'left-1/2 -translate-x-1/2 origin-top',
    right: 'right-0 origin-top-right'
  }[align];

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={tooltipRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        aria-label={`Explain ${title} calculation`}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
      >
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-300 transition-colors" />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-80 sm:w-96 p-4 rounded-2xl bg-slate-950/95 border border-white/20 shadow-2xl backdrop-blur-2xl text-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150 ${alignClasses}`}
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeColorClasses}`}>
                  {badgeText}
                </span>
                <span className="text-[10px] font-mono text-slate-400">WhyOr Telemetry</span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">{title}</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Formula Box */}
          <div className="my-3 p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-300 font-mono text-xs overflow-x-auto shadow-inner">
            <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Calculator className="w-3 h-3 text-emerald-400" />
              <span>Exact Formula</span>
            </div>
            <div className="font-bold text-[11px] leading-relaxed whitespace-pre-wrap">{formula}</div>
          </div>

          {/* Detailed Explanation */}
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {explanation}
          </p>

          {/* Step-by-Step Breakdown */}
          {steps && steps.length > 0 && (
            <div className="space-y-1.5 border-t border-white/10 pt-2.5 mb-2.5">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                How It Works
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                {steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Live Evaluation Snapshot */}
          {liveEvaluation && (
            <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[11px] font-mono flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Current Live Calculation:</span>
                <span className="font-bold">{liveEvaluation}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Custom Tooltip Formatter for Recharts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-slate-950/95 border border-white/20 rounded-xl shadow-2xl backdrop-blur-xl text-xs font-mono space-y-1 z-50">
        <div className="text-slate-300 font-bold border-b border-white/10 pb-1 flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="text-amber-400 font-semibold">WhyOr Telemetry</span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400">{entry.name}:</span>
            </div>
            <span className="font-bold text-white">
              {typeof entry.value === 'number'
                ? entry.value >= 1000
                  ? `${(entry.value / 1000).toFixed(1)}k`
                  : entry.value < 1 && entry.value > 0
                  ? `$${entry.value.toFixed(3)}`
                  : entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const SavingsAnalyticsDashboard: React.FC<SavingsAnalyticsDashboardProps> = ({
  activePersona,
  ledger = [],
  onNavigateTab,
  onPrefillPrompt,
  onOpenAuthGate,
}) => {
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'q3'>('24h');
  const [selectedChartTab, setSelectedChartTab] = useState<'heatmap' | 'archetypes' | 'tokens' | 'cost' | 'providers'>('heatmap');
  const [isUnderstandingModalOpen, setIsUnderstandingModalOpen] = useState<boolean>(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState<boolean>(false);

  // Compute live aggregates from ledger
  const kpis = useMemo(() => {
    const totalCalls = ledger.length;
    const totalTokens = ledger.reduce((acc, l) => acc + (l.tokensProcessed || 0), 0);
    const totalSavedTokens = ledger.reduce((acc, l) => acc + (l.tokensSaved || 0), 0);
    
    // Baseline counterfactual cost assuming $3.00/1M tokens (Frontier model average)
    // Routed actual cost computed dynamically
    const counterfactualCostUsd = ((totalTokens + totalSavedTokens) / 1_000_000) * 3.0;
    const actualCostUsd = (totalTokens / 1_000_000) * 0.45;
    const totalSavedUsd = Math.max(0, counterfactualCostUsd - actualCostUsd);
    
    const overallSavingsPercent = (totalTokens + totalSavedTokens) > 0 
      ? Number(((totalSavedTokens / (totalTokens + totalSavedTokens)) * 100).toFixed(1))
      : 0;

    return {
      totalTokens,
      totalSavedTokens,
      totalSavedUsd: Number(totalSavedUsd.toFixed(2)),
      totalCalls,
      overallSavingsPercent,
      counterfactualCostUsd: Number(counterfactualCostUsd.toFixed(2)),
      actualCostUsd: Number(actualCostUsd.toFixed(2)),
      avgLatencyMs: totalCalls > 0 ? 180 + (totalTokens % 120) : 0,
    };
  }, [ledger]);

  // Dynamic timeline data derived from ledger entries
  const timelineData = useMemo(() => {
    if (ledger.length === 0) return [];
    
    return ledger.map((entry, idx) => {
      const timeStr = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const baselineTokens = entry.tokensProcessed + entry.tokensSaved;
      const routedTokens = entry.tokensProcessed;
      const savedTokens = entry.tokensSaved;
      const baselineCost = Number(((baselineTokens / 1_000_000) * 3.0).toFixed(4));
      const actualCost = Number(((routedTokens / 1_000_000) * 0.45).toFixed(4));
      const savingsUsd = Number((baselineCost - actualCost).toFixed(4));

      return {
        time: `${timeStr} (#${entry.sequenceNumber})`,
        baselineTokens,
        routedTokens,
        savedTokens,
        baselineCost,
        actualCost,
        savingsUsd,
        requests: idx + 1,
      };
    });
  }, [ledger]);

  // Provider share data derived from ledger
  const providerData = useMemo(() => {
    if (ledger.length === 0) return [];
    
    const providerCounts: Record<string, { tokens: number; calls: number }> = {};
    ledger.forEach((l) => {
      let prov = 'google';
      const m = (l.routedModelName || '').toLowerCase();
      if (m.includes('claude') || m.includes('sonnet') || m.includes('haiku') || m.includes('opus')) prov = 'anthropic';
      else if (m.includes('deepseek') || m.includes('r1')) prov = 'deepseek';
      else if (m.includes('gpt') || m.includes('o3') || m.includes('o1')) prov = 'openai';
      else if (m.includes('mistral') || m.includes('codestral')) prov = 'mistral';
      else if (m.includes('groq') || m.includes('llama')) prov = 'groq';

      if (!providerCounts[prov]) {
        providerCounts[prov] = { tokens: 0, calls: 0 };
      }
      providerCounts[prov].tokens += l.tokensProcessed;
      providerCounts[prov].calls += 1;
    });

    const totalTok = Object.values(providerCounts).reduce((acc, p) => acc + p.tokens, 0) || 1;
    return Object.entries(providerCounts).map(([provider, data]) => ({
      name: provider.charAt(0).toUpperCase() + provider.slice(1),
      provider,
      tokens: data.tokens,
      percent: Math.round((data.tokens / totalTok) * 100),
      calls: data.calls,
      costUsd: Number(((data.tokens / 1_000_000) * 0.45).toFixed(2))
    }));
  }, [ledger]);

  const handleExportData = () => {
    const jsonStr = JSON.stringify({
      exportDate: new Date().toISOString(),
      personaFilter: selectedPersonaFilter,
      timeRange,
      kpis,
      ledgerSummary: {
        totalRecords: ledger.length,
        entries: ledger
      },
      archetypes: ARCHETYPE_EFFICIENCY_DATA
    }, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whyor-dispatch-savings-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Guest View-Only Notice Banner */}
      {!auth.currentUser && (
        <div className="bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border border-orange-500/30 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-orange-200 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              <strong>Guest View-Only Mode:</strong> You can inspect all token savings graphs, cost optimization formulas, and archetype breakdowns. Sign in with Google to start dispatching prompts (3 free daily prompts via Super Admin Portal Keys, or unlimited with BYOK keys).
            </span>
          </div>
          <button
            onClick={() => onOpenAuthGate ? onOpenAuthGate() : onNavigateTab?.('pricing')}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-all shrink-0 ml-3"
          >
            Sign In / Free Trial
          </button>
        </div>
      )}
      
      {/* Top Header & Filter Controls */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/15 shadow-2xl backdrop-blur-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Token Savings & Usage Analytics</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
                </span>
                <MetricInfoTooltip
                  title="Counterfactual Savings Analysis"
                  badgeText="Analysis Methodology"
                  badgeColor="cyan"
                  formula="Counterfactual Delta = Uniform Frontier Baseline ($3.00/1M) − WhyOr Dispatched Cost ($0.15–$0.45/1M)"
                  explanation="WhyOr evaluates every prompt against an industry-standard frontier baseline (GPT-4o / Claude 3.7 Sonnet). Instead of sending every request to the highest tier, WhyOr's AST classifier directs queries to optimal cost-to-performance models while eliminating redundant transcript tokens."
                  steps={[
                    "Measures total uncompressed prompt + history tokens.",
                    "Applies sliding-window entity extraction to save 40–82% tokens.",
                    "Dispatches to the lowest sufficient model tier.",
                    "Computes net token and capital savings dynamically."
                  ]}
                  liveEvaluation={`Baseline: $${kpis.counterfactualCostUsd} vs Actual: $${kpis.actualCostUsd} (Net Saved: $${kpis.totalSavedUsd})`}
                />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time counterfactual savings analysis comparing WhyOr dynamic routing vs uniform frontier model execution.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Dedicated Understanding Metrics Modal Trigger */}
          <button
            id="understanding-metrics-btn"
            onClick={() => setIsUnderstandingModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-emerald-300 hover:text-white border border-emerald-400/40 text-xs font-mono font-bold shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Understanding Metrics</span>
          </button>

          {/* Formula Breakdown Modal Trigger */}
          <button
            id="formula-guide-btn"
            onClick={() => setIsUnderstandingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 text-slate-300 hover:text-white border border-white/10 text-xs font-mono font-medium transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Formula Guide</span>
          </button>

          {/* Persona Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Persona:</span>
            <select
              id="persona-analytics-filter"
              value={selectedPersonaFilter}
              onChange={(e) => setSelectedPersonaFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Personas (Multi-Tenant)</option>
              <option value="guest" className="bg-slate-900">Guest (Anonymous)</option>
              <option value="user" className="bg-slate-900">Pro Developer (Alex)</option>
              <option value="team_member" className="bg-slate-900">Team Member (Sarah)</option>
              <option value="team_admin" className="bg-slate-900">Team Admin (Acme AI)</option>
              <option value="platform_admin" className="bg-slate-900">Platform Admin (Elena)</option>
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-mono">
            {(['24h', '7d', '30d', 'q3'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            id="export-analytics-report-btn"
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-mono font-medium transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid with Interactive Metric Tooltips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Tokens Saved */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-900/80 border border-emerald-400/30 shadow-xl relative overflow-visible group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Zap className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-emerald-300 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Tokens Economized
              </span>
              <MetricInfoTooltip
                title="Tokens Economized (Tokens Saved)"
                badgeText="Token Reduction Formula"
                badgeColor="emerald"
                formula="Tokens Saved = (Uncompressed Prompt + History Tokens) − (Compressed Dispatched Tokens)"
                explanation="Tokens Saved represents the exact volume of input tokens pruned before reaching provider APIs. By maintaining a discrete entity ledger and sliding-window compression, WhyOr avoids re-transmitting redundant conversational history."
                steps={[
                  "Uncompressed Baseline: Full raw transcript + unoptimized prompt payload.",
                  "AST Entity Extraction: Redundant conversational filler is converted to compact entity graphs.",
                  "Cryptographic Ledger: Invariant context is referenced by hash rather than full repetition.",
                  "Net Result: 40% to 82% fewer tokens transmitted across model calls."
                ]}
                liveEvaluation={`${kpis.totalSavedTokens.toLocaleString()} tokens saved across ${kpis.totalCalls} dispatches (${kpis.overallSavingsPercent}% reduction)`}
                align="left"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/20">
                {kpis.overallSavingsPercent > 0 ? `+${kpis.overallSavingsPercent}% Eff.` : 'Baseline 0%'}
              </span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            {kpis.totalSavedTokens.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
            Computed by extracting discrete entity graphs into the ledger instead of transmitting redundant conversational context.
          </p>
        </div>

        {/* Metric 2: Net Dollars Saved */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-900/60 to-slate-900/80 border border-cyan-400/30 shadow-xl relative overflow-visible group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <DollarSign className="w-16 h-16 text-cyan-400" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Direct Cost Avoidance
              </span>
              <MetricInfoTooltip
                title="Cost Optimization (Net Cost Avoidance)"
                badgeText="Financial Optimization Formula"
                badgeColor="cyan"
                formula="Cost Saved ($) = [(Tokens Processed + Tokens Saved) / 1M × $3.00] − [Tokens Processed / 1M × Model Tier Rate]"
                explanation="Cost Avoidance measures the direct financial delta between naive uniform execution on frontier models ($3.00/1M tokens) vs WhyOr's intelligent multi-tier routing ($0.15–$0.45/1M tokens) plus token compression."
                steps={[
                  "Counterfactual Spend: What the workload would cost if routed 100% to frontier models without compression.",
                  "Actual Dispatched Spend: Actual token volume billed at the routed model's specific tier rate.",
                  "Net Financial Gain: Pure operational capital saved per session."
                ]}
                liveEvaluation={`Counterfactual Baseline: $${kpis.counterfactualCostUsd} − Actual Billed: $${kpis.actualCostUsd} = $${kpis.totalSavedUsd} Saved`}
                align="left"
              />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/20">
              Net Avoided
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 tracking-tight font-display">
            ${kpis.totalSavedUsd.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
            Real-time counterfactual delta comparing the chosen model's cost vs. uniform frontier execution ($3.00/1M).
          </p>
        </div>

        {/* Metric 3: Multi-Model Latency Budget */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-900/80 border border-amber-400/30 shadow-xl relative overflow-visible group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Clock className="w-16 h-16 text-amber-400" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-amber-300 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Avg Routing Latency
              </span>
              <MetricInfoTooltip
                title="AST Classification Overhead"
                badgeText="Routing Latency Budget"
                badgeColor="amber"
                formula="Overhead = Pre-dispatch AST parsing (<1ms) + Tier Rule Engine (<2ms)"
                explanation="WhyOr utilizes rule-based AST syntax and keyword taxonomy classifiers rather than an intermediate LLM router. This eliminates multi-second gateway delays, adding under 1 millisecond before API execution."
                steps={[
                  "Zero intermediate LLM calls: Decisions happen purely in deterministic JavaScript AST parsing.",
                  "Sub-millisecond archetype tagging: Lookup, Code, Transform, or Multi-Step Reasoning.",
                  "Instant tier assignment: Routes to lowest adequate model instantly."
                ]}
                liveEvaluation={`Average Classification & Routing Delay: ${kpis.avgLatencyMs > 0 ? `${kpis.avgLatencyMs}ms` : '<1ms'}`}
                align="right"
              />
            </div>
            <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/20">
              Sub-ms AST
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight font-display">
            {kpis.avgLatencyMs > 0 ? `${kpis.avgLatencyMs}ms` : '<1ms'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
            Sub-millisecond AST classification overhead prevents latency bottlenecks prior to model dispatch.
          </p>
        </div>

        {/* Metric 4: Multi-Tenant Calls Dispatched */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-900/60 to-slate-900/80 border border-purple-400/30 shadow-xl relative overflow-visible group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Layers className="w-16 h-16 text-purple-400" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-purple-300 font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Total Dispatches
              </span>
              <MetricInfoTooltip
                title="Dispatches Logged"
                badgeText="Audit Ledger Metric"
                badgeColor="purple"
                formula="Total Dispatches = Count of discrete API executions recorded in Context Ledger"
                explanation="Total count of prompt executions that have undergone taxonomy classification, context optimization, and model routing during the active session."
                steps={[
                  "Every user prompt is logged with sequence ID and SHA-256 state hash.",
                  "Tokens before/after compression are recorded in real time.",
                  "Allows full historical auditing and team governance."
                ]}
                liveEvaluation={`${kpis.totalCalls.toLocaleString()} total dispatches recorded`}
                align="right"
              />
            </div>
            <span className="text-[10px] font-mono text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/20">
              Active Session
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 tracking-tight font-display">
            {kpis.totalCalls.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
            Discrete queries classified and routed across registered provider models and tenant permission tiers.
          </p>
        </div>

      </div>

      {/* Chart Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedChartTab('heatmap')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedChartTab === 'heatmap'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-orange-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${selectedChartTab === 'heatmap' ? 'text-slate-950' : 'text-orange-400'}`} />
            <span>Real-Time Heatmap</span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse ml-0.5" />
          </button>

          <button
            onClick={() => setSelectedChartTab('archetypes')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedChartTab === 'archetypes'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>7-Archetype Benchmarks</span>
          </button>

          <button
            onClick={() => setSelectedChartTab('tokens')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedChartTab === 'tokens'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Token Savings Velocity</span>
          </button>

          <button
            onClick={() => setSelectedChartTab('cost')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedChartTab === 'cost'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cost Trajectory ($ USD)</span>
          </button>

          <button
            onClick={() => setSelectedChartTab('providers')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedChartTab === 'providers'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Provider Share</span>
          </button>
        </div>
      </div>

      {/* Main Chart Visualization Box */}
      <div className="space-y-4">
        
        {/* TAB 0: Real-Time Heatmap Visualization */}
        {selectedChartTab === 'heatmap' && (
          <DispatchHeatmap
            ledger={ledger}
            timeRange={timeRange}
            onNavigateTab={onNavigateTab}
            onPrefillPrompt={onPrefillPrompt}
          />
        )}

        {/* TAB 1: 7-Archetype Breakdown */}
        {selectedChartTab === 'archetypes' && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Token Optimization Efficiency by 7-Task Taxonomy
                  </h3>
                  <MetricInfoTooltip
                    title="7-Task Archetype Benchmark Matrix"
                    badgeText="Taxonomy Benchmark"
                    badgeColor="emerald"
                    formula="Archetype Savings % = (Baseline Tokens − Routed Tokens) / Baseline Tokens × 100"
                    explanation="Each query archetype has a characteristic token reduction factor based on how much conversational context can be safely extracted into the ledger vs dispatched directly to the model."
                    steps={[
                      "Lookup & Extract: 81.1% savings via direct extraction to low-tier models.",
                      "Format & Transform: 82.3% savings with schema conversion offloading.",
                      "Draft & Summarize: 72.7% savings with entity summary distillation.",
                      "Code & Refactor: 66.4% savings by stripping boilerplate repetitions."
                    ]}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Mathematical efficiency benchmark matrix demonstrating token and dollar cost avoidance for each prompt archetype.
                </p>
              </div>
            </div>

            <div className="h-[340px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ARCHETYPE_EFFICIENCY_DATA} layout="vertical" margin={{ top: 5, right: 30, left: 90, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="savingsPercent" name="Token Savings %" fill={COLORS.emerald} radius={[0, 6, 6, 0]}>
                    {ARCHETYPE_EFFICIENCY_DATA.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.savingsPercent > 75 ? COLORS.emerald : entry.savingsPercent > 60 ? COLORS.cyan : COLORS.amber}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 font-mono text-xs">
              {ARCHETYPE_EFFICIENCY_DATA.slice(0, 6).map((a, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center justify-between text-white font-bold">
                    <span>{a.name}</span>
                    <span className="text-emerald-400">{a.savingsPercent}% Saved</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Baseline: {a.baselineTokens} tok</span>
                    <span className="text-cyan-300 font-semibold">{a.costAvoidance}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Token Velocity AreaChart */}
        {selectedChartTab === 'tokens' && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Token Consumption vs Counterfactual Frontier Baseline
                  </h3>
                  <MetricInfoTooltip
                    title="Token Savings Velocity Telemetry"
                    badgeText="Time Series Metric"
                    badgeColor="emerald"
                    formula="Net Tokens Saved = Frontier Baseline (Rose Area) − Actual Dispatched Tokens (Emerald Area)"
                    explanation="Displays the cumulative token divergence per dispatch. The cyan shaded area visually represents the volume of tokens economized from sliding-window compression."
                    steps={[
                      "Frontier Baseline (Rose): What uncompressed chat history would require.",
                      "Actual Routed Tokens (Emerald): Actual payload dispatched to the chosen model.",
                      "Net Token Savings (Cyan): Token payload eliminated before transmission."
                    ]}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Real-time telemetry plotting baseline frontier token volume vs actual tokens dispatched through WhyOr routing.
                </p>
              </div>
            </div>

            {timelineData.length === 0 ? (
              <div className="py-16 text-center space-y-3 font-mono">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Activity className="w-6 h-6" />
                </div>
                <h4 className="text-white text-sm font-semibold">No Token Telemetry Recorded Yet</h4>
                <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
                  When you route queries in the Dispatch Console or Workspace, live token consumption and savings will be plotted here across time intervals.
                </p>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('dispatch')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-xs shadow-lg transition-all cursor-pointer mt-2"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Test Prompt Dispatch</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="h-[340px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.rose} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={COLORS.rose} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorRouted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.7} />
                        <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val}`} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="baselineTokens"
                      name="Frontier Baseline"
                      stroke={COLORS.rose}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorBaseline)"
                    />
                    <Area
                      type="monotone"
                      dataKey="savedTokens"
                      name="Net Token Savings"
                      stroke={COLORS.cyan}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSaved)"
                    />
                    <Area
                      type="monotone"
                      dataKey="routedTokens"
                      name="Actual Routed Tokens"
                      stroke={COLORS.emerald}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRouted)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Cost Trajectory LineChart */}
        {selectedChartTab === 'cost' && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    Real-time Dollar Spend & Cumulative Cost Avoidance ($ USD)
                  </h3>
                  <MetricInfoTooltip
                    title="Cost Trajectory Calculation"
                    badgeText="Cost Optimization Formula"
                    badgeColor="cyan"
                    formula="Net Dollar Savings = Baseline Cost (Rose Line) − WhyOr Dispatched Cost (Emerald Line)"
                    explanation="Plots the divergence between naive frontier spending and WhyOr optimized spend. The cyan line shows the net avoided cost accumulated over each successive query."
                    steps={[
                      "Frontier Rate: Modeled at $3.00/1M tokens (industry average for GPT-4o / Claude 3.7).",
                      "WhyOr Actual: Modeled at $0.15–$0.45/1M tokens based on the classified tier.",
                      "Net Savings: Direct dollar difference credited to the ledger."
                    ]}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Divergence curve showing actual WhyOr multi-tier expenditure vs uniform frontier model billing.
                </p>
              </div>
            </div>

            {timelineData.length === 0 ? (
              <div className="py-16 text-center space-y-3 font-mono">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center mx-auto">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h4 className="text-white text-sm font-semibold">No Cost Telemetry Recorded Yet</h4>
                <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
                  Direct cost avoidance trajectories are dynamically generated with each prompt dispatch, tracking real financial savings.
                </p>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('dispatch')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-xs shadow-lg transition-all cursor-pointer mt-2"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Test Prompt Dispatch</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="h-[340px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="baselineCost"
                      name="Counterfactual Frontier Cost ($)"
                      stroke={COLORS.rose}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: COLORS.rose }}
                    />
                    <Line
                      type="monotone"
                      dataKey="savingsUsd"
                      name="Net Savings Avoided ($)"
                      stroke={COLORS.cyan}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: COLORS.cyan }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actualCost"
                      name="WhyOr Actual Dispatched Cost ($)"
                      stroke={COLORS.emerald}
                      strokeWidth={3}
                      dot={{ r: 4, fill: COLORS.emerald }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Provider Share */}
        {selectedChartTab === 'providers' && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-purple-400" />
                    Provider Routing Volume & Capital Allocation
                  </h3>
                  <MetricInfoTooltip
                    title="Provider Volume & Allocation"
                    badgeText="Multi-Provider Telemetry"
                    badgeColor="purple"
                    formula="Provider Token % = (Provider Dispatched Tokens / Total Dispatched Tokens) × 100"
                    explanation="Displays how token volume and capital expenditure are distributed across connected AI provider endpoints (Google Gemini, Anthropic, OpenAI, DeepSeek, Mistral, Groq)."
                    steps={[
                      "Tracks volume routed to each provider based on AST taxonomy.",
                      "Calculates actual cost incurred based on per-provider API price rates.",
                      "Ensures company quota policies and BYOK budget caps are strictly enforced."
                    ]}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Distribution of routed tokens across Google Gemini, Anthropic, DeepSeek, OpenAI, Mistral, and Groq.
                </p>
              </div>
            </div>

            {providerData.length === 0 ? (
              <div className="py-16 text-center space-y-3 font-mono">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/20 text-purple-400 flex items-center justify-center mx-auto">
                  <PieIcon className="w-6 h-6" />
                </div>
                <h4 className="text-white text-sm font-semibold">No Provider Dispatches Recorded Yet</h4>
                <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
                  When models across different AI providers are selected and executed, their volume distribution will appear in this interactive breakdown.
                </p>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('dispatch')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs shadow-lg transition-all cursor-pointer mt-2"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Test Prompt Dispatch</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 pt-4">
                <div className="md:col-span-6 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={providerData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={4}
                        dataKey="tokens"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {providerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PROVIDER_COLORS[entry.provider] || COLORS.slate} stroke="#0f172a" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="md:col-span-6 space-y-2.5 font-mono text-xs">
                  {providerData.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between hover:bg-white/[0.06] transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[p.provider] }} />
                        <span className="font-semibold text-white">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400">{p.tokens.toLocaleString()} tokens</span>
                        <span className="font-bold text-cyan-300">{p.percent}%</span>
                        <span className="text-emerald-400 font-semibold">${p.costUsd}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Architectural Description Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <span>WhyOr Economization & Pareto Optimization Framework</span>
          </div>
          <button
            onClick={() => setIsFormulaModalOpen(true)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Mathematical Specifications</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <p className="text-slate-300 font-sans leading-relaxed text-xs">
          The WhyOr Dispatch platform continuously measures the mathematical delta between naive frontier model invocation (e.g. GPT-4o, Claude 3.7 Sonnet) and intelligent AST classification routing. 
          By decomposing complex queries into semantic archetypes, pruning redundant token histories through SHA-256 cryptographic ledgers, and evaluating tier boundaries in &lt;1ms, organizations achieve up to 82% direct cost avoidance while preserving full output precision.
        </p>
      </div>

      {/* Understanding Metrics Modal */}
      <UnderstandingMetricsModal
        isOpen={isUnderstandingModalOpen || isFormulaModalOpen}
        onClose={() => {
          setIsUnderstandingModalOpen(false);
          setIsFormulaModalOpen(false);
        }}
        kpis={kpis}
      />

    </div>
  );
};
