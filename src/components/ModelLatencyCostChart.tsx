import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import {
  Zap,
  Clock,
  DollarSign,
  Sparkles,
  Sliders,
  Filter,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  BarChart3,
  Flame,
  Search,
  Check,
  ChevronDown,
  Info,
  Maximize2,
  Play,
  RotateCcw
} from 'lucide-react';
import { AIModel, AIProvider, ModelTier } from '../types';
import { INITIAL_AI_MODELS } from '../data/mockData';

interface ModelLatencyCostChartProps {
  models?: AIModel[];
  onNavigateTab?: (tab: string) => void;
  onPrefillPrompt?: (prompt: string, modelId?: string) => void;
}

// Color palettes for providers
const PROVIDER_COLORS: Record<string, string> = {
  google: '#06b6d4', // Cyan
  anthropic: '#f59e0b', // Amber
  openai: '#10b981', // Emerald
  deepseek: '#3b82f6', // Blue
  mistral: '#a855f7', // Purple
  groq: '#f43f5e', // Rose
  meta: '#ec4899', // Pink
  perplexity: '#8b5cf6', // Indigo
  other: '#64748b' // Slate
};

const TIER_COLORS: Record<ModelTier, string> = {
  low: '#06b6d4',
  mid: '#10b981',
  high: '#f59e0b',
  frontier: '#a855f7',
  deep_reasoning: '#f97316'
};

