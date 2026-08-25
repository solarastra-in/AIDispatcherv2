import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  Lock, 
  Globe, 
  Cpu, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  RefreshCw, 
  Save, 
  Bell, 
  Activity, 
  Server, 
  Clock, 
  KeyRound,
  FileCode,
  Info
} from 'lucide-react';
import { 
  recordAuditLogToFirestore, 
  auth 
} from '../../lib/firebase';
import { resolveApiUrl } from '../../lib/firebaseClient';

export interface PlatformGlobalConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  circuitBreakerActive: boolean;
  defaultRoutingMode: 'balanced_pareto' | 'speed_first' | 'frontier_quality' | 'cost_minimum';
  globalRateLimitRpm: number;
  maxConcurrencyPerTenant: number;
  forceGoogleSsoForAdmins: boolean;
  sessionTimeoutMinutes: number;
  strictDomainMatchOnly: boolean;
  defaultNewCompanyQuotaTokens: number;
  defaultNewCompanyBudgetUsd: number;
  quotaWarningThresholdPct: number;
  autoThrottleOnOverQuota: boolean;
  byokEnvelopeEncryption: 'aes_256_gcm' | 'rsa_4096';
  allowLocalProxyDaemons: boolean;
  dailyFreePromptLimit: number;
}

const DEFAULT_GLOBAL_CONFIG: PlatformGlobalConfig = {
  maintenanceMode: false,
  maintenanceMessage: 'WhyOr Dispatch AI is undergoing scheduled optimization upgrades. Dispatches will resume momentarily.',
  circuitBreakerActive: false,
  defaultRoutingMode: 'balanced_pareto',
  globalRateLimitRpm: 1200,
  maxConcurrencyPerTenant: 40,
  forceGoogleSsoForAdmins: true,
  sessionTimeoutMinutes: 60,
  strictDomainMatchOnly: false,
  defaultNewCompanyQuotaTokens: 50_000_000,
  defaultNewCompanyBudgetUsd: 2500,
  quotaWarningThresholdPct: 80,
  autoThrottleOnOverQuota: true,
  byokEnvelopeEncryption: 'aes_256_gcm',
  allowLocalProxyDaemons: true,
  dailyFreePromptLimit: 3
};

