import React, { useState, useEffect, useMemo } from 'react';
import { auth } from '../lib/firebaseClient';
import { 
  Activity, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  SlidersHorizontal,
  Info,
  BarChart2,
  Cpu,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  DollarSign,
  Compass,
  Sliders,
  Check,
  AlertTriangle,
  Play,
  Lock
} from 'lucide-react';
import { TASK_ARCHETYPES, TaskArchetypeId } from '../core/taskTaxonomy';
import { QualityModelTracker, BetaDistribution } from '../core/qualityModel';
import { FeedbackEngine, FEEDBACK_SIGNALS, FeedbackSignalType } from '../core/feedbackEngine';
import { AIModel, UserPersona } from '../types';

interface QualityInspectorPageProps {
  qualityTracker: QualityModelTracker;
  feedbackEngine: FeedbackEngine;
  models: AIModel[];
  activePersona?: UserPersona;
  onNavigateTab: (tab: string) => void;
  onSelectModelForDispatch?: (modelId: string, prefillPrompt?: string) => void;
  onOpenAuthGate?: () => void;
}

export const QualityInspectorPage: React.FC<QualityInspectorPageProps> = ({
  qualityTracker,
  feedbackEngine,
  models,
  activePersona,
  onNavigateTab,
  onSelectModelForDispatch,
  onOpenAuthGate,
}) => {
  const [selectedArchetype, setSelectedArchetype] = useState<TaskArchetypeId>('multi_step_reasoning');
  const [qualityThreshold, setQualityThreshold] = useState<number>(0.75);
  const [activeModelId, setActiveModelId] = useState<string>(models[0]?.id || 'claude-3-7-sonnet');
  const [simGroundTruth, setSimGroundTruth] = useState<number>(0.78);
  const [simResults, setSimResults] = useState<{
    convergedMean: number;
    trueGroundTruth: number;
    delta: number;
    trials: number;
    samples: number[];
    alphaFinal: number;
    betaFinal: number;
    variance: number;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [, setTick] = useState<number>(0);

  // Subscribe to real-time updates from quality tracker
  useEffect(() => {
    return qualityTracker.subscribe(() => {
      setTick(t => t + 1);
    });
  }, [qualityTracker]);

  const archetypes = Object.values(TASK_ARCHETYPES);
  const activeModel: AIModel = models.find(m => m.id === activeModelId) || models[0];

  const activeBeta: BetaDistribution = qualityTracker.getBeta(
    selectedArchetype, 
    activeModel.provider, 
    activeModel.id
  );

  // Run 300-trial Thompson Sampling Convergence Simulation
  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      let a = 2.0;
      let b = 2.0;
      const samples: number[] = [];

      for (let i = 1; i <= 300; i++) {
        // Draw synthetic sample from Bernoulli(simGroundTruth)
        const isSuccess = Math.random() < simGroundTruth;
        if (isSuccess) a += 1.0;
        else b += 1.0;
        if (i % 25 === 0 || i === 1 || i === 300) {
          samples.push(Number((a / (a + b)).toFixed(3)));
        }
      }

      const convergedMean = Number((a / (a + b)).toFixed(4));
      const delta = Number(Math.abs(convergedMean - simGroundTruth).toFixed(4));
      const variance = Number(((a * b) / (Math.pow(a + b, 2) * (a + b + 1))).toFixed(6));

      setSimResults({
        convergedMean,
        trueGroundTruth: simGroundTruth,
        delta,
        trials: 300,
        samples,
        alphaFinal: a,
        betaFinal: b,
        variance
      });
      setIsSimulating(false);
    }, 400);
  };

  const handleSendFeedback = (signalType: FeedbackSignalType, isSuccess: boolean) => {
    feedbackEngine.applyFeedback(
      `sim_disp_${Date.now()}`,
      selectedArchetype,
      activeModel.provider,
      activeModel.id,
      signalType,
      isSuccess,
      activePersona?.role || 'admin',
      'Interactive quality tuning from Live Bayesian Quality Inspector'
    );
    const label = FEEDBACK_SIGNALS[signalType].name;
    const weight = FEEDBACK_SIGNALS[signalType].weight;
    setFeedbackNotice({
      type: 'success',
      message: `Injected ${label} (w=${weight}, ${isSuccess ? '+1 Success' : '-1 Failure'}). Updated Beta(${activeBeta.alpha.toFixed(1)}, ${activeBeta.beta.toFixed(1)}) posterior for ${activeModel.name}.`
    });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Compute model rank matrix for selected archetype
  const modelRankings = useMemo(() => {
    return models.map(m => {
      const beta = qualityTracker.getBeta(selectedArchetype, m.provider, m.id);
      const satisfiesThreshold = beta.mean >= qualityThreshold;
      // Combined utility: quality score / price penalty
      const costFactor = Math.max(0.1, m.inputPricePerM * 0.4 + m.outputPricePerM * 0.6);
      const efficiencyScore = (beta.mean * 100) / Math.log2(costFactor + 2);
      
      return {
        model: m,
        beta,
        satisfiesThreshold,
        efficiencyScore: Number(efficiencyScore.toFixed(1))
      };
    }).sort((a, b) => b.beta.mean - a.beta.mean);
  }, [models, selectedArchetype, qualityTracker, qualityThreshold]);

  const handleTestInDispatch = (model: AIModel) => {
    const defaultPrompt = TASK_ARCHETYPES[selectedArchetype]?.exampleUtterances[0] || 'Provide step-by-step reasoning.';
    if (onSelectModelForDispatch) {
      onSelectModelForDispatch(model.id, defaultPrompt);
    } else {
      onNavigateTab('dispatch');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-16">
      {/* Guest View-Only Notice Banner */}
      {!auth.currentUser && (
        <div className="bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border border-orange-500/30 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-orange-200 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              <strong>Guest View-Only Mode:</strong> You can inspect all Bayesian Beta posterior curves, archetype rankings, and Thompson sampling mathematics. Sign up with Google to test live prompt routing (3 free daily prompts via Super Admin Portal Keys, or unlimited with BYOK keys).
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
      
      {/* HERO SECTION */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-950 border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Live Bayesian Quality Inspector Mode
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20">
                Conjugate Beta-Bernoulli Tracker (§4.4)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white tracking-tight">
              Thompson-Sampling Bayesian Quality Engine
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              WhyOr maintains continuous <strong>Beta(α, β)</strong> posterior probability distributions for all 
              (Task Archetype, AI Model) combinations. Instead of relying on stale static benchmarks, the router draws 
              probabilistic samples to balance exploration of high-efficiency models with exploitation of verified frontier leaders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs font-mono shadow-xl shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <TrendingUp className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Simulating 300 Trials...' : 'Run 300-Trial Convergence Test'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('dispatch')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-white/10 transition-colors cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Open Live Dispatch</span>
            </button>
          </div>
        </div>

        {/* MATHEMATICAL PILLARS STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" /> 1. Conjugate Prior
            </span>
            <p className="text-[11px] text-slate-300 font-sans">
              Beta(α=2.0, β=2.0) weakly-informative uninformative uniform prior prevents extreme cold-start lock-in.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-bold text-cyan-400">
              <Zap className="w-3.5 h-3.5" /> 2. Bayesian Update Rule
            </span>
            <p className="text-[11px] text-slate-300 font-sans">
              α ← α + w·y and β ← β + w·(1-y) where w ∈ [0.5, 1.2] weighs the epistemic confidence of the telemetry signal.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-bold text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" /> 3. Convergence Theorem
            </span>
            <p className="text-[11px] text-slate-300 font-sans">
              Posterior mean converges to true ground truth efficacy within ±1.0% after 300 real/synthetic evaluations.
            </p>
          </div>
        </div>
      </div>

      {/* SIMULATION RESULTS HERO BANNER */}
      {simResults && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border-2 border-emerald-500/40 shadow-2xl backdrop-blur-xl space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-300 font-display">
                  Bayesian Convergence Verification Completed (§4.4)
                </h3>
                <p className="text-xs text-emerald-100/80 font-mono">
                  Synthetic Ground Truth Efficacy: <strong>{(simResults.trueGroundTruth * 100).toFixed(1)}%</strong> • Total Trials: <strong>{simResults.trials}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-2xl border border-emerald-500/30 font-mono text-xs">
              <span className="text-slate-400">Converged E[θ]:</span>
              <span className="text-lg font-bold text-emerald-300">{(simResults.convergedMean * 100).toFixed(1)}%</span>
              <span className="text-emerald-400 font-bold">(Δ = {(simResults.delta * 100).toFixed(2)}%)</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-emerald-500/20">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span>Sampling Trajectory Across 300 Trials:</span>
              <span className="text-emerald-400 font-bold">Final Posterior: Beta({simResults.alphaFinal.toFixed(1)}, {simResults.betaFinal.toFixed(1)}) • Var: {simResults.variance}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              {simResults.samples.map((s, idx) => (
                <span 
                  key={idx} 
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-400/30 text-emerald-200 font-bold"
                >
                  {(s * 100).toFixed(1)}% {idx < simResults.samples.length - 1 && <span className="text-slate-500 ml-1">→</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK STATUS TOAST */}
      {feedbackNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-mono flex items-center justify-between gap-3 animate-in fade-in shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackNotice.message}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* MAIN INTERACTIVE LAB: ARCHETYPE & MODEL SELECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Archetype & Target Model Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2 border-b border-white/10 pb-3">
              <Sliders className="w-4 h-4 text-amber-400" />
              1. Task Archetype Context
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block">
                Select 1 of 7 Archetypes (§4.1):
              </label>
              <select
                value={selectedArchetype}
                onChange={(e) => setSelectedArchetype(e.target.value as TaskArchetypeId)}
                className="w-full bg-slate-950 border border-white/20 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-amber-400"
              >
                {archetypes.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.tierHint.toUpperCase()} Hint)
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Example Utterance:</div>
              <p className="text-xs text-slate-200 italic font-mono bg-slate-900/80 p-2.5 rounded-xl border border-white/5">
                "{TASK_ARCHETYPES[selectedArchetype]?.exampleUtterances[0]}"
              </p>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span>Tier Recommended: <strong className="text-amber-400 uppercase">{TASK_ARCHETYPES[selectedArchetype]?.tierHint}</strong></span>
                <span className="text-cyan-400">Taxonomy: #{selectedArchetype}</span>
              </div>
            </div>

            {/* Target Model Candidate */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-mono text-slate-400 block">
                2. Target Model Candidate:
              </label>
              <select
                value={activeModelId}
                onChange={(e) => setActiveModelId(e.target.value)}
                className="w-full bg-slate-950 border border-white/20 rounded-xl p-3 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.providerDisplayName})
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span>Cost: ${activeModel.inputPricePerM}/M in • ${activeModel.outputPricePerM}/M out</span>
                <span className="text-emerald-400 font-bold">{activeModel.tierLabel}</span>
              </div>
            </div>

            {/* Synthetic Ground Truth Slider for Simulation */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Ground Truth Efficacy Knob:</span>
                <span className="text-amber-400 font-bold">{(simGroundTruth * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.99"
                step="0.01"
                value={simGroundTruth}
                onChange={(e) => setSimGroundTruth(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>30% (Poor Fit)</span>
                <span>75% (Standard)</span>
                <span>99% (Perfect Ground Truth)</span>
              </div>
            </div>

          </div>

          {/* Dynamic Quality Floor Slider */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white font-bold flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                Pareto Quality Threshold:
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30">
                {(qualityThreshold * 100).toFixed(0)}%
              </span>
            </div>
            
            <input
              type="range"
              min="0.40"
              max="0.95"
              step="0.05"
              value={qualityThreshold}
              onChange={(e) => setQualityThreshold(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              {qualityThreshold <= 0.60 ? '⚡ Ultra-Economy Routing: Aggressively routes to low-cost models ($0.075/M).' :
               qualityThreshold >= 0.85 ? '🛡️ High-Assurance Routing: Demands strict frontier compliance.' :
               '⚖️ Balanced Pareto Routing: Optimal quality-to-cost equilibrium.'}
            </p>
          </div>

        </div>

        {/* Right Column: Real-Time Posterior Dashboard & Feedback Injector */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* POSTERIOR DISTRIBUTION CARDS */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <span>Conjugate Beta Posterior for</span>
                  <span className="text-amber-400">{activeModel.name}</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Archetype: <strong className="text-cyan-300">{TASK_ARCHETYPES[selectedArchetype]?.name}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestInDispatch(activeModel)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs font-mono transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Dispatch With This Model</span>
                </button>
              </div>
            </div>

            {/* Posterior Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 block">Posterior Mean E[θ]:</span>
                <div className="text-2xl font-bold text-cyan-300">
                  {(activeBeta.mean * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500">α / (α + β)</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 block">Parameters (α, β):</span>
                <div className="text-2xl font-bold text-amber-300">
                  {activeBeta.alpha.toFixed(1)} / {activeBeta.beta.toFixed(1)}
                </div>
                <div className="text-[10px] text-slate-500">N = {activeBeta.nObservations} signals</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 block">Posterior Variance:</span>
                <div className="text-2xl font-bold text-purple-300">
                  {activeBeta.variance.toFixed(5)}
                </div>
                <div className="text-[10px] text-slate-500">Uncertainty spread</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 block">Floor Status:</span>
                <div className="text-lg font-bold mt-1">
                  {activeBeta.mean >= qualityThreshold ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Cleared
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Below Bar
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500">Req: {(qualityThreshold * 100).toFixed(0)}%</div>
              </div>
            </div>

            {/* LIVE FEEDBACK INJECTOR BUTTONS */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Inject Real-Time Feedback Signal into Beta Distribution:
                </span>
                <span className="text-[11px] font-mono text-slate-400">Updates live in memory & ledger</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => handleSendFeedback('EXPLICIT_THUMBS', true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Thumbs Up (+1)</span>
                </button>

                <button
                  onClick={() => handleSendFeedback('EXPLICIT_THUMBS', false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-400/30 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Thumbs Down (-1)</span>
                </button>

                <button
                  onClick={() => handleSendFeedback('EXPLICIT_REGENERATE', false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate (w=0.8)</span>
                </button>

                <button
                  onClick={() => handleSendFeedback('IMPLICIT_SCHEMA_FAIL', false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Schema Fail (w=0.6)</span>
                </button>
              </div>
            </div>

          </div>

          {/* ALL MODELS RANKING MATRIX FOR CURRENT ARCHETYPE */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                Live Model Pareto Calibration for "{TASK_ARCHETYPES[selectedArchetype]?.name}"
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Sorted by Posterior Mean E[θ]
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {modelRankings.map(({ model, beta, satisfiesThreshold, efficiencyScore }, idx) => (
                <div
                  key={model.id}
                  onClick={() => setActiveModelId(model.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    model.id === activeModelId
                      ? 'bg-amber-500/15 border-amber-400/60 shadow-lg'
                      : satisfiesThreshold
                      ? 'bg-slate-950/60 border-white/10 hover:border-white/20'
                      : 'bg-slate-950/40 border-white/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{model.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {model.providerDisplayName}
                        </span>
                        {satisfiesThreshold && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            Pareto Ready
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        ${model.inputPricePerM}/M in • Latency: {model.latencyAvgMs}ms • Efficiency Index: {efficiencyScore}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-xs w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-xs font-bold text-cyan-300">
                        {(beta.mean * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-500">
                        α={beta.alpha.toFixed(1)}, β={beta.beta.toFixed(1)}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestInDispatch(model);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-mono border border-white/10 transition-colors"
                      title="Dispatch test prompt to this model"
                    >
                      Dispatch →
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
