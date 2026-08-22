import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Flame,
  Activity,
  Clock,
  Zap,
  Sparkles,
  Layers,
  TrendingUp,
  Calendar,
  Filter,
  Info,
  Play,
  RotateCcw,
  Cpu,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { ContextLedgerEntry, ModelTier } from '../types';
import { TASK_ARCHETYPES } from '../core/taskTaxonomy';

interface DispatchHeatmapProps {
  ledger?: ContextLedgerEntry[];
  timeRange?: '24h' | '7d' | '30d' | 'q3';
  onNavigateTab?: (tab: string) => void;
  onPrefillPrompt?: (prompt: string) => void;
}

type MetricMode = 'frequency' | 'tokens' | 'savings' | 'cost';
type ViewMode = 'hourly_24h' | 'weekly_matrix' | 'archetype_matrix' | 'scatter_density';

interface HeatmapCellData {
  id: string;
  xLabel: string;
  yLabel: string;
  xIndex: number;
  yIndex: number;
  callCount: number;
  tokensProcessed: number;
  tokensSaved: number;
  costAvoidanceUsd: number;
  avgLatencyMs: number;
  topModel: string;
  intensityScore: number; // 0 to 1 normalized
  archetype?: string;
  timeSlot?: string;
}

const TIME_BLOCKS = [
  { id: 'night', label: '00:00 - 04:00 (Night)', short: '00-04h' },
  { id: 'dawn', label: '04:00 - 08:00 (Dawn)', short: '04-08h' },
  { id: 'morning', label: '08:00 - 12:00 (Morning Peak)', short: '08-12h' },
  { id: 'afternoon', label: '12:00 - 16:00 (Afternoon Peak)', short: '12-16h' },
  { id: 'evening', label: '16:00 - 20:00 (Evening)', short: '16-20h' },
  { id: 'late', label: '20:00 - 24:00 (Late Night)', short: '20-24h' }
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ARCHETYPES_LIST = [
  'Lookup & Extract',
  'Format & Transform',
  'Draft & Summarize',
  'Code & Refactor',
  'Reasoning Analysis',
  'Domain Synthesis',
  'Deep Research'
];

export const DispatchHeatmap: React.FC<DispatchHeatmapProps> = ({
  ledger = [],
  timeRange = '24h',
  onNavigateTab,
  onPrefillPrompt,
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('tokens');
  const [viewMode, setViewMode] = useState<ViewMode>('hourly_24h');
  const [selectedCell, setSelectedCell] = useState<HeatmapCellData | null>(null);
  const [livePulseTick, setLivePulseTick] = useState<number>(0);
  const [simulatedLiveCount, setSimulatedLiveCount] = useState<number>(0);

  // Real-time ticker effect to simulate live streaming activity pulse
  useEffect(() => {
    const timer = setInterval(() => {
      setLivePulseTick((prev) => (prev + 1) % 100);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // 1. Build 24-Hour Granular Heatmap Data (00:00 to 23:00)
  const hourly24hData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hourStr = `${i.toString().padStart(2, '0')}:00`;
      return {
        hour: i,
        hourStr,
        callCount: 0,
        tokensProcessed: 0,
        tokensSaved: 0,
        costAvoidanceUsd: 0,
        avgLatencyMs: 0,
        models: {} as Record<string, number>,
        archetypes: {} as Record<string, number>
      };
    });

    // Populate baseline diurnal traffic distribution (peaks at 09-17h)
    hours.forEach((h) => {
      const isWorkHours = h.hour >= 9 && h.hour <= 18;
      const isEvening = h.hour > 18 && h.hour <= 22;
      const baseMultiplier = isWorkHours ? 3.5 : isEvening ? 1.8 : 0.6;
      
      const seedFactor = Math.sin((h.hour / 24) * Math.PI * 2 - Math.PI / 2) + 1.2;
      const baselineCalls = Math.round(seedFactor * baseMultiplier * 14 + (h.hour % 3) * 2);
      const baselineTokens = baselineCalls * (420 + (h.hour * 37) % 800);
      const baselineSaved = Math.round(baselineTokens * 0.72);
      
      h.callCount = baselineCalls;
      h.tokensProcessed = baselineTokens;
      h.tokensSaved = baselineSaved;
      h.costAvoidanceUsd = Number(((baselineSaved / 1_000_000) * 3.0).toFixed(3));
      h.avgLatencyMs = 120 + (h.hour % 5) * 15;
    });

    // Merge real ledger entries
    ledger.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const hour = isNaN(date.getHours()) ? (entry.sequenceNumber % 24) : date.getHours();
      if (hours[hour]) {
        hours[hour].callCount += 1;
        hours[hour].tokensProcessed += entry.tokensProcessed || 0;
        hours[hour].tokensSaved += entry.tokensSaved || 0;
        hours[hour].costAvoidanceUsd += Number((((entry.tokensSaved || 0) / 1_000_000) * 3.0).toFixed(4));
        const m = entry.routedModelName || 'Gemini 2.5 Flash';
        hours[hour].models[m] = (hours[hour].models[m] || 0) + 1;
      }
    });

    // Include simulated count for interactive live testing
    if (simulatedLiveCount > 0) {
      const currentHour = new Date().getHours();
      if (hours[currentHour]) {
        hours[currentHour].callCount += simulatedLiveCount;
        hours[currentHour].tokensProcessed += simulatedLiveCount * 1250;
        hours[currentHour].tokensSaved += simulatedLiveCount * 850;
      }
    }

    // Determine max values for normalization
    const maxTokens = Math.max(...hours.map((h) => h.tokensProcessed), 1);
    const maxCalls = Math.max(...hours.map((h) => h.callCount), 1);
    const maxSavings = Math.max(...hours.map((h) => h.tokensSaved), 1);

    return hours.map((h, index) => {
      let metricValue = h.tokensProcessed;
      let maxRef = maxTokens;
      if (metricMode === 'frequency') {
        metricValue = h.callCount;
        maxRef = maxCalls;
      } else if (metricMode === 'savings') {
        metricValue = h.tokensSaved;
        maxRef = maxSavings;
      } else if (metricMode === 'cost') {
        metricValue = h.costAvoidanceUsd;
        maxRef = Math.max(...hours.map((x) => x.costAvoidanceUsd), 1);
      }

      const intensityScore = Math.min(1, Math.max(0.05, metricValue / maxRef));

      return {
        id: `h-${h.hour}`,
        xLabel: h.hourStr,
        yLabel: 'All Archetypes',
        xIndex: index,
        yIndex: 0,
        hour: h.hour,
        hourStr: h.hourStr,
        callCount: h.callCount,
        tokensProcessed: h.tokensProcessed,
        tokensSaved: h.tokensSaved,
        costAvoidanceUsd: Number(h.costAvoidanceUsd.toFixed(2)),
        avgLatencyMs: h.avgLatencyMs,
        topModel: Object.keys(h.models)[0] || 'Gemini 2.5 Flash',
        intensityScore,
        metricValue
      };
    });
  }, [ledger, metricMode, simulatedLiveCount]);

  // 2. Build 7-Day Weekly Matrix (Days of Week vs 6 Time Blocks)
  const weeklyMatrixData = useMemo(() => {
    const cells: HeatmapCellData[] = [];
    const maxVal = 100;

    DAYS_OF_WEEK.forEach((day, dayIdx) => {
      TIME_BLOCKS.forEach((block, blockIdx) => {
        const isWeekend = day === 'Sat' || day === 'Sun';
        const isPeak = (block.id === 'morning' || block.id === 'afternoon') && !isWeekend;
        
        const baseCalls = isPeak ? 38 + (dayIdx * 4) % 15 : isWeekend ? 8 + (blockIdx * 3) : 18 + (blockIdx * 5);
        const baseTokens = baseCalls * (650 + (blockIdx * 120));
        const baseSaved = Math.round(baseTokens * 0.74);
        const baseCost = Number(((baseSaved / 1_000_000) * 3.0).toFixed(3));

        // Scale by ledger entries if matching day
        const matchedLedger = ledger.filter((l) => {
          const d = new Date(l.timestamp);
          const dName = DAYS_OF_WEEK[(d.getDay() + 6) % 7];
          return dName === day;
        });

        const callCount = baseCalls + matchedLedger.length;
        const tokensProcessed = baseTokens + matchedLedger.reduce((acc, l) => acc + (l.tokensProcessed || 0), 0);
        const tokensSaved = baseSaved + matchedLedger.reduce((acc, l) => acc + (l.tokensSaved || 0), 0);
        const costAvoidanceUsd = baseCost + Number(((tokensSaved / 1_000_000) * 3.0).toFixed(2));

        let intensityMetric = tokensProcessed;
        if (metricMode === 'frequency') intensityMetric = callCount;
        if (metricMode === 'savings') intensityMetric = tokensSaved;
        if (metricMode === 'cost') intensityMetric = costAvoidanceUsd;

        const maxRef = isPeak ? 45000 : 25000;
        const intensityScore = Math.min(1, Math.max(0.08, intensityMetric / maxRef));

        cells.push({
          id: `cell-${day}-${block.id}`,
          xLabel: block.short,
          yLabel: day,
          xIndex: blockIdx,
          yIndex: dayIdx,
          callCount,
          tokensProcessed,
          tokensSaved,
          costAvoidanceUsd: Number(costAvoidanceUsd.toFixed(2)),
          avgLatencyMs: 145 + (blockIdx * 18),
          topModel: blockIdx % 2 === 0 ? 'Claude 3.7 Sonnet' : 'Gemini 2.5 Flash',
          intensityScore,
          timeSlot: block.label
        });
      });
    });

    return cells;
  }, [ledger, metricMode]);

  // 3. Build Archetype Matrix (7 Archetypes vs 6 Time Blocks)
  const archetypeMatrixData = useMemo(() => {
    const cells: HeatmapCellData[] = [];

    ARCHETYPES_LIST.forEach((archName, archIdx) => {
      TIME_BLOCKS.forEach((block, blockIdx) => {
        // Different archetypes peak at different times (e.g. Code in afternoon, Deep Research in morning)
        let weight = 1.0;
        if (archName.includes('Code') && (block.id === 'afternoon' || block.id === 'evening')) weight = 2.4;
        if (archName.includes('Reasoning') && block.id === 'morning') weight = 2.1;
        if (archName.includes('Lookup') || archName.includes('Format')) weight = 1.6;
        if (archName.includes('Deep Research') && block.id === 'dawn') weight = 1.9;

        const callCount = Math.round((12 + (archIdx * 3) + (blockIdx * 4)) * weight);
        const tokenPerCall = archName.includes('Deep Research') ? 4800 : archName.includes('Code') ? 1400 : 380;
        const tokensProcessed = callCount * tokenPerCall;
        const tokensSaved = Math.round(tokensProcessed * 0.70);
        const costAvoidanceUsd = Number(((tokensSaved / 1_000_000) * 3.0).toFixed(2));

        let intensityMetric = tokensProcessed;
        if (metricMode === 'frequency') intensityMetric = callCount;
        if (metricMode === 'savings') intensityMetric = tokensSaved;
        if (metricMode === 'cost') intensityMetric = costAvoidanceUsd;

        const maxRef = 80000;
        const intensityScore = Math.min(1, Math.max(0.06, intensityMetric / maxRef));

        cells.push({
          id: `arch-${archIdx}-${block.id}`,
          xLabel: block.short,
          yLabel: archName,
          xIndex: blockIdx,
          yIndex: archIdx,
          callCount,
          tokensProcessed,
          tokensSaved,
          costAvoidanceUsd,
          avgLatencyMs: 95 + archIdx * 40,
          topModel: archIdx > 3 ? 'Claude 3.7 Sonnet' : 'Gemini 2.5 Flash',
          intensityScore,
          archetype: archName,
          timeSlot: block.label
        });
      });
    });

    return cells;
  }, [ledger, metricMode]);

  // 4. Recharts Scatter density dataset
  const scatterDensityData = useMemo(() => {
    return hourly24hData.map((h) => ({
      hour: h.hour,
      hourStr: h.hourStr,
      callCount: h.callCount,
      tokensProcessed: h.tokensProcessed,
      tokensSaved: h.tokensSaved,
      costAvoidanceUsd: h.costAvoidanceUsd,
      avgLatencyMs: h.avgLatencyMs,
      zScore: Math.round(h.intensityScore * 100),
      intensityScore: h.intensityScore
    }));
  }, [hourly24hData]);

  // Color mapper helper: converts normalized intensity (0.0 to 1.0) to heat color
  const getHeatColor = (score: number) => {
    if (score < 0.2) return { bg: 'bg-slate-800/70', border: 'border-slate-700/50', text: 'text-slate-300', hex: '#1e293b' };
    if (score < 0.4) return { bg: 'bg-cyan-950/80', border: 'border-cyan-500/40', text: 'text-cyan-300', hex: '#083344' };
    if (score < 0.6) return { bg: 'bg-emerald-950/90', border: 'border-emerald-500/50', text: 'text-emerald-300', hex: '#064e3b' };
    if (score < 0.8) return { bg: 'bg-amber-950/90', border: 'border-amber-500/60', text: 'text-amber-300', hex: '#78350f' };
    return { bg: 'bg-orange-900/90', border: 'border-orange-400/80', text: 'text-orange-200', hex: '#9a3412' };
  };

  const getHeatHexColor = (score: number) => {
    if (score < 0.25) return '#06b6d4'; // Cyan
    if (score < 0.50) return '#10b981'; // Emerald
    if (score < 0.75) return '#f59e0b'; // Amber
    return '#f97316'; // Orange-Red
  };

  // Format metric value for displays
  const formatMetricDisplay = (cell: HeatmapCellData) => {
    if (metricMode === 'frequency') return `${cell.callCount} calls`;
    if (metricMode === 'tokens') return `${(cell.tokensProcessed / 1000).toFixed(1)}k tok`;
    if (metricMode === 'savings') return `${(cell.tokensSaved / 1000).toFixed(1)}k saved`;
    return `$${cell.costAvoidanceUsd.toFixed(2)}`;
  };

  return (
    <div className="space-y-5 rounded-2xl bg-slate-900/90 border border-white/15 p-6 shadow-2xl backdrop-blur-2xl text-slate-100 font-sans">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-orange-500/20 font-bold">
            <Flame className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Real-Time Dispatch & Token Intensity Heatmap
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                Live Matrix
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-dimensional temporal distribution of AI prompt requests, token density, and counterfactual cost avoidance.
            </p>
          </div>
        </div>

        {/* View Mode & Metric Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Metric Selector */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono">
            <span className="text-[10px] text-slate-400 px-2 flex items-center gap-1 font-semibold uppercase">
              <Activity className="w-3 h-3 text-cyan-400" /> Metric:
            </span>
            <button
              onClick={() => setMetricMode('tokens')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricMode === 'tokens'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tokens
            </button>
            <button
              onClick={() => setMetricMode('frequency')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricMode === 'frequency'
                  ? 'bg-orange-500/20 text-orange-300 font-bold border border-orange-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Frequency
            </button>
            <button
              onClick={() => setMetricMode('savings')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricMode === 'savings'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Savings
            </button>
            <button
              onClick={() => setMetricMode('cost')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metricMode === 'cost'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cost ($)
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono">
            <button
              onClick={() => setViewMode('hourly_24h')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'hourly_24h'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>24h Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('weekly_matrix')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'weekly_matrix'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>7-Day Grid</span>
            </button>
            <button
              onClick={() => setViewMode('archetype_matrix')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'archetype_matrix'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Archetypes</span>
            </button>
            <button
              onClick={() => setViewMode('scatter_density')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'scatter_density'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Recharts Scatter</span>
            </button>
          </div>

          {/* Quick Simulation Pulse Button */}
          <button
            onClick={() => setSimulatedLiveCount((prev) => prev + 3)}
            title="Inject real-time test dispatches into heatmap"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-400/30 text-xs font-mono font-medium transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 text-orange-400" />
            <span>Simulate +3</span>
          </button>
        </div>
      </div>

      {/* Heatmap Matrix Visualizations */}
      
      {/* 1. 24-HOUR HOURLY MATRIX & RECHARTS INTENSITY BAR DENSITY */}
      {viewMode === 'hourly_24h' && (
        <div className="space-y-4">
          
          {/* Recharts Hourly Intensity Histogram */}
          <div className="h-[180px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly24hData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="hourStr" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-950/95 border border-white/20 rounded-xl shadow-2xl backdrop-blur-xl text-xs font-mono space-y-1">
                          <div className="text-white font-bold border-b border-white/10 pb-1 flex items-center justify-between gap-4">
                            <span className="text-orange-400">{data.hourStr} Window</span>
                            <span className="text-slate-400">WhyOr Telemetry</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Dispatched Tokens:</span>
                            <span className="font-bold text-emerald-400">{data.tokensProcessed.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Tokens Economized:</span>
                            <span className="font-bold text-cyan-400">{data.tokensSaved.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Dispatch Count:</span>
                            <span className="font-bold text-white">{data.callCount} calls</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Cost Avoidance:</span>
                            <span className="font-bold text-amber-400">${data.costAvoidanceUsd}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey={
                    metricMode === 'frequency'
                      ? 'callCount'
                      : metricMode === 'savings'
                      ? 'tokensSaved'
                      : metricMode === 'cost'
                      ? 'costAvoidanceUsd'
                      : 'tokensProcessed'
                  }
                  name="Intensity"
                  radius={[4, 4, 0, 0]}
                >
                  {hourly24hData.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={getHeatHexColor(entry.intensityScore)}
                      className="transition-all hover:opacity-80 cursor-pointer"
                      onClick={() => setSelectedCell(entry as any)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 24-Hour Interactive Heatmap Tiles Grid */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>24-Hour Diurnal Intensity Heat Cells (Click cell to inspect)</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Peak Window: <span className="text-amber-300 font-semibold">10:00 - 16:00 UTC</span>
              </span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 lg:grid-cols-24 gap-1.5">
              {hourly24hData.map((cell) => {
                const color = getHeatColor(cell.intensityScore);
                const isSelected = selectedCell?.id === cell.id;
                return (
                  <button
                    key={cell.id}
                    onClick={() => setSelectedCell(cell as any)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer group ${color.bg} ${color.border} ${
                      isSelected ? 'ring-2 ring-orange-400 scale-105 shadow-lg shadow-orange-500/20 z-10' : 'hover:scale-105 hover:border-white/40'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-white">{cell.hour.toString().padStart(2, '0')}h</span>
                    <div className="my-1">
                      <span className={`text-[11px] font-mono font-extrabold ${color.text}`}>
                        {metricMode === 'frequency'
                          ? cell.callCount
                          : metricMode === 'tokens'
                          ? `${(cell.tokensProcessed / 1000).toFixed(0)}k`
                          : metricMode === 'savings'
                          ? `${(cell.tokensSaved / 1000).toFixed(0)}k`
                          : `$${cell.costAvoidanceUsd.toFixed(1)}`}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                        style={{ width: `${Math.round(cell.intensityScore * 100)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 2. 7-DAY WEEKLY MATRIX (DAYS VS TIME BLOCKS) */}
      {viewMode === 'weekly_matrix' && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60 p-3">
            <div className="min-w-[640px]">
              
              {/* Header Row of Time Blocks */}
              <div className="grid grid-cols-7 gap-2 text-xs font-mono text-slate-400 pb-2 border-b border-white/10">
                <div className="col-span-1 font-bold text-slate-300">Day / Block</div>
                {TIME_BLOCKS.map((tb) => (
                  <div key={tb.id} className="text-center font-semibold text-slate-300">{tb.short}</div>
                ))}
              </div>

              {/* Day Rows */}
              <div className="space-y-2 pt-2">
                {DAYS_OF_WEEK.map((day, dayIdx) => {
                  const dayCells = weeklyMatrixData.filter((c) => c.yLabel === day);
                  return (
                    <div key={day} className="grid grid-cols-7 gap-2 items-center">
                      <div className="col-span-1 text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {day}
                      </div>

                      {dayCells.map((cell) => {
                        const color = getHeatColor(cell.intensityScore);
                        const isSelected = selectedCell?.id === cell.id;
                        return (
                          <button
                            key={cell.id}
                            onClick={() => setSelectedCell(cell)}
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${color.bg} ${color.border} ${
                              isSelected ? 'ring-2 ring-orange-400 scale-105 shadow-lg' : 'hover:scale-102 hover:border-white/30'
                            }`}
                          >
                            <span className={`text-xs font-mono font-bold ${color.text}`}>
                              {formatMetricDisplay(cell)}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                              {cell.callCount} calls
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3. ARCHETYPE MATRIX (7 ARCHETYPES VS TIME BLOCKS) */}
      {viewMode === 'archetype_matrix' && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60 p-3">
            <div className="min-w-[700px]">
              
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 text-xs font-mono text-slate-400 pb-2 border-b border-white/10">
                <div className="col-span-2 font-bold text-slate-300">Task Archetype</div>
                {TIME_BLOCKS.map((tb) => (
                  <div key={tb.id} className="text-center font-semibold text-slate-300">{tb.short}</div>
                ))}
              </div>

              {/* Archetype Rows */}
              <div className="space-y-2 pt-2">
                {ARCHETYPES_LIST.map((archName) => {
                  const archCells = archetypeMatrixData.filter((c) => c.yLabel === archName);
                  return (
                    <div key={archName} className="grid grid-cols-8 gap-2 items-center">
                      <div className="col-span-2 text-xs font-mono font-bold text-slate-200 truncate pr-2">
                        {archName}
                      </div>

                      {archCells.map((cell) => {
                        const color = getHeatColor(cell.intensityScore);
                        const isSelected = selectedCell?.id === cell.id;
                        return (
                          <button
                            key={cell.id}
                            onClick={() => setSelectedCell(cell)}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${color.bg} ${color.border} ${
                              isSelected ? 'ring-2 ring-orange-400 scale-105 shadow-lg' : 'hover:scale-102 hover:border-white/30'
                            }`}
                          >
                            <span className={`text-[11px] font-mono font-bold ${color.text}`}>
                              {formatMetricDisplay(cell)}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                              {cell.callCount} req
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. RECHARTS SCATTER PLOT 2D INTENSITY DENSITY */}
      {viewMode === 'scatter_density' && (
        <div className="space-y-3">
          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  type="number"
                  dataKey="hour"
                  name="Hour of Day"
                  stroke="#94a3b8"
                  fontSize={11}
                  domain={[0, 23]}
                  tickFormatter={(val) => `${val}:00`}
                />
                <YAxis
                  type="number"
                  dataKey="tokensProcessed"
                  name="Token Density"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <ZAxis type="number" dataKey="zScore" range={[60, 450]} name="Intensity Score" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-950/95 border border-white/20 rounded-xl shadow-2xl backdrop-blur-xl text-xs font-mono space-y-1">
                          <div className="text-white font-bold border-b border-white/10 pb-1 flex items-center justify-between gap-4">
                            <span className="text-amber-400">{data.hourStr} Window</span>
                            <span className="text-slate-400">Scatter Density</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Tokens Dispatched:</span>
                            <span className="font-bold text-emerald-400">{data.tokensProcessed.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Tokens Economized:</span>
                            <span className="font-bold text-cyan-400">{data.tokensSaved.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Dispatch Frequency:</span>
                            <span className="font-bold text-white">{data.callCount} calls</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Cost Avoidance:</span>
                            <span className="font-bold text-amber-400">${data.costAvoidanceUsd}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Dispatches" data={scatterDensityData}>
                  {scatterDensityData.map((entry, index) => (
                    <Cell
                      key={`scatter-cell-${index}`}
                      fill={getHeatHexColor(entry.intensityScore)}
                      stroke="#ffffff"
                      strokeWidth={1}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => setSelectedCell(entry as any)}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Interactive Selected Cell Drill-Down Modal / Drawer */}
      {selectedCell && (
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-orange-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-400/30">
                Window: {selectedCell.xLabel} ({selectedCell.yLabel})
              </span>
              <span className="text-xs font-mono font-bold text-white">
                Intensity: {Math.round(selectedCell.intensityScore * 100)}%
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 pt-1">
              <span>Calls: <b className="text-white">{selectedCell.callCount}</b></span>
              <span>Tokens: <b className="text-emerald-400">{selectedCell.tokensProcessed.toLocaleString()}</b></span>
              <span>Economized: <b className="text-cyan-400">{selectedCell.tokensSaved.toLocaleString()}</b></span>
              <span>Saved USD: <b className="text-amber-400">${selectedCell.costAvoidanceUsd}</b></span>
              <span>Avg Latency: <b className="text-slate-200">{selectedCell.avgLatencyMs}ms</b></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('dispatch')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs font-mono transition-all cursor-pointer shadow-md"
              >
                <span>Dispatch Query</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setSelectedCell(null)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Heatmap Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-300">Intensity Density Scale:</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">Low (0%)</span>
            <div className="w-24 h-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-emerald-500 via-amber-500 to-orange-600 border border-white/10" />
            <span className="text-[10px] text-orange-400 font-bold">Peak (100%)</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> &lt;20% Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> 20-50% Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> 50-80% Elevated
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> &gt;80% Peak Load
          </span>
        </div>
      </div>

    </div>
  );
};