export const AdminPlatformConfigPortal: React.FC = () => {
  const [config, setConfig] = useState<PlatformGlobalConfig>(() => {
    const saved = localStorage.getItem('whyor_global_platform_config');
    if (saved) {
      try {
        return { ...DEFAULT_GLOBAL_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_GLOBAL_CONFIG;
      }
    }
    return DEFAULT_GLOBAL_CONFIG;
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  useEffect(() => {
    // Fetch live config from server
    fetch(resolveApiUrl('/api/admin/platform-config'))
      .then(res => res.json())
      .then(data => {
        if (data && data.config) {
          setConfig(prev => ({
            ...prev,
            ...data.config,
            dailyFreePromptLimit: typeof data.config.dailyFreePromptLimit === 'number' ? data.config.dailyFreePromptLimit : (prev.dailyFreePromptLimit || 3)
          }));
        }
      })
      .catch(() => {
        // Fallback to local storage
      });
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('whyor_global_platform_config', JSON.stringify(config));

      // Persist to server
      const token = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => '') : '';
      await fetch(resolveApiUrl('/api/admin/platform-config'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(config)
      });

      const adminEmail = auth.currentUser?.email || 'Admin Superuser';
      await recordAuditLogToFirestore(
        'Updated Global Platform Configuration',
        'platform_config',
        adminEmail,
        `Saved platform policies: DailyLimit=${config.dailyFreePromptLimit}, Maintenance=${config.maintenanceMode}, Routing=${config.defaultRoutingMode}, SSO=${config.forceGoogleSsoForAdmins}, Concurrency=${config.maxConcurrencyPerTenant}.`
      );

      setNotification({
        type: 'success',
        text: 'Global platform configuration saved and applied across cluster services.'
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: `Failed to save configuration: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setConfirmOpen(true);
  };

  const executeResetDefaults = () => {
    setConfirmOpen(false);
    setConfig(DEFAULT_GLOBAL_CONFIG);
    setNotification({ type: 'info', text: 'Reset configurations to default specifications.' });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold font-display text-white">Portal Global Controls & Enterprise Policies</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
              System Wide
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Configure system-wide dispatch routing models, circuit breaker thresholds, administrative security rules, and multi-tenant quotas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-white/10 transition-all cursor-pointer"
          >
            Reset Defaults
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Global Config</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs animate-fadeIn ${
          notification.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
            : notification.type === 'error'
            ? 'bg-rose-950/60 border-rose-800/80 text-rose-200'
            : 'bg-indigo-950/60 border-indigo-800/80 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white font-mono cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Config Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Maintenance & Circuit Breakers */}
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Activity className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              System Availability & Circuit Breakers
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-white/10">
              <div className="space-y-0.5">
                <span className="font-bold text-white block">Platform Maintenance Mode</span>
                <span className="text-slate-400 text-[11px]">Displays maintenance barrier to non-admin corporate users.</span>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  config.maintenanceMode ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  config.maintenanceMode ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {config.maintenanceMode && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Maintenance Banner Notification</label>
                <input
                  type="text"
                  value={config.maintenanceMessage}
                  onChange={(e) => setConfig({ ...config, maintenanceMessage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-200 focus:outline-none text-xs"
                />
              </div>
            )}

            {/* Circuit Breaker */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-white/10">
              <div className="space-y-0.5">
                <span className="font-bold text-white block">Global Outbound Circuit Breaker</span>
                <span className="text-slate-400 text-[11px]">Instantly halt all external model dispatch requests during upstream provider outages.</span>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, circuitBreakerActive: !config.circuitBreakerActive })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  config.circuitBreakerActive ? 'bg-rose-500' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  config.circuitBreakerActive ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Concurrency & RPM Limits */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Global Rate Limit (RPM)</label>
                <input
                  type="number"
                  value={config.globalRateLimitRpm}
                  onChange={(e) => setConfig({ ...config, globalRateLimitRpm: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Max Concurrency / Tenant</label>
                <input
                  type="number"
                  value={config.maxConcurrencyPerTenant}
                  onChange={(e) => setConfig({ ...config, maxConcurrencyPerTenant: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Routing Strategy & AI Defaults */}
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Multi-Model Engine & Routing Strategy
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Default Multi-Model Dispatch Optimizer</label>
              <select
                value={config.defaultRoutingMode}
                onChange={(e) => setConfig({ ...config, defaultRoutingMode: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="balanced_pareto">Thompson Sampling Pareto Optimizer (Optimal Cost-to-Quality)</option>
                <option value="speed_first">Ultra-Low Latency Priority (Gemini 3.1 Flash Lite / Claude Haiku)</option>
                <option value="frontier_quality">Frontier Reasoning Quality (Claude 3.7 Sonnet / GPT-4.5 / DeepSeek R1)</option>
                <option value="cost_minimum">Extreme Cost Minimization (Sub-$0.20/M tokens)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-white/10">
              <div className="space-y-0.5">
                <span className="font-bold text-white block">Allow Local Reverse Proxy Daemons</span>
                <span className="text-slate-400 text-[11px]">Permit corporate localhost daemons for zero-cost flat-rate routing.</span>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, allowLocalProxyDaemons: !config.allowLocalProxyDaemons })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  config.allowLocalProxyDaemons ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  config.allowLocalProxyDaemons ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">BYOK Key Envelope Encryption</label>
              <select
                value={config.byokEnvelopeEncryption}
                onChange={(e) => setConfig({ ...config, byokEnvelopeEncryption: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="aes_256_gcm">AES-256-GCM Authenticated Envelope (FIPS 140-3 Validated)</option>
                <option value="rsa_4096">RSA-4096 Asymmetric Hardware Security Module</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Security & Governance Policies */}
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Security & Identity Governance
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-white/10">
              <div className="space-y-0.5">
                <span className="font-bold text-white block">Enforce Google SSO / MFA for Admins</span>
                <span className="text-slate-400 text-[11px]">Require hardware 2FA and Google Identity Services for all company administrators.</span>
              </div>
              <button
                type="button"
                onClick={() => setConfig({ ...config, forceGoogleSsoForAdmins: !config.forceGoogleSsoForAdmins })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  config.forceGoogleSsoForAdmins ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  config.forceGoogleSsoForAdmins ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Session Inactivity Timeout</label>
                <select
                  value={config.sessionTimeoutMinutes}
                  onChange={(e) => setConfig({ ...config, sessionTimeoutMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour (Recommended)</option>
                  <option value={480}>8 Hours</option>
                  <option value={1440}>24 Hours</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Strict Domain Match Only</label>
                <select
                  value={config.strictDomainMatchOnly ? 'true' : 'false'}
                  onChange={(e) => setConfig({ ...config, strictDomainMatchOnly: e.target.value === 'true' })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="false">Allow Sub-Domains & External Invites</option>
                  <option value="true">Strict Corporate Domain Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Multi-Tenant Default Allocations */}
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Bell className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Default Quota & Threshold Alerting
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Default Initial Quota (Tokens/mo)</label>
                <input
                  type="number"
                  value={config.defaultNewCompanyQuotaTokens}
                  onChange={(e) => setConfig({ ...config, defaultNewCompanyQuotaTokens: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Default Monthly Budget ($ USD)</label>
                <input
                  type="number"
                  value={config.defaultNewCompanyBudgetUsd}
                  onChange={(e) => setConfig({ ...config, defaultNewCompanyBudgetUsd: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">SMTP Warning Trigger (%)</label>
                <input
                  type="number"
                  value={config.quotaWarningThresholdPct}
                  onChange={(e) => setConfig({ ...config, quotaWarningThresholdPct: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-white/10">
                  <span className="text-slate-300 font-medium text-[11px]">Auto-throttle on 100%</span>
                  <input
                    type="checkbox"
                    checked={config.autoThrottleOnOverQuota}
                    onChange={(e) => setConfig({ ...config, autoThrottleOnOverQuota: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Super Admin Portal Keys & Daily Free Prompt Limit */}
        <div className="bg-slate-900/70 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-xl space-y-5 lg:col-span-2 shadow-xl shadow-amber-500/5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Super Admin Portal Keys & Daily Prompt Limits Governance
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
              Free Trial Fallback Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-3 md:col-span-1">
              <label className="block text-slate-200 font-bold">
                Daily Free Prompts / User (No BYOK Keys)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.dailyFreePromptLimit ?? 3}
                  onChange={(e) => setConfig({ ...config, dailyFreePromptLimit: Math.max(0, Number(e.target.value)) })}
                  className="w-32 px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-bold text-base focus:outline-none focus:border-amber-400 font-mono"
                />
                <span className="text-slate-400 text-xs font-mono">prompts / day</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Applies strictly to logged-in users who have <strong className="text-slate-300">not</strong> provided their own provider API keys or direct subscription.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-xs">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Portal Key Fallback Execution Rules:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed list-disc list-inside">
                <li><strong className="text-white">Guest Visitors:</strong> Can only view all pages (API, Workspace, Bayesian, Real Example & ROI) in view-only mode; any button click prompts signup / authentication.</li>
                <li><strong className="text-white">Logged-in Users (No BYOK Keys):</strong> Utilizes Super Admin Portal Keys up to <strong>{config.dailyFreePromptLimit ?? 3} prompts/day</strong> (resets daily at 00:00 UTC).</li>
                <li><strong className="text-white">Logged-in Users (With BYOK Keys / Subscription):</strong> Unlimited prompts/day billed directly to their own keys or tenant subscription.</li>
                <li><strong className="text-white">Super Admin Isolation:</strong> Super Admin Portal Keys are protected and strictly fall back only for eligible trial accounts within their daily limits.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* CONFIRM RESET MODAL (SANDBOX SAFE) */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Global Configuration</h3>
                <p className="text-xs text-slate-400">Action requires confirmation</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-white/5 font-mono">
              Reset all portal global configuration parameters and governance thresholds to enterprise default specifications?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeResetDefaults}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