export const ModelLatencyCostChart: React.FC<ModelLatencyCostChartProps> = ({
  models = INITIAL_AI_MODELS,
  onNavigateTab,
  onPrefillPrompt
}) => {
  // Filter and view states
  const [viewMode, setViewMode] = useState<'scatter' | 'bars' | 'pareto_table'>('scatter');
  const [costMode, setCostMode] = useState<'blended' | 'input' | 'output'>('blended');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'efficiency' | 'latency' | 'cost' | 'quality'>('efficiency');
  const [selectedModelForInspect, setSelectedModelForInspect] = useState<AIModel | null>(null);

  // Decision Simulator / What-If filters
  const [simulatorPreset, setSimulatorPreset] = useState<'custom' | 'realtime' | 'bulk' | 'coding' | 'reasoning'>('custom');
  const [maxLatencyConstraint, setMaxLatencyConstraint] = useState<number>(1500);
  const [maxCostConstraint, setMaxCostConstraint] = useState<number>(5.0);
  const [minQualityConstraint, setMinQualityConstraint] = useState<number>(85);
  const [requireVision, setRequireVision] = useState<boolean>(false);
  const [requireCode, setRequireCode] = useState<boolean>(false);
  const [requireReasoning, setRequireReasoning] = useState<boolean>(false);
  const [requireSearch, setRequireSearch] = useState<boolean>(false);

  // Preset selector handler
  const handlePresetSelect = (preset: 'realtime' | 'bulk' | 'coding' | 'reasoning') => {
    setSimulatorPreset(preset);
    if (preset === 'realtime') {
      setMaxLatencyConstraint(300);
      setMaxCostConstraint(1.0);
      setMinQualityConstraint(80);
      setRequireVision(false);
      setRequireCode(false);
      setRequireReasoning(false);
      setRequireSearch(false);
    } else if (preset === 'bulk') {
      setMaxLatencyConstraint(800);
      setMaxCostConstraint(0.3);
      setMinQualityConstraint(82);
      setRequireVision(false);
      setRequireCode(false);
      setRequireReasoning(false);
      setRequireSearch(false);
    } else if (preset === 'coding') {
      setMaxLatencyConstraint(1200);
      setMaxCostConstraint(4.0);
      setMinQualityConstraint(90);
      setRequireVision(false);
      setRequireCode(true);
      setRequireReasoning(false);
      setRequireSearch(false);
    } else if (preset === 'reasoning') {
      setMaxLatencyConstraint(3500);
      setMaxCostConstraint(15.0);
      setMinQualityConstraint(94);
      setRequireVision(false);
      setRequireCode(false);
      setRequireReasoning(true);
      setRequireSearch(false);
    }
  };

  // Active models mapping with cost metrics
  const processedModels = useMemo(() => {
    return models
      .filter((m) => m.status === 'active')
      .map((m) => {
        // Blended cost: 3 input tokens for every 1 output token standard heuristic
        const blendedCost = Number(((m.inputPricePerM * 3 + m.outputPricePerM) / 4).toFixed(3));
        const effectiveCost =
          costMode === 'input'
            ? m.inputPricePerM
            : costMode === 'output'
            ? m.outputPricePerM
            : blendedCost;

        // Pareto Efficiency Ratio: Quality Score divided by combined normalized cost & latency
        // Higher score = better value per latency & cost unit
        const costFactor = Math.max(0.05, effectiveCost);
        const latencyFactor = Math.max(50, m.latencyAvgMs) / 1000;
        const efficiencyScore = Number(((m.qualityBenchmarkScore / (costFactor * 0.7 + latencyFactor * 0.3))).toFixed(1));

        return {
          ...m,
          blendedCost,
          effectiveCost,
          efficiencyScore,
          isUnderConstraints:
            m.latencyAvgMs <= maxLatencyConstraint &&
            effectiveCost <= maxCostConstraint &&
            m.qualityBenchmarkScore >= minQualityConstraint &&
            (!requireVision || m.capabilities.vision) &&
            (!requireCode || m.capabilities.code) &&
            (!requireReasoning || m.capabilities.reasoning) &&
            (!requireSearch || m.capabilities.onlineSearch)
        };
      });
  }, [
    models,
    costMode,
    maxLatencyConstraint,
    maxCostConstraint,
    minQualityConstraint,
    requireVision,
    requireCode,
    requireReasoning,
    requireSearch
  ]);

  // Filtered dataset for visualizations
  const filteredModels = useMemo(() => {
    return processedModels
      .filter((m) => {
        if (selectedProvider !== 'all' && m.provider !== selectedProvider) return false;
        if (selectedTier !== 'all' && m.tier !== selectedTier) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            m.name.toLowerCase().includes(q) ||
            m.providerDisplayName.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'latency') return a.latencyAvgMs - b.latencyAvgMs;
        if (sortBy === 'cost') return a.effectiveCost - b.effectiveCost;
        if (sortBy === 'quality') return b.qualityBenchmarkScore - a.qualityBenchmarkScore;
        return b.efficiencyScore - a.efficiencyScore;
      });
  }, [processedModels, selectedProvider, selectedTier, searchQuery, sortBy]);

  // Best recommended model according to simulation constraints
  const optimalModel = useMemo(() => {
    const eligible = processedModels.filter((m) => m.isUnderConstraints);
    if (eligible.length === 0) return null;
    // Pick the highest efficiency score among eligible models
    return eligible.reduce((best, curr) =>
      curr.efficiencyScore > best.efficiencyScore ? curr : best
    );
  }, [processedModels]);

  // Providers list for filtering
  const availableProviders = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => set.add(m.provider));
    return Array.from(set);
  }, [models]);

  // Custom Scatter Tooltip
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3.5 bg-slate-950/95 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-2xl text-xs font-mono max-w-xs space-y-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <div className="text-white font-bold text-sm font-sans">{data.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{data.providerDisplayName}</div>
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
              style={{
                backgroundColor: `${PROVIDER_COLORS[data.provider] || '#64748b'}25`,
                color: PROVIDER_COLORS[data.provider] || '#64748b',
                border: `1px solid ${PROVIDER_COLORS[data.provider] || '#64748b'}40`
              }}
            >
              {data.tier.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2.5 rounded-xl border border-white/5">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Latency</span>
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {data.latencyAvgMs}ms
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">
                {costMode === 'blended' ? 'Blended (3:1)' : costMode === 'input' ? 'Input Cost' : 'Output Cost'}
              </span>
              <span className="text-emerald-300 font-bold flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                ${data.effectiveCost.toFixed(2)}/1M
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Quality Benchmark</span>
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                {data.qualityBenchmarkScore}/100
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Efficiency Ratio</span>
              <span className="text-purple-300 font-bold">
                {data.efficiencyScore} pts
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
            {data.description}
          </p>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Context: {(data.contextWindowTokens / 1000).toFixed(0)}k tokens</span>
            <span className="text-cyan-400 font-semibold cursor-pointer">Click to inspect →</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Bar Chart Tooltip
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const model = processedModels.find((m) => m.name === label);
      return (
        <div className="p-3 bg-slate-950/95 border border-white/20 rounded-xl shadow-2xl backdrop-blur-xl text-xs font-mono space-y-1.5 z-50">
          <div className="font-bold text-white border-b border-white/10 pb-1 flex items-center justify-between gap-3">
            <span>{label}</span>
            {model && (
              <span className="text-[10px] text-cyan-400 font-mono">{model.providerDisplayName}</span>
            )}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`entry-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-400">{entry.name}:</span>
              </div>
              <span className="font-bold text-white">
                {entry.dataKey === 'latencyAvgMs'
                  ? `${entry.value}ms`
                  : entry.dataKey === 'effectiveCost'
                  ? `$${entry.value.toFixed(2)}/1M`
                  : entry.dataKey === 'qualityBenchmarkScore'
                  ? `${entry.value}/100`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-6 text-slate-100">
      {/* Header & Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight">
                Model Latency vs. Cost-Per-Token Matrix
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                Pareto Routing Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-dimensional trade-off visualization comparing active AI engines across response speed, token pricing, and quality benchmarks.
            </p>
          </div>
        </div>

        {/* View Mode & Cost Mode Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Cost Mode Toggle */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs font-mono">
            <span className="text-[10px] text-slate-400 px-2 uppercase font-semibold">Cost Metric:</span>
            <button
              onClick={() => setCostMode('blended')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                costMode === 'blended'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Blended (3:1)
            </button>
            <button
              onClick={() => setCostMode('input')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                costMode === 'input'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Prompt Input
            </button>
            <button
              onClick={() => setCostMode('output')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                costMode === 'output'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Output
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs font-mono">
            <button
              onClick={() => setViewMode('scatter')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'scatter'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scatter Quadrants</span>
            </button>
            <button
              onClick={() => setViewMode('bars')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'bars'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Comparative Bars</span>
            </button>
            <button
              onClick={() => setViewMode('pareto_table')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'pareto_table'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Decision Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Routing Decision Simulator / What-If Advisor Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950/80 via-slate-900/90 to-slate-950 border border-cyan-500/25 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
                Intelligent Routing Advisor & What-If Simulator
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Adjust SLAs and budget boundaries to find the Pareto-optimal model recommendation in real time.
              </p>
            </div>
          </div>

          {/* Quick SLA Workload Presets */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            <span className="text-slate-400 text-[10px] uppercase font-semibold mr-1">SLA Presets:</span>
            <button
              onClick={() => handlePresetSelect('realtime')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                simulatorPreset === 'realtime'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/50 font-bold'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              ⚡ Sub-300ms SLA
            </button>
            <button
              onClick={() => handlePresetSelect('bulk')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                simulatorPreset === 'bulk'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 font-bold'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              💰 Ultra-Low Cost
            </button>
            <button
              onClick={() => handlePresetSelect('coding')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                simulatorPreset === 'coding'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              💻 Code & Refactor
            </button>
            <button
              onClick={() => handlePresetSelect('reasoning')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                simulatorPreset === 'reasoning'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-400/50 font-bold'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              🧠 Deep Reasoning
            </button>
          </div>
        </div>

        {/* Sliders and Criteria Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-white/10 text-xs font-mono">
          {/* Max Latency Slider */}
          <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Max Latency SLA:
              </span>
              <span className="text-amber-300 font-bold">{maxLatencyConstraint}ms</span>
            </div>
            <input
              type="range"
              min={50}
              max={3500}
              step={50}
              value={maxLatencyConstraint}
              onChange={(e) => {
                setSimulatorPreset('custom');
                setMaxLatencyConstraint(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>50ms (LPU)</span>
              <span>1000ms</span>
              <span>3500ms</span>
            </div>
          </div>

          {/* Max Token Cost Slider */}
          <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Max Token Budget:
              </span>
              <span className="text-emerald-300 font-bold">${maxCostConstraint.toFixed(2)}/1M</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={15.0}
              step={0.1}
              value={maxCostConstraint}
              onChange={(e) => {
                setSimulatorPreset('custom');
                setMaxCostConstraint(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>$0.10</span>
              <span>$5.00</span>
              <span>$15.00</span>
            </div>
          </div>

          {/* Min Quality Score Slider */}
          <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Min Benchmark:
              </span>
              <span className="text-cyan-300 font-bold">{minQualityConstraint}/100</span>
            </div>
            <input
              type="range"
              min={70}
              max={98}
              step={1}
              value={minQualityConstraint}
              onChange={(e) => {
                setSimulatorPreset('custom');
                setMinQualityConstraint(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>70 (Basic)</span>
              <span>85</span>
              <span>98 (Frontier)</span>
            </div>
          </div>

          {/* Capabilities Requirements */}
          <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Required Features:</span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireCode}
                  onChange={(e) => {
                    setSimulatorPreset('custom');
                    setRequireCode(e.target.checked);
                  }}
                  className="rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-0"
                />
                <span>Code / FIM</span>
              </label>
              <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireVision}
                  onChange={(e) => {
                    setSimulatorPreset('custom');
                    setRequireVision(e.target.checked);
                  }}
                  className="rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-0"
                />
                <span>Vision</span>
              </label>
              <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireReasoning}
                  onChange={(e) => {
                    setSimulatorPreset('custom');
                    setRequireReasoning(e.target.checked);
                  }}
                  className="rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-0"
                />
                <span>Deep CoT</span>
              </label>
              <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireSearch}
                  onChange={(e) => {
                    setSimulatorPreset('custom');
                    setRequireSearch(e.target.checked);
                  }}
                  className="rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-0"
                />
                <span>Web Grounding</span>
              </label>
            </div>
          </div>
        </div>

        {/* Dynamic Simulator Winner Banner */}
        {optimalModel ? (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-indigo-500/15 border border-emerald-400/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider">
                    Recommended Optimal Model:
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white">
                    {optimalModel.providerDisplayName}
                  </span>
                </div>
                <div className="text-white font-bold text-sm mt-0.5 font-display flex items-center gap-2">
                  <span>{optimalModel.name}</span>
                  <span className="text-slate-400 text-xs font-mono font-normal">
                    ({optimalModel.latencyAvgMs}ms latency · ${optimalModel.effectiveCost.toFixed(2)}/1M tokens · {optimalModel.qualityBenchmarkScore}/100 quality)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSelectedModelForInspect(optimalModel)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 text-xs font-mono transition-all cursor-pointer"
              >
                Inspect Specs
              </button>
              <button
                onClick={() => {
                  if (onPrefillPrompt) {
                    onPrefillPrompt('Evaluate system latency and optimize token efficiency for our API workloads.', optimalModel.id);
                  } else if (onNavigateTab) {
                    onNavigateTab('dispatch');
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs font-mono shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-slate-950" />
                <span>Test Dispatch</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>No active models meet all chosen constraints. Try broadening your latency or cost threshold.</span>
            </div>
            <button
              onClick={() => {
                setMaxLatencyConstraint(1800);
                setMaxCostConstraint(5.0);
                setMinQualityConstraint(80);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-[11px] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Filter and Sorting Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {/* Provider Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-white/10">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Provider:</span>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Providers ({processedModels.length})</option>
              {availableProviders.map((p) => (
                <option key={p} value={p} className="bg-slate-900">
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-slate-400">Tier:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Tiers</option>
              <option value="low" className="bg-slate-900">Low (Ultra-Fast / Workhorse)</option>
              <option value="mid" className="bg-slate-900">Mid (Balanced Reasoning)</option>
              <option value="high" className="bg-slate-900">High (Code & Frontier)</option>
              <option value="frontier" className="bg-slate-900">Frontier STEM</option>
              <option value="deep_reasoning" className="bg-slate-900">Deep Reasoning CoT</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search model name or capability..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950/70 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-white/10">
          <span className="text-slate-400">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="efficiency" className="bg-slate-900">Pareto Efficiency (Best ROI)</option>
            <option value="latency" className="bg-slate-900">Fastest Latency (Lowest ms)</option>
            <option value="cost" className="bg-slate-900">Lowest Token Cost ($/1M)</option>
            <option value="quality" className="bg-slate-900">Highest Benchmark Score</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: SCATTER / QUADRANT CHART (DEFAULT) */}
      {viewMode === 'scatter' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 relative">
            {/* Quadrant Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-bold">Trade-Off Quadrants:</span>
                <span className="text-slate-400">Bubble size indicates Benchmark Quality Score (78–98)</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-400/40 inline-block" />
                  Q1: Ultra-Fast Economy (&lt;400ms, &lt;$1/1M)
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500/20 border border-cyan-400/40 inline-block" />
                  Q2: Balanced Workhorses (400-1000ms)
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500/20 border border-purple-400/40 inline-block" />
                  Q3: Frontier STEM & CoT (&gt;1000ms)
                </span>
              </div>
            </div>

            {/* Recharts Scatter Plot */}
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  
                  {/* Reference Quadrant Areas */}
                  <ReferenceArea
                    x1={0}
                    x2={400}
                    y1={0}
                    y2={1.0}
                    fill="#10b981"
                    fillOpacity={0.04}
                    stroke="#10b981"
                    strokeOpacity={0.15}
                    strokeDasharray="2 2"
                  />
                  <ReferenceArea
                    x1={400}
                    x2={1100}
                    y1={0}
                    y2={4.0}
                    fill="#06b6d4"
                    fillOpacity={0.03}
                    stroke="#06b6d4"
                    strokeOpacity={0.15}
                    strokeDasharray="2 2"
                  />

                  {/* Constraint Crosshairs */}
                  <ReferenceLine
                    x={maxLatencyConstraint}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: `Max Latency SLA (${maxLatencyConstraint}ms)`,
                      fill: '#f59e0b',
                      fontSize: 10,
                      position: 'insideTopRight'
                    }}
                  />
                  <ReferenceLine
                    y={maxCostConstraint}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: `Max Budget ($${maxCostConstraint.toFixed(2)})`,
                      fill: '#10b981',
                      fontSize: 10,
                      position: 'insideTopLeft'
                    }}
                  />

                  <XAxis
                    type="number"
                    dataKey="latencyAvgMs"
                    name="Average Latency"
                    unit="ms"
                    domain={[0, 'dataMax + 200']}
                    stroke="#64748b"
                    fontSize={11}
                    label={{
                      value: 'Average Response Latency (Milliseconds) → Lower is Faster',
                      position: 'insideBottom',
                      offset: -10,
                      fill: '#94a3b8',
                      fontSize: 11
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="effectiveCost"
                    name="Cost per 1M Tokens"
                    unit="$"
                    domain={[0, 'dataMax + 1.5']}
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `$${val}`}
                    label={{
                      value: `Cost per 1M Tokens ($ USD) [${costMode.toUpperCase()}] → Lower is Cheaper`,
                      angle: -90,
                      position: 'insideLeft',
                      offset: 15,
                      fill: '#94a3b8',
                      fontSize: 11
                    }}
                  />
                  <ZAxis
                    type="number"
                    dataKey="qualityBenchmarkScore"
                    range={[90, 420]}
                    name="Quality Score"
                  />
                  <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                  <Scatter
                    name="AI Models"
                    data={filteredModels}
                    onClick={(entry: any) => {
                      if (entry && entry.payload) {
                        setSelectedModelForInspect(entry.payload);
                      } else if (entry && entry.id) {
                        setSelectedModelForInspect(entry);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {filteredModels.map((entry, index) => {
                      const isOptimal = optimalModel && entry.id === optimalModel.id;
                      const isInspected = selectedModelForInspect && entry.id === selectedModelForInspect.id;
                      const providerColor = PROVIDER_COLORS[entry.provider] || '#64748b';

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={isOptimal ? '#10b981' : isInspected ? '#38bdf8' : providerColor}
                          stroke={isOptimal ? '#34d399' : isInspected ? '#ffffff' : '#0f172a'}
                          strokeWidth={isOptimal || isInspected ? 3 : 1.5}
                          fillOpacity={entry.isUnderConstraints ? 0.9 : 0.35}
                        />
                      );
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: COMPARATIVE COMPOSED / BAR CHART */}
      {viewMode === 'bars' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/10 pb-2 mb-4">
              <span>Dual-Metric Alignment: Latency (Bars) vs Cost (Right Axis) vs Quality Score (Line)</span>
              <span className="text-cyan-300 font-semibold">{filteredModels.length} models displayed</span>
            </div>

            <div className="h-[440px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredModels} margin={{ top: 10, right: 30, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={10}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#f59e0b"
                    fontSize={11}
                    tickFormatter={(val) => `${val}ms`}
                    label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#f59e0b', fontSize: 10 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981"
                    fontSize={11}
                    tickFormatter={(val) => `$${val}`}
                    label={{ value: 'Cost ($/1M)', angle: 90, position: 'insideRight', fill: '#10b981', fontSize: 10 }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend verticalAlign="top" height={36} />

                  <Bar
                    yAxisId="left"
                    dataKey="latencyAvgMs"
                    name="Latency (ms)"
                    fill="#f59e0b"
                    opacity={0.8}
                    radius={[4, 4, 0, 0]}
                  >
                    {filteredModels.map((entry, idx) => (
                      <Cell
                        key={`bar-${idx}`}
                        fill={entry.latencyAvgMs < 300 ? '#10b981' : entry.latencyAvgMs < 800 ? '#06b6d4' : '#f59e0b'}
                      />
                    ))}
                  </Bar>

                  <Bar
                    yAxisId="right"
                    dataKey="effectiveCost"
                    name="Cost per 1M Tokens ($)"
                    fill="#10b981"
                    opacity={0.7}
                    radius={[4, 4, 0, 0]}
                  />

                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="qualityBenchmarkScore"
                    name="Quality Score (0-100)"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#a855f7' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: PARETO DECISION MATRIX TABLE */}
      {viewMode === 'pareto_table' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/70">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                  <th className="p-3 font-semibold text-slate-200">Model & Provider</th>
                  <th className="p-3 text-center">Tier</th>
                  <th className="p-3 text-right">Avg Latency</th>
                  <th className="p-3 text-right">Input ($/1M)</th>
                  <th className="p-3 text-right">Output ($/1M)</th>
                  <th className="p-3 text-right">Blended ($/1M)</th>
                  <th className="p-3 text-center">Quality Score</th>
                  <th className="p-3 text-center">Pareto ROI</th>
                  <th className="p-3 text-center">SLA Compliance</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredModels.map((m) => {
                  const isOptimal = optimalModel && m.id === optimalModel.id;
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedModelForInspect(m)}
                      className={`hover:bg-white/[0.04] transition-colors cursor-pointer ${
                        isOptimal ? 'bg-emerald-500/10' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: PROVIDER_COLORS[m.provider] || '#64748b' }}
                          />
                          <div>
                            <div className="font-sans font-bold text-white flex items-center gap-1.5">
                              <span>{m.name}</span>
                              {isOptimal && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-bold text-[9px]">
                                  OPTIMAL
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">{m.providerDisplayName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                          style={{
                            backgroundColor: `${TIER_COLORS[m.tier]}20`,
                            color: TIER_COLORS[m.tier],
                            border: `1px solid ${TIER_COLORS[m.tier]}40`
                          }}
                        >
                          {m.tier.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`font-bold ${
                            m.latencyAvgMs < 300
                              ? 'text-emerald-300'
                              : m.latencyAvgMs < 800
                              ? 'text-cyan-300'
                              : 'text-amber-300'
                          }`}
                        >
                          {m.latencyAvgMs}ms
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-300">${m.inputPricePerM.toFixed(2)}</td>
                      <td className="p-3 text-right text-slate-300">${m.outputPricePerM.toFixed(2)}</td>
                      <td className="p-3 text-right text-emerald-300 font-bold">${m.blendedCost.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className="text-cyan-300 font-bold">{m.qualityBenchmarkScore}/100</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30 text-[10px]">
                          {m.efficiencyScore} pts
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {m.isUnderConstraints ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <Check className="w-3.5 h-3.5" /> Met
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Exceeds SLA</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onPrefillPrompt) {
                              onPrefillPrompt('Benchmark response latency and token cost.', m.id);
                            } else if (onNavigateTab) {
                              onNavigateTab('dispatch');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          Dispatch
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Model Inspection Modal / Detail Drawer */}
      {selectedModelForInspect && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-2xl relative animate-in fade-in duration-150">
          <div className="flex items-start justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: `${PROVIDER_COLORS[selectedModelForInspect.provider]}30` }}
              >
                <Cpu className="w-5 h-5" style={{ color: PROVIDER_COLORS[selectedModelForInspect.provider] }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white font-display">
                    {selectedModelForInspect.name}
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    ({selectedModelForInspect.providerDisplayName})
                  </span>
                </div>
                <span className="text-xs text-cyan-300 font-mono">
                  Tier: {selectedModelForInspect.tierLabel}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedModelForInspect(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs font-mono">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-slate-400 block text-[10px]">AVG LATENCY SLA</span>
              <span className="text-amber-300 font-bold text-sm">{selectedModelForInspect.latencyAvgMs}ms</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-slate-400 block text-[10px]">INPUT / OUTPUT ($/1M)</span>
              <span className="text-emerald-300 font-bold text-sm">
                ${selectedModelForInspect.inputPricePerM.toFixed(2)} / ${selectedModelForInspect.outputPricePerM.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-slate-400 block text-[10px]">BENCHMARK QUALITY</span>
              <span className="text-cyan-300 font-bold text-sm">{selectedModelForInspect.qualityBenchmarkScore}/100</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
              <span className="text-slate-400 block text-[10px]">MAX CONTEXT WINDOW</span>
              <span className="text-purple-300 font-bold text-sm">
                {(selectedModelForInspect.contextWindowTokens / 1000).toFixed(0)}k tokens
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-slate-300 font-sans leading-relaxed">
              {selectedModelForInspect.description}
            </p>
            {selectedModelForInspect.recommendedFor && selectedModelForInspect.recommendedFor.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Optimal For:</span>
                {selectedModelForInspect.recommendedFor.map((rec, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[10px] font-mono"
                  >
                    {rec}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10 mt-3 font-mono text-xs">
            <button
              onClick={() => setSelectedModelForInspect(null)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (onPrefillPrompt) {
                  onPrefillPrompt('Execute test benchmark on latency and precision.', selectedModelForInspect.id);
                } else if (onNavigateTab) {
                  onNavigateTab('dispatch');
                }
              }}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Route Queries to {selectedModelForInspect.name}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
