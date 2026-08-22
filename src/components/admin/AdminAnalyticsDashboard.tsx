import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity, 
  Clock, 
  Sparkles, 
  RefreshCw,
  Cpu,
  ArrowUpRight,
  Download,
  Building2,
  Search
} from 'lucide-react';
import { 
  loadAllUserTrialsFromFirestore, 
  UserTrialInfo, 
  loadAdminKeyConfigsFromFirestore, 
  AdminKeyConfig,
  CompanyFirestore,
  loadCompaniesFromFirestore,
  loadDispatchLedgerFromFirestore
} from '../../lib/firebase';

interface AdminAnalyticsDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({ onNavigateTab }) => {
  const [trials, setTrials] = useState<UserTrialInfo[]>([]);
  const [keys, setKeys] = useState<AdminKeyConfig[]>([]);
  const [companies, setCompanies] = useState<CompanyFirestore[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeWindow, setTimeWindow] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allTrials, allKeys, allComps, allLedger] = await Promise.all([
        loadAllUserTrialsFromFirestore(),
        loadAdminKeyConfigsFromFirestore(),
        loadCompaniesFromFirestore(),
        loadDispatchLedgerFromFirestore(500)
      ]);
      setTrials(allTrials);
      setKeys(allKeys);
      setCompanies(allComps);
      setLedgerEntries(allLedger);
    } catch (e) {
      console.warn('Analytics loading fallback', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalUsers = trials.length;
  const activeTrials = trials.filter(t => t.isTrialActive).length;
  const expiredTrials = trials.filter(t => !t.isTrialActive && !t.isPaidPlan).length;
  const paidUsers = trials.filter(t => t.isPaidPlan).length;
  
  // Real aggregate calculations
  const totalDispatches = ledgerEntries.length + trials.reduce((acc, t) => acc + (t.totalDispatches || 0), 0);
  
  const companyTokens = companies.reduce((acc, c) => acc + (c.monthlyTokensUsed || 0), 0);
  const trialTokens = trials.reduce((acc, t) => acc + (t.dailyTokensUsed || 0) + (t.totalTokensProcessed || 0), 0);
  const ledgerTokens = ledgerEntries.reduce((acc, l) => acc + (l.tokensIn || 0) + (l.tokensOut || 0) + (l.tokensSaved || 0), 0);
  const totalTokens = Math.max(ledgerTokens, companyTokens + trialTokens);

  // Counterfactual savings estimation based purely on real tokens
  const estCostWithoutWhyOr = (totalTokens / 1000) * 0.015; // standard frontier price ($15/M)
  const estCostWithWhyOr = (totalTokens / 1000) * 0.0028; // mixed Pareto price ($2.80/M)
  const estSavings = totalTokens > 0 ? Math.max(0, estCostWithoutWhyOr - estCostWithWhyOr) : 0;
  const savingsPct = totalTokens > 0 ? Number(((estSavings / (estCostWithoutWhyOr || 1)) * 100).toFixed(1)) : 0;

  // Real Model Distribution Breakdown
  const geminiCount = ledgerEntries.filter(l => l.provider === 'google' || l.provider === 'gemini' || (l.targetModel && l.targetModel.includes('gemini'))).length;
  const claudeCount = ledgerEntries.filter(l => l.provider === 'anthropic' || (l.targetModel && l.targetModel.includes('claude'))).length;
  const deepseekCount = ledgerEntries.filter(l => l.provider === 'deepseek' || (l.targetModel && l.targetModel.includes('deepseek'))).length;
  const openaiCount = ledgerEntries.filter(l => l.provider === 'openai' || (l.targetModel && (l.targetModel.includes('gpt') || l.targetModel.includes('o3')))).length;
  const totalLedgerDispatches = ledgerEntries.length;

  const geminiPct = totalLedgerDispatches > 0 ? ((geminiCount / totalLedgerDispatches) * 100).toFixed(1) : '0.0';
  const claudePct = totalLedgerDispatches > 0 ? ((claudeCount / totalLedgerDispatches) * 100).toFixed(1) : '0.0';
  const deepseekPct = totalLedgerDispatches > 0 ? ((deepseekCount / totalLedgerDispatches) * 100).toFixed(1) : '0.0';
  const openaiPct = totalLedgerDispatches > 0 ? ((openaiCount / totalLedgerDispatches) * 100).toFixed(1) : '0.0';

  // Real Funnel metrics
  const dispatchedTrialCount = trials.filter(t => (t.totalDispatches || 0) > 0).length;
  const byokTrialCount = trials.filter(t => t.hasConfiguredByok || (t as any).isByokConfigured).length;
  const dispatchedPct = totalUsers > 0 ? Math.round((dispatchedTrialCount / totalUsers) * 100) : 0;
  const byokPct = totalUsers > 0 ? Math.round((byokTrialCount / totalUsers) * 100) : 0;

  // Filtered company analytics
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchFilter.toLowerCase()) || c.domain.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesSelect = selectedCompanyFilter === 'all' || c.id === selectedCompanyFilter;
    return matchesSearch && matchesSelect;
  });

  // Export Analytics CSV
  const handleExportTelemetry = () => {
    const headers = ['Company', 'Domain', 'Tier', 'Tokens Consumed', 'Token Quota', 'Utilization %', 'Budget USD', 'Est Savings USD', 'Status'];
    const rows = companies.map(c => {
      const consumed = c.monthlyTokensUsed || 0;
      const quota = c.monthlyTokenQuota || 1;
      const util = Math.min(100, Math.round((consumed / quota) * 100));
      const savings = ((consumed / 1000) * (0.015 - 0.0028)).toFixed(2);
      return [
        `"${c.name}"`,
        c.domain,
        c.tier,
        consumed,
        quota,
        `${util}%`,
        c.monthlyBudgetUsd || 0,
        `$${savings}`,
        c.status
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `whyor_usage_analytics_${timeWindow}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-orange-950/20 to-slate-900/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-bold font-display text-white">Platform Usage & Multi-Tenant Telemetry</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-orange-500/20 text-orange-300 border border-orange-500/30">
              Live Aggregate
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-time multi-model dispatch volume, Bayesian Pareto cost savings, latency percentiles, and per-tenant quota consumption analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Window Tabs */}
          <div className="flex items-center bg-slate-950/80 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setTimeWindow('today')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeWindow === 'today' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeWindow('7d')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeWindow === '7d' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 7D
            </button>
            <button
              onClick={() => setTimeWindow('30d')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeWindow === '30d' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 30D
            </button>
            <button
              onClick={() => setTimeWindow('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                timeWindow === 'all' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All-Time
            </button>
          </div>

          <button
            onClick={handleExportTelemetry}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-white/10 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL DISPATCHES</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {totalDispatches.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Live Telemetry Streams</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>COST AVOIDANCE (PARETO ROI)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400">
            ${estSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-300 flex items-center gap-1 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{savingsPct}% Token Cost Reduction</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL TOKENS PROCESSED</span>
            <Cpu className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-orange-400">
            {(totalTokens / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Across {companies.length} enterprise {companies.length === 1 ? 'tenant' : 'tenants'}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>ACTIVE 7-DAY TRIALS</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-purple-400">
            {activeTrials} <span className="text-xs text-slate-400 font-normal">/ {totalUsers} total</span>
          </div>
          <div className="text-[11px] text-purple-300 font-mono">
            {paidUsers} Pro Paid · {expiredTrials} Expired BYOK
          </div>
        </div>

      </div>

      {/* PER-COMPANY USAGE ANALYSIS TABLE */}
      <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Per-Tenant Usage & Economic Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Live consumption telemetry across onboarded corporate accounts.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search tenant..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredCompanies.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 border border-white/5 rounded-xl text-slate-400 text-xs">
              No customer tenants found matching filter. Add new tenants in the Company & Team Onboarding portal.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tenant Organization</th>
                  <th className="py-3 px-4 font-semibold">Plan Tier</th>
                  <th className="py-3 px-4 font-semibold">Tokens Consumed</th>
                  <th className="py-3 px-4 font-semibold">Quota Capacity</th>
                  <th className="py-3 px-4 font-semibold">Monthly Budget</th>
                  <th className="py-3 px-4 font-semibold">Estimated Savings</th>
                  <th className="py-3 px-4 font-semibold text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredCompanies.map((company) => {
                  const consumedTokens = company.monthlyTokensUsed || 0;
                  const quota = company.monthlyTokenQuota || 1;
                  const utilPct = quota > 0 ? Math.min(100, Math.round((consumedTokens / quota) * 100)) : 0;
                  const savings = ((consumedTokens / 1000) * (0.015 - 0.0028)).toFixed(2);

                  return (
                    <tr key={company.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{company.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                            {company.domain}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {company.tier}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-orange-400">
                        {(consumedTokens / 1_000_000).toFixed(2)}M
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-[10px] font-mono text-slate-400">
                            <span>{utilPct}%</span>
                            <span>{(quota / 1_000_000).toFixed(0)}M cap</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                utilPct > 90 ? 'bg-rose-500' : utilPct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${utilPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-emerald-400">
                        ${(company.monthlyBudgetUsd || 0).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-300">
                        ${Number(savings).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onNavigateTab('customers')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Inspect Tenant
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODEL DISTRIBUTION & ROUTING EFFICIENCY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Model Breakdown */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-orange-400" />
              Multi-Model Routing Distribution Split
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {totalLedgerDispatches} {totalLedgerDispatches === 1 ? 'Dispatch' : 'Dispatches'} Tracked
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Thompson Sampling Pareto distribution: routing high-velocity subtasks to fast models and reserving frontier engines for complex reasoning.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-300">Google Gemini 3.7 Flash & 3.1 Lite (Ultra-Low Latency & Structured)</span>
                <span className="text-emerald-400 font-bold">{geminiPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${geminiPct}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-300">Anthropic Claude 3.7 Sonnet & 3.5 Haiku (Code & Hybrid Reasoning)</span>
                <span className="text-orange-400 font-bold">{claudePct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${claudePct}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-300">DeepSeek R1 / V3 (Mathematical & Scientific Verification)</span>
                <span className="text-cyan-400 font-bold">{deepseekPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${deepseekPct}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-300">OpenAI GPT-4.5 / GPT-4o / o3-mini (General Drafting & Synthesis)</span>
                <span className="text-purple-400 font-bold">{openaiPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${openaiPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 7-Day Trial Funnel */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Users className="w-4 h-4 text-cyan-400" />
              7-Day Trial Conversion Funnel
            </h3>
            <p className="text-xs text-slate-400">
              Real telemetry of user progression from managed free trial to BYOK API configuration.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between">
              <span className="text-slate-300">1. Signed Up for 7-Day Trial</span>
              <span className="font-mono font-bold text-white">{totalUsers} Users (100%)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between">
              <span className="text-slate-300">2. Dispatched &gt; 0 Prompts</span>
              <span className="font-mono font-bold text-cyan-400">{dispatchedTrialCount} Users ({dispatchedPct}%)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between">
              <span className="text-slate-300">3. Configured BYOK Keys</span>
              <span className="font-mono font-bold text-orange-400">{byokTrialCount} Users ({byokPct}%)</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('subscriptions')}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Manage User Subscriptions & Trials</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
