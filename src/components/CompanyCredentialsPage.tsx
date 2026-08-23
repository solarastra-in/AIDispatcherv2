import React, { useState, useEffect } from 'react';
import { 
  Key, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Send, 
  Cpu, 
  Zap, 
  Building, 
  Lock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  ExternalLink, 
  Layers, 
  Settings, 
  Sliders, 
  Globe, 
  Activity, 
  Sparkles, 
  Database, 
  Save, 
  ArrowRight,
  Info,
  Server,
  CloudLightning,
  ChevronDown,
  ChevronUp,
  Terminal,
  Mail,
  SlidersHorizontal,
  Power,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Gauge
} from 'lucide-react';
import { AIProvider, CompanyProviderCredential, CompanyOnboardingProfile, UnifiedSubscriptionGatewayConfig } from '../types';
import { ClaudeCliTerminal } from './ClaudeCliTerminal';
import { SubscriptionOAuthModal } from './SubscriptionOAuthModal';
import { LowBalanceToast, LowBalanceAlert } from './LowBalanceToast';
import ProviderConnectPanel from './ProviderConnectPanel';
import { useAuth } from '../lib/useAuth';
import { authedFetch } from '../lib/firebaseClient';
import { AuthGateModal } from './AuthGateModal';

interface ProviderConfigMeta {
  id: AIProvider;
  name: string;
  category: 'Frontier Reasoning' | 'High-Speed LPU' | 'Open Weights' | 'Enterprise / Custom';
  logoColor: string;
  defaultBaseUrl?: string;
  supportedModels: { id: string; name: string; tier: string }[];
  keyPlaceholder: string;
  keyPrefix: string;
  docsUrl: string;
  pricingNote: string;
  subscriptionAvailable: boolean;
  subscriptionTiers: string[];
  cliSupported?: boolean;
}

const PROVIDER_METAS: ProviderConfigMeta[] = [
  {
    id: 'google',
    name: 'Google Gemini',
    category: 'Frontier Reasoning',
    logoColor: 'from-blue-500 to-cyan-400',
    supportedModels: [
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', tier: 'Low / Fast Hybrid' },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', tier: 'Low / Ultra-Fast' },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', tier: 'Frontier Reasoning' },
      { id: 'gemini-flash-latest', name: 'Gemini Flash (Latest)', tier: 'Standard Fast' },
    ],
    keyPlaceholder: 'AIzaSy...',
    keyPrefix: 'AIzaSy',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    pricingNote: '$0.10 / $0.40 per 1M tokens (Direct API) OR $20/mo Google One AI Premium',
    subscriptionAvailable: true,
    subscriptionTiers: ['Google One AI Premium / Gemini Advanced ($20/mo Flat)', 'Google Workspace AI Enterprise Add-on'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'Frontier Reasoning',
    logoColor: 'from-emerald-500 to-teal-400',
    supportedModels: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni)', tier: 'Frontier' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tier: 'Low Cost' },
      { id: 'o1', name: 'o1 Reasoning', tier: 'Deep Reasoning' },
      { id: 'o3-mini', name: 'o3-mini Fast Reasoning', tier: 'High Speed Reasoning' },
      { id: 'gpt-4.5-preview', name: 'GPT-4.5 Research', tier: 'Frontier Max' },
    ],
    keyPlaceholder: 'sk-proj-... or sk-...',
    keyPrefix: 'sk-',
    docsUrl: 'https://platform.openai.com/api-keys',
    pricingNote: '$2.50 / $10.00 per 1M tokens on 4o OR $20–$200/mo ChatGPT Plus/Pro Unlimited',
    subscriptionAvailable: true,
    subscriptionTiers: ['ChatGPT Pro Unlimited Reasoning ($200/mo Flat)', 'ChatGPT Plus Standard ($20/mo Flat)', 'ChatGPT Team / Enterprise SSO'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    category: 'Frontier Reasoning',
    logoColor: 'from-amber-500 to-orange-400',
    supportedModels: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid CoT)', tier: 'Frontier Hybrid' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', tier: 'Frontier Coding' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', tier: 'Low Latency' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', tier: 'Frontier Deep Synthesis' },
    ],
    keyPlaceholder: 'sk-ant-api03-...',
    keyPrefix: 'sk-ant-',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    pricingNote: '$3.00 / $15.00 per 1M tokens (API) OR $20/mo Claude Pro/Max CLI Unlimited',
    subscriptionAvailable: true,
    subscriptionTiers: ['Claude 3.7 Max / CLI Unlimited ($20/mo Flat)', 'Claude Pro Flat ($20/mo)', 'Claude Team Workspace License'],
    cliSupported: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    category: 'Frontier Reasoning',
    logoColor: 'from-blue-600 to-indigo-500',
    defaultBaseUrl: 'https://api.deepseek.com',
    supportedModels: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (671B MoE)', tier: 'Ultra-Low Cost' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (CoT Proofs)', tier: 'Deep Reasoning' },
    ],
    keyPlaceholder: 'sk-...',
    keyPrefix: 'sk-',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    pricingNote: '$0.14 / $0.28 per 1M tokens OR Web Session Bypass',
    subscriptionAvailable: true,
    subscriptionTiers: ['DeepSeek VIP Web Session ($0.14/1M or Web Flat)'],
  },
  {
    id: 'groq',
    name: 'Groq LPU (Ultra-Low Latency)',
    category: 'High-Speed LPU',
    logoColor: 'from-orange-500 to-red-500',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    supportedModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', tier: 'Sub-100ms' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', tier: 'Ultra-Fast' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k)', tier: 'MoE Fast' },
    ],
    keyPlaceholder: 'gsk_...',
    keyPrefix: 'gsk_',
    docsUrl: 'https://console.groq.com/keys',
    pricingNote: '$0.05 / $0.08 per 1M tokens (Direct Groq Cloud)',
    subscriptionAvailable: false,
    subscriptionTiers: [],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    category: 'Open Weights',
    logoColor: 'from-amber-600 to-yellow-500',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    supportedModels: [
      { id: 'mistral-large-latest', name: 'Mistral Large 2', tier: 'Frontier Sovereign' },
      { id: 'codestral-latest', name: 'Codestral (AST Code)', tier: 'Code Reasoning' },
      { id: 'pixtral-12b-2409', name: 'Pixtral 12B Vision', tier: 'Vision Low Cost' },
    ],
    keyPlaceholder: '...',
    keyPrefix: '',
    docsUrl: 'https://console.mistral.ai/api-keys',
    pricingNote: '$2.00 / $6.00 per 1M tokens on Large (Direct La Plateforme)',
    subscriptionAvailable: false,
    subscriptionTiers: [],
  },
];

interface CompanyCredentialsPageProps {
  onNavigateToDispatch?: (prompt?: string, modelId?: string) => void;
  onOpenAuthGate?: () => void;
}

export const CompanyCredentialsPage: React.FC<CompanyCredentialsPageProps> = ({
  onNavigateToDispatch,
  onOpenAuthGate,
}) => {
  // Auth state
  const { isAuthenticated, user, isGoogleAuth, isRegistered, signInWithGoogle } = useAuth();
  const [isLocalAuthModalOpen, setIsLocalAuthModalOpen] = useState<boolean>(false);

  // State
  const [profile, setProfile] = useState<CompanyOnboardingProfile | null>(null);
  const [credentials, setCredentials] = useState<Record<string, CompanyProviderCredential>>({});
  const [gatewayConfig, setGatewayConfig] = useState<UnifiedSubscriptionGatewayConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'matrix' | 'connect_flows' | 'unified_gateway' | 'claude_cli' | 'direct_sandbox' | 'settings'>('matrix');
  
  // Expanded provider cards state
  const [expandedProvider, setExpandedProvider] = useState<AIProvider | null>('anthropic');
  const [providerModeTab, setProviderModeTab] = useState<Record<string, 'subscription' | 'api_key'>>({
    google: 'subscription',
    openai: 'subscription',
    anthropic: 'subscription',
    deepseek: 'subscription',
    groq: 'api_key',
    mistral: 'api_key',
  });

  // Edit / Input States
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [baseUrlInputs, setBaseUrlInputs] = useState<Record<string, string>>({});
  const [orgInputs, setOrgInputs] = useState<Record<string, string>>({});
  const [spendLimitInputs, setSpendLimitInputs] = useState<Record<string, string>>({});
  const [thresholdInputs, setThresholdInputs] = useState<Record<string, string>>({});

  // Low Balance Warning & Quota Alert System State
  const [lowBalanceAlerts, setLowBalanceAlerts] = useState<LowBalanceAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});
  const [highlightedProvider, setHighlightedProvider] = useState<AIProvider | null>(null);

  // Verification & Sandbox State
  const [verifyingProvider, setVerifyingProvider] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, any>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sandbox Test
  const [testProvider, setTestProvider] = useState<AIProvider>('anthropic');
  const [testModelId, setTestModelId] = useState<string>('claude-3-7-sonnet-20250219');
  const [testAuthMode, setTestAuthMode] = useState<'auto' | 'subscription' | 'api_key'>('auto');
  const [testPrompt, setTestPrompt] = useState<string>('');
  const [isExecutingTest, setIsExecutingTest] = useState<boolean>(false);
  const [testResponse, setTestResponse] = useState<any>(null);

  // Modal State
  const [oauthModalProvider, setOauthModalProvider] = useState<AIProvider | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const requireAuthGuard = (actionName: string): boolean => {
    if (!isAuthenticated) {
      setNotification({
        type: 'error',
        message: `Authentication required: Please sign in with Google or complete registration before ${actionName}.`,
      });
      if (onOpenAuthGate) {
        onOpenAuthGate();
      } else {
        setIsLocalAuthModalOpen(true);
      }
      return false;
    }
    return true;
  };

  // Fetch initial profile & credentials
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [profileRes, credsRes, gatewayRes] = await Promise.all([
        authedFetch('/api/credentials/profile'),
        authedFetch('/api/credentials'),
        authedFetch('/api/credentials/subscription/gateway-status'),
      ]);

      const profileData = await profileRes.json();
      const credsData = await credsRes.json();
      const gatewayData = await gatewayRes.json();

      setProfile(profileData);
      setCredentials(credsData || {});
      setGatewayConfig(gatewayData);

      // Pre-fill inputs & Evaluate Low Balance Quota Alerts
      const initialBaseUrls: Record<string, string> = {};
      const initialOrgs: Record<string, string> = {};
      const initialSpendLimits: Record<string, string> = {};
      const initialThresholds: Record<string, string> = {};
      const detectedAlerts: LowBalanceAlert[] = [];

      if (credsData && typeof credsData === 'object') {
        Object.entries(credsData).forEach(([prov, c]: [string, any]) => {
          if (c?.baseUrl) initialBaseUrls[prov] = c.baseUrl;
          if (c?.organizationId) initialOrgs[prov] = c.organizationId;
          if (c?.monthlySpendLimitUsd) initialSpendLimits[prov] = String(c.monthlySpendLimitUsd);
          if (c?.lowBalanceThresholdPct) initialThresholds[prov] = String(c.lowBalanceThresholdPct);
          else initialThresholds[prov] = '20';

          const limit = Number(c?.monthlySpendLimitUsd) || 5000;
          const spend = Number(c?.currentSpendUsd) || 0;
          const remaining = Math.max(0, Math.round((limit - spend) * 100) / 100);
          const usagePct = limit > 0 ? (spend / limit) * 100 : 0;
          const threshold = Number(c?.lowBalanceThresholdPct) || 20;
          const isExhausted = remaining <= 0 || usagePct >= 100;
          const isLow = !isExhausted && ((100 - usagePct) <= threshold || remaining <= 25);

          // Evaluate low balance for configured API keys
          const hasActiveKey = Boolean(c?.hasKey || c?.apiKey || (prov === 'google' && c?.status === 'connected'));
          if (hasActiveKey && (isLow || isExhausted || c?.isLowBalance || c?.isQuotaExhausted)) {
            const meta = PROVIDER_METAS.find(m => m.id === prov);
            detectedAlerts.push({
              provider: prov as AIProvider,
              providerDisplayName: meta?.name || c.providerDisplayName || prov.toUpperCase(),
              monthlySpendLimitUsd: limit,
              currentSpendUsd: spend,
              remainingBalanceUsd: remaining,
              quotaUsagePct: Math.min(100, Math.round(usagePct * 10) / 10),
              lowBalanceThresholdPct: threshold,
              isCritical: isExhausted || usagePct >= 90 || remaining <= 10,
            });
          }
        });
      }

      setBaseUrlInputs(initialBaseUrls);
      setOrgInputs(initialOrgs);
      setSpendLimitInputs(initialSpendLimits);
      setThresholdInputs(initialThresholds);
      setLowBalanceAlerts(detectedAlerts);
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to load credentials vault: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Save API Key / Credentials
  const handleSaveCredential = async (provider: AIProvider) => {
    if (!requireAuthGuard('saving BYOK credentials to vault')) return;

    const meta = PROVIDER_METAS.find(m => m.id === provider);
    const rawKey = keyInputs[provider];
    const baseUrl = baseUrlInputs[provider];
    const orgId = orgInputs[provider];
    const monthlyLimit = spendLimitInputs[provider];
    const thresholdPct = thresholdInputs[provider];

    try {
      const res = await authedFetch('/api/credentials/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          providerDisplayName: meta?.name || provider.toUpperCase(),
          authMethod: providerModeTab[provider] === 'subscription' ? 'subscription_oauth' : 'api_key',
          apiKey: rawKey,
          baseUrl,
          organizationId: orgId,
          monthlySpendLimitUsd: monthlyLimit ? Number(monthlyLimit) : undefined,
          lowBalanceThresholdPct: thresholdPct ? Number(thresholdPct) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setKeyInputs(prev => ({ ...prev, [provider]: '' }));
        // Clear dismissed state for this provider so any low balance condition is re-evaluated
        setDismissedAlerts(prev => ({ ...prev, [provider]: false }));
        await loadData();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to save credential' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Error saving credential: ' + err.message });
    }
  };

  // Adjust Spend or Threshold (Live balance modification / testing)
  const handleAdjustSpendOrThreshold = async (
    provider: AIProvider,
    updates: { currentSpendUsd?: number; monthlySpendLimitUsd?: number; lowBalanceThresholdPct?: number }
  ) => {
    if (!requireAuthGuard('adjusting balance or quota settings')) return;

    try {
      const res = await authedFetch('/api/credentials/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          ...updates,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        // Clear dismissed state so low-balance toast pops up
        setDismissedAlerts(prev => ({ ...prev, [provider]: false }));
        await loadData();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to adjust balance' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Error: ' + err.message });
    }
  };

  // Simulate Low Balance Condition (Sets spend to 88% to test toast notification)
  const handleSimulateLowBalance = async (provider: AIProvider) => {
    const cred = credentials[provider];
    const limit = Number(cred?.monthlySpendLimitUsd) || Number(spendLimitInputs[provider]) || 100;
    const simulatedSpend = Math.round(limit * 0.88 * 100) / 100; // 88% spend (12% remaining)
    await handleAdjustSpendOrThreshold(provider, {
      monthlySpendLimitUsd: limit,
      currentSpendUsd: simulatedSpend,
      lowBalanceThresholdPct: 20,
    });
  };

  // Reset Spend to $0 (Restores healthy balance)
  const handleResetSpend = async (provider: AIProvider) => {
    await handleAdjustSpendOrThreshold(provider, { currentSpendUsd: 0 });
  };

  // Top Up Spend Ceiling (Adds extra quota)
  const handleTopUpCeiling = async (provider: AIProvider, addedAmount: number) => {
    const cred = credentials[provider];
    const currentLimit = Number(cred?.monthlySpendLimitUsd) || Number(spendLimitInputs[provider]) || 5000;
    const newLimit = currentLimit + addedAmount;
    setSpendLimitInputs(prev => ({ ...prev, [provider]: String(newLimit) }));
    await handleAdjustSpendOrThreshold(provider, { monthlySpendLimitUsd: newLimit });
  };

  // Dismiss Toast Warning
  const handleDismissToastAlert = (provider?: AIProvider) => {
    if (provider) {
      setDismissedAlerts(prev => ({ ...prev, [provider]: true }));
    } else {
      const allDismissed: Record<string, boolean> = {};
      lowBalanceAlerts.forEach(a => {
        allDismissed[a.provider] = true;
      });
      setDismissedAlerts(allDismissed);
    }
  };

  // Navigate to Adjust Limit from Toast
  const handleNavigateToAdjustLimit = (provider: AIProvider) => {
    setActiveTab('matrix');
    setExpandedProvider(provider);
    setProviderModeTab(prev => ({ ...prev, [provider]: 'api_key' }));
    setHighlightedProvider(provider);
    setTimeout(() => setHighlightedProvider(null), 3000);
  };

  // Navigate to Subscription from Toast
  const handleNavigateToSubscription = (provider: AIProvider) => {
    setActiveTab('matrix');
    setExpandedProvider(provider);
    setProviderModeTab(prev => ({ ...prev, [provider]: 'subscription' }));
    const meta = PROVIDER_METAS.find(m => m.id === provider);
    if (meta?.subscriptionAvailable) {
      setOauthModalProvider(provider);
    }
  };

  // Verify Live Connection (API or Subscription)
  const handleVerify = async (provider: AIProvider, verifyMethod: 'api' | 'subscription' = 'api') => {
    if (!requireAuthGuard('verifying provider connection')) return;

    setVerifyingProvider(provider);
    setVerifyResults(prev => ({ ...prev, [provider]: null }));

    try {
      const rawKey = keyInputs[provider];
      const baseUrl = baseUrlInputs[provider];
      const organizationId = orgInputs[provider];

      const res = await authedFetch('/api/credentials/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: rawKey,
          baseUrl,
          organizationId,
          verifyMethod,
        }),
      });

      const data = await res.json();
      setVerifyResults(prev => ({ ...prev, [provider]: data }));
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        await loadData();
      } else {
        setNotification({ type: 'error', message: data.error || 'Verification failed' });
      }
    } catch (err: any) {
      setVerifyResults(prev => ({ ...prev, [provider]: { success: false, error: err.message } }));
      setNotification({ type: 'error', message: 'Verification error: ' + err.message });
    } finally {
      setVerifyingProvider(null);
    }
  };

  // Toggle Proxy Daemon
  const handleToggleProxy = async (provider: AIProvider) => {
    if (!requireAuthGuard('toggling local proxy adapter')) return;

    try {
      const res = await authedFetch('/api/credentials/subscription/proxy/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        await loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to toggle proxy: ' + err.message });
    }
  };

  // Toggle Unified Gateway
  const handleToggleGateway = async () => {
    if (!requireAuthGuard('modifying unified subscription gateway')) return;

    try {
      const res = await authedFetch('/api/credentials/subscription/gateway-toggle', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        await loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to toggle gateway: ' + err.message });
    }
  };

  // Disconnect Subscription
  const handleDisconnectSubscription = async (provider: AIProvider) => {
    if (!requireAuthGuard('unlinking subscription session')) return;
    if (!confirm(`Unlink subscription session for ${provider.toUpperCase()}?`)) return;

    try {
      const res = await authedFetch('/api/credentials/subscription/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        await loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to unlink subscription: ' + err.message });
    }
  };

  // Delete Credential
  const handleDelete = async (provider: AIProvider) => {
    if (!requireAuthGuard('deleting BYOK credentials')) return;
    if (!confirm(`Remove credentials for ${provider.toUpperCase()} from your company vault?`)) return;

    try {
      const res = await authedFetch('/api/credentials/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setKeyInputs(prev => ({ ...prev, [provider]: '' }));
        await loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to remove credential: ' + err.message });
    }
  };

  // Execute Direct Test Prompt in Sandbox
  const handleExecuteSandboxTest = async () => {
    if (!requireAuthGuard('running direct sandbox execution test')) return;

    setIsExecutingTest(true);
    setTestResponse(null);

    try {
      const res = await authedFetch('/api/credentials/direct-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: testProvider,
          modelId: testModelId,
          prompt: testPrompt,
          authMode: testAuthMode,
        }),
      });

      const data = await res.json();
      setTestResponse(data);
      if (data.success) {
        setNotification({ 
          type: 'success', 
          message: `Live test executed in ${data.latencyMs}ms (${data.billingMode === 'subscription_flat_rate' ? 'Flat Subscription $0.00/token' : 'Direct API Key'})` 
        });
      } else {
        setNotification({ type: 'error', message: data.error || 'Execution failed' });
      }
    } catch (err: any) {
      setTestResponse({ success: false, error: err.message });
      setNotification({ type: 'error', message: 'Direct test network error: ' + err.message });
    } finally {
      setIsExecutingTest(false);
    }
  };

  const totalConnected = (Object.values(credentials) as CompanyProviderCredential[]).filter(
    c => c?.status === 'connected' || Boolean(c?.hasKey) || Boolean(c?.hasSubscription)
  ).length;

  const totalSubscriptions = (Object.values(credentials) as CompanyProviderCredential[]).filter(
    c => c?.hasSubscription && c?.status === 'connected'
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between shadow-lg text-xs font-medium border ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-700 text-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-200 ml-4 font-bold">✕</button>
        </div>
      )}

      {/* Gated Authentication Banner */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/70 border-2 border-amber-500/50 rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Authentication Required
                  </span>
                  <span className="text-xs text-amber-200/80 font-mono">BYOK & Subscription Access Guard</span>
                </div>
                <h3 className="text-lg font-bold text-amber-100">
                  Sign in with Google or Complete Registration to Configure BYOK
                </h3>
                <p className="text-xs text-amber-200/90 max-w-2xl leading-relaxed">
                  Bring Your Own Key (BYOK) credential storage, local reverse proxy tunneling, and flat-rate consumer subscription sessions require an authenticated corporate identity to protect API token security, enforce spend limits, and isolate encryption keys.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                    setNotification({ type: 'success', message: 'Signed in successfully via Google!' });
                    loadData();
                  } catch (err: any) {
                    if (err?.message && !err.message.includes('popup-closed-by-user')) {
                      setNotification({ type: 'error', message: err.message });
                    }
                  }
                }}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign In with Google</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenAuthGate) onOpenAuthGate();
                  else setIsLocalAuthModalOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Register Free Trial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header & Dual Auth Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enterprise Credentials & Flat-Rate Subscriptions Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Company Onboarding & Subscription Gateway
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              WhyOr lets you make requests using <strong>flat-rate consumer/team subscriptions</strong> (ChatGPT Pro $200/mo, Claude 3.7 Max CLI $20/mo, Google One AI Premium $20/mo) via Google OAuth & local proxies, alongside standard pay-per-token API keys.
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shrink-0">
            <div className="px-4 py-2 text-center border-r border-slate-800">
              <div className="text-xs text-slate-400">Connected Hubs</div>
              <div className="text-xl font-bold text-slate-100 font-mono">{totalConnected} <span className="text-xs text-slate-500">/ 6</span></div>
            </div>
            <div className="px-4 py-2 text-center border-r border-slate-800">
              <div className="text-xs text-slate-400">Flat Subscriptions</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">{totalSubscriptions} <span className="text-xs text-emerald-600">Active</span></div>
            </div>
            <div className="px-4 py-2 text-center border-r border-slate-800">
              <div className="text-xs text-slate-400">Monthly Avoided</div>
              <div className="text-xl font-bold text-amber-400 font-mono">$5,680+</div>
            </div>
            <div className="px-4 py-2 text-center">
              <div className="text-xs text-slate-400">API Key Quota</div>
              <div className="text-sm font-bold font-mono mt-1">
                {lowBalanceAlerts.length > 0 ? (
                  <span className="text-amber-400 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{lowBalanceAlerts.length} Low Balance</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All Quotas OK</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Navigation Sub-Tabs */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-6">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Provider Matrix ({PROVIDER_METAS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('connect_flows')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'connect_flows'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Local Proxy & Subscription Connect</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-orange-950 text-orange-400 border border-orange-800">
              Interactive
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unified_gateway')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'unified_gateway'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Unified Subscription Gateway</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('claude_cli')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'claude_cli'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Claude CLI & Terminal Session</span>
          </button>

          <button
            onClick={() => setActiveTab('direct_sandbox')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'direct_sandbox'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Live Direct Sandbox</span>
          </button>
        </div>
      </div>

      {/* TAB 0: Interactive Provider & Local Proxy Connect Flows */}
      {activeTab === 'connect_flows' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Interactive Provider & Local Proxy Connection Hub
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure direct provider API keys and local reverse proxy adapters (OpenAI, Anthropic, Google, DeepSeek, Mistral, xAI, Groq).
              </p>
            </div>
            <ProviderConnectPanel />
          </div>
        </div>
      )}

      {/* TAB 1: Unified Subscription Gateway Portal */}
      {activeTab === 'unified_gateway' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    Unified Subscription Gateway Daemon
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Port {gatewayConfig?.gatewayPort || 8080}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Centralized local reverse proxy consolidating multiple frontier subscriptions under a single OpenAI-compatible API URL.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleToggleGateway}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center space-x-2 transition-all shadow-md ${
                    gatewayConfig?.status === 'active'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{gatewayConfig?.status === 'active' ? 'Gateway Running' : 'Start Gateway'}</span>
                </button>
              </div>
            </div>

            {/* Gateway Endpoint URL & Integration Snippet */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Consolidated Endpoint URL</span>
                    <span className="text-[11px] text-slate-500 font-mono">OpenAI / Anthropic Compatible</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={gatewayConfig?.gatewayBindUrl || 'http://localhost:8080/v1/whyor-gateway'}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-emerald-400 font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(gatewayConfig?.gatewayBindUrl || 'http://localhost:8080/v1/whyor-gateway');
                        setCopiedKey('gateway_url');
                        setTimeout(() => setCopiedKey(null), 2000);
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-200 flex items-center space-x-1.5 transition-colors border border-slate-700"
                    >
                      {copiedKey === 'gateway_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Point any standard AI SDK (LangChain, LlamaIndex, Cursor, Claude Code) to this local URL. WhyOr routes incoming requests across your active subscriptions with <strong>$0.00/token</strong> billing.
                  </p>
                </div>

                {/* Active Bound Subscriptions */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-300">Active Bound Subscriptions in Gateway</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {gatewayConfig?.activeSubscriptions.map((sub, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{sub.name}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800">
                            Bound
                          </span>
                        </div>
                        <div className="text-[11px] text-indigo-400 font-mono">{sub.tier}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {sub.accountEmail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gateway Telemetry & ROI */}
              <div className="p-5 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 rounded-xl border border-indigo-800/40 space-y-4">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Subscription ROI Telemetry
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Total Gateway Requests:</span>
                    <span className="text-slate-200 font-mono font-bold">{gatewayConfig?.totalRoutedRequests.toLocaleString() || '1,420'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Tokens Processed:</span>
                    <span className="text-slate-200 font-mono font-bold">{((gatewayConfig?.totalTokensProcessed || 28400000) / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Flat Monthly Subscriptions:</span>
                    <span className="text-slate-200 font-mono font-bold">${gatewayConfig?.flatMonthlySpendUsd || 240}/mo</span>
                  </div>
                  <div className="flex justify-between py-1 text-emerald-400 font-semibold">
                    <span>API Invoices Avoided:</span>
                    <span className="font-mono text-sm font-bold">${gatewayConfig?.estimatedApiCostAvoidedUsd.toLocaleString() || '5,680.40'}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-[11px] text-emerald-300 leading-relaxed">
                  ✓ <strong>95.8% Cost Reduction</strong> achieved by substituting per-token API meter rates with unified subscription proxies.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Claude CLI & Interactive Terminal */}
      {activeTab === 'claude_cli' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  Claude CLI & Terminal Session Daemon
                </h2>
                <p className="text-xs text-slate-400">
                  Execute native subshell commands and interactive prompts directly under your active Claude Pro/Max subscription without per-token charges.
                </p>
              </div>
            </div>

            <ClaudeCliTerminal
              subscriptionEmail={profile?.primaryContactEmail || 'solarastra.in@gmail.com'}
              subscriptionTier="Claude 3.7 Max / CLI Unlimited ($20/mo Flat)"
              isProxyActive={true}
            />
          </div>
        </div>
      )}

      {/* TAB 3: Provider Matrix (Dual Mode: Subscription OAuth / API Key BYOK) */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Configured AI Providers & Subscriptions</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle between <strong>Flat-Rate Subscription / OAuth</strong> ($0.00/token) and <strong>Pay-Per-Token API Keys</strong> with real-time balance tracking & low-quota alerts.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadData}
                disabled={isLoading}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Vault & Quotas</span>
              </button>
            </div>
          </div>

          {/* Active Quota Exhaustion & Low Balance Warning Center */}
          {lowBalanceAlerts.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-rose-950/70 border border-amber-500/50 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                      <span>Low API Key Quota Warnings Active ({lowBalanceAlerts.length} provider{lowBalanceAlerts.length > 1 ? 's' : ''})</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      The following configured API keys are nearing exhaustion. Adjust your monthly spend limit or link a $0/token flat subscription to prevent dispatch interruptions.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      // Trigger all toast notifications
                      setDismissedAlerts({});
                      setNotification({ type: 'success', message: 'Re-triggered live Low Balance toast alert notifications.' });
                    }}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Show Active Toast Alerts</span>
                  </button>
                </div>
              </div>

              {/* Alert Quick Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {lowBalanceAlerts.map(alert => (
                  <div 
                    key={alert.provider}
                    className="bg-slate-950/90 rounded-xl p-3.5 border border-amber-500/30 space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">{alert.providerDisplayName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        alert.isCritical ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {alert.quotaUsagePct.toFixed(0)}% Used
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${alert.isCritical ? 'bg-rose-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(100, alert.quotaUsagePct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>Spend: ${alert.currentSpendUsd.toFixed(2)} / ${alert.monthlySpendLimitUsd.toFixed(2)}</span>
                        <span className={alert.isCritical ? 'text-rose-300 font-bold' : 'text-amber-300 font-bold'}>
                          ${alert.remainingBalanceUsd.toFixed(2)} left
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleNavigateToAdjustLimit(alert.provider)}
                        className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-lg text-center transition-colors"
                      >
                        Adjust Limit
                      </button>
                      <button
                        onClick={() => handleNavigateToSubscription(alert.provider)}
                        className="flex-1 py-1 px-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-medium rounded-lg text-center transition-colors"
                      >
                        Link $0 Plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5">
            {PROVIDER_METAS.map((meta) => {
              const cred = credentials[meta.id];
              const isConfigured = cred?.status === 'connected' || Boolean(cred?.hasKey) || Boolean(cred?.hasSubscription);
              const isExpanded = expandedProvider === meta.id;
              const currentMode = providerModeTab[meta.id] || (cred?.hasSubscription ? 'subscription' : 'api_key');
              const isHighlighted = highlightedProvider === meta.id;
              
              // Provider-specific balance calculations
              const monthlyLimit = Number(spendLimitInputs[meta.id]) || Number(cred?.monthlySpendLimitUsd) || 5000;
              const currentSpend = Number(cred?.currentSpendUsd) || 0;
              const remainingBalance = Math.max(0, Math.round((monthlyLimit - currentSpend) * 100) / 100);
              const quotaUsagePct = monthlyLimit > 0 ? Math.min(100, Math.round((currentSpend / monthlyLimit) * 1000) / 10) : 0;
              const thresholdPct = Number(thresholdInputs[meta.id]) || Number(cred?.lowBalanceThresholdPct) || 20;
              const isExhausted = remainingBalance <= 0 || quotaUsagePct >= 100;
              const isLow = !isExhausted && ((100 - quotaUsagePct) <= thresholdPct || remainingBalance <= 25);
              const hasLowBalance = (cred?.hasKey || cred?.status === 'connected') && (isLow || isExhausted || cred?.isLowBalance || cred?.isQuotaExhausted);

              return (
                <div
                  key={meta.id}
                  className={`bg-slate-900 border rounded-2xl transition-all overflow-hidden ${
                    isHighlighted 
                      ? 'ring-2 ring-amber-400 border-amber-400 shadow-2xl scale-[1.005]'
                      : isExpanded 
                        ? hasLowBalance ? 'border-amber-500/80 shadow-2xl ring-1 ring-amber-500/30' : 'border-indigo-600/80 shadow-2xl ring-1 ring-indigo-600/30' 
                        : hasLowBalance ? 'border-amber-500/40 hover:border-amber-500/70 shadow-md' : 'border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  {/* Card Header */}
                  <div 
                    onClick={() => setExpandedProvider(isExpanded ? null : meta.id)}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none bg-gradient-to-r from-slate-900 to-slate-900/60 hover:to-slate-850"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.logoColor} p-0.5 flex items-center justify-center shadow-lg shrink-0`}>
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white font-bold">
                          <Cpu className="w-6 h-6 text-slate-200" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-bold text-slate-100">{meta.name}</h3>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                            {meta.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{meta.pricingNote}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                      {/* Low Balance Warning Badge */}
                      {hasLowBalance && (
                        <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border animate-pulse ${
                          isExhausted 
                            ? 'bg-rose-950/90 text-rose-300 border-rose-800' 
                            : 'bg-amber-950/90 text-amber-300 border-amber-800'
                        }`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{isExhausted ? 'Quota Exhausted' : `Low Balance ($${remainingBalance.toFixed(2)} left)`}</span>
                        </div>
                      )}

                      {cred?.hasSubscription && !cred?.hasKey && (
                        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/90 text-emerald-300 border border-emerald-800/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Subscription Active ({cred?.subscriptionTier ? cred.subscriptionTier.split('(')[0].trim() : 'Flat Plan'})</span>
                        </div>
                      )}

                      {cred?.hasKey && !cred?.hasSubscription && !hasLowBalance && (
                        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-950/90 text-indigo-300 border border-indigo-800/80">
                          <Key className="w-3 h-3 text-indigo-400" />
                          <span>Direct API Key Configured</span>
                        </div>
                      )}

                      {cred?.hasSubscription && cred?.hasKey && !hasLowBalance && (
                        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/90 text-amber-300 border border-amber-800/80">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Dual Configured: Subscription & API Key</span>
                        </div>
                      )}

                      {!isConfigured && (
                        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <span>Unconfigured</span>
                        </div>
                      )}

                      <div className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-6 border-t border-slate-800 bg-slate-950/60 space-y-6">
                      {/* Provider Sub-Tabs: Subscription vs API Key */}
                      <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
                        {meta.subscriptionAvailable && (
                          <button
                            onClick={() => setProviderModeTab(prev => ({ ...prev, [meta.id]: 'subscription' }))}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                              currentMode === 'subscription'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Subscription & OAuth / Google Login (Flat Rate)</span>
                          </button>
                        )}

                        <button
                          onClick={() => setProviderModeTab(prev => ({ ...prev, [meta.id]: 'api_key' }))}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                            currentMode === 'api_key' || !meta.subscriptionAvailable
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Pay-Per-Token API Key (BYOK)</span>
                        </button>
                      </div>

                      {/* MODE 1: Flat-Rate Subscription & OAuth */}
                      {currentMode === 'subscription' && meta.subscriptionAvailable && (
                        <div className="space-y-5">
                          {cred?.hasSubscription ? (
                            <div className="p-4 bg-slate-900/90 rounded-xl border border-emerald-800/60 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Active Subscription Tier:</span>
                                    <span className="text-emerald-400 font-mono">
                                      {cred?.subscriptionTier || meta.subscriptionTiers[0]}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                                    <span>Account: <strong className="text-slate-300">{cred?.subscriptionEmail || profile?.primaryContactEmail || 'Connected'}</strong></span>
                                    <span>•</span>
                                    <span className="text-emerald-400">Flat Rate $0.00/token</span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setOauthModalProvider(meta.id)}
                                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                                  >
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>Re-authenticate</span>
                                  </button>

                                  <button
                                    onClick={() => handleDisconnectSubscription(meta.id)}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 rounded-lg text-xs transition-colors border border-slate-700"
                                  >
                                    Unlink
                                  </button>
                                </div>
                              </div>

                              {/* Local Proxy Info */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between">
                                  <div>
                                    <span className="text-slate-400">Local Proxy Bridge:</span>
                                    <div className="font-mono text-emerald-400 mt-0.5">{cred?.localProxyUrl || `http://localhost:808${meta.id === 'google' ? '1' : meta.id === 'openai' ? '2' : '3'}/v1`}</div>
                                  </div>
                                  <button
                                    onClick={() => handleToggleProxy(meta.id)}
                                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
                                  >
                                    {cred?.proxyStatus === 'running' ? 'Active' : 'Start'}
                                  </button>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between">
                                  <div>
                                    <span className="text-slate-400">Connection Status:</span>
                                    <div className="text-slate-200 mt-0.5 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                      <span>Verified ({cred?.latencyMs || 180}ms)</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleVerify(meta.id, 'subscription')}
                                    disabled={verifyingProvider === meta.id}
                                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                                  >
                                    {verifyingProvider === meta.id ? 'Pinging...' : 'Ping Test'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                  <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                                    <span>No Subscription Linked for {meta.name}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
                                    Link your consumer or team subscription (<span className="text-indigo-300">{meta.subscriptionTiers.join(' / ')}</span>) to route inference via local session proxy at <strong>$0.00 per-token rate</strong>.
                                  </p>
                                </div>

                                <button
                                  onClick={() => setOauthModalProvider(meta.id)}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md shrink-0"
                                >
                                  <Globe className="w-4 h-4" />
                                  <span>Link {meta.name} Subscription</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* MODE 2: Standard Pay-Per-Token API Key & Quota Management */}
                      {(currentMode === 'api_key' || !meta.subscriptionAvailable) && (
                        <div className="space-y-5">
                          {/* Live Quota Usage & Low Balance Monitor Bar */}
                          <div className={`p-4 rounded-xl border space-y-3 transition-all ${
                            isExhausted 
                              ? 'bg-rose-950/40 border-rose-500/50' 
                              : isLow 
                                ? 'bg-amber-950/40 border-amber-500/50' 
                                : 'bg-slate-900/90 border-slate-800'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="flex items-center space-x-2">
                                <Gauge className={`w-4 h-4 ${isExhausted ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-indigo-400'}`} />
                                <span className="font-bold text-slate-200">API Key Quota & Balance Monitor</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isExhausted 
                                    ? 'bg-rose-900 text-rose-200 border border-rose-700 animate-pulse' 
                                    : isLow 
                                      ? 'bg-amber-900 text-amber-200 border border-amber-700 animate-pulse' 
                                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}>
                                  {isExhausted ? 'Quota Exhausted' : isLow ? 'Low Balance Warning' : 'Quota Healthy'}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 text-[11px] font-mono">
                                <span className="text-slate-400">Current Spend:</span>
                                <span className="text-slate-100 font-bold">${currentSpend.toFixed(2)}</span>
                                <span className="text-slate-600">/</span>
                                <span className="text-slate-400">Limit:</span>
                                <span className="text-slate-100 font-bold">${monthlyLimit.toFixed(2)}</span>
                                <span className={`font-bold ${isExhausted ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  ({quotaUsagePct.toFixed(1)}%)
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isExhausted 
                                    ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                                    : isLow 
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                                      : 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(3, quotaUsagePct))}%` }}
                              />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                              <div className="flex items-center space-x-2">
                                <TrendingDown className="w-3.5 h-3.5 text-slate-500" />
                                <span>Remaining Usable Balance:</span>
                                <span className={`font-bold font-mono ${isExhausted ? 'text-rose-300' : isLow ? 'text-amber-300' : 'text-emerald-300'}`}>
                                  ${remainingBalance.toFixed(2)} USD
                                </span>
                              </div>

                              {/* Interactive Simulation & Test Controls */}
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleSimulateLowBalance(meta.id)}
                                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-mono flex items-center gap-1 transition-colors"
                                  title="Sets spend to 88% to test toast notification"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Simulate 88% Spend (Test Toast)</span>
                                </button>

                                {currentSpend > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetSpend(meta.id)}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition-colors"
                                    title="Reset spend to $0.00"
                                  >
                                    Reset Spend
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Key & Base URL Inputs */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                                <span>API Key</span>
                                <a href={meta.docsUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 text-[11px] flex items-center gap-1">
                                  <span>Get Key</span> <ExternalLink className="w-3 h-3" />
                                </a>
                              </label>
                              <div className="relative">
                                <input
                                  type={showKeys[meta.id] ? 'text' : 'password'}
                                  value={keyInputs[meta.id] !== undefined ? keyInputs[meta.id] : (cred?.maskedKey || '')}
                                  onChange={(e) => setKeyInputs(prev => ({ ...prev, [meta.id]: e.target.value }))}
                                  placeholder={cred?.maskedKey || meta.keyPlaceholder}
                                  className="w-full pl-3 pr-20 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowKeys(prev => ({ ...prev, [meta.id]: !prev[meta.id] }))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
                                >
                                  {showKeys[meta.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300">Custom Base URL (Optional)</label>
                              <input
                                type="text"
                                value={baseUrlInputs[meta.id] || ''}
                                onChange={(e) => setBaseUrlInputs(prev => ({ ...prev, [meta.id]: e.target.value }))}
                                placeholder={meta.defaultBaseUrl || 'https://api...'}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          {/* Spend Limit & Alert Threshold Row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Monthly Spend Limit ($ USD)</span>
                                </label>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleTopUpCeiling(meta.id, 100)}
                                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[10px]"
                                  >
                                    +$100
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTopUpCeiling(meta.id, 500)}
                                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[10px]"
                                  >
                                    +$500
                                  </button>
                                </div>
                              </div>
                              <input
                                type="number"
                                min="10"
                                step="50"
                                value={spendLimitInputs[meta.id] || ''}
                                onChange={(e) => setSpendLimitInputs(prev => ({ ...prev, [meta.id]: e.target.value }))}
                                placeholder="5000"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                              />
                              <p className="text-[10px] text-slate-500">Auto-caps dispatch calls to prevent unexpected cloud bills.</p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Low Balance Toast Alert Threshold (%)</span>
                                </span>
                                <span className="text-[11px] font-mono text-amber-400 font-bold">{thresholdInputs[meta.id] || '20'}%</span>
                              </label>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="range"
                                  min="5"
                                  max="50"
                                  step="5"
                                  value={thresholdInputs[meta.id] || '20'}
                                  onChange={(e) => setThresholdInputs(prev => ({ ...prev, [meta.id]: e.target.value }))}
                                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                                <span className="text-xs font-mono text-slate-300 w-8">{thresholdInputs[meta.id] || '20'}%</span>
                              </div>
                              <p className="text-[10px] text-slate-500">Triggers toast warning when remaining quota is ≤ this percentage.</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end space-x-2 pt-1">
                            <button
                              onClick={() => handleVerify(meta.id, 'api')}
                              disabled={verifyingProvider === meta.id}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>{verifyingProvider === meta.id ? 'Testing...' : 'Test Connection'}</span>
                            </button>

                            <button
                              onClick={() => handleSaveCredential(meta.id)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save to Vault</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Live Direct Sandbox Test */}
      {activeTab === 'direct_sandbox' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Live Direct Execution Sandbox</h2>
              <p className="text-xs text-slate-400">
                Execute prompts directly against your configured subscription session or API key to verify zero-markup routing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Provider</label>
                <select
                  value={testProvider}
                  onChange={(e) => {
                    const p = e.target.value as AIProvider;
                    setTestProvider(p);
                    const meta = PROVIDER_METAS.find(m => m.id === p);
                    if (meta && meta.supportedModels.length > 0) {
                      setTestModelId(meta.supportedModels[0].id);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {PROVIDER_METAS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Auth Execution Mode</label>
                <select
                  value={testAuthMode}
                  onChange={(e) => setTestAuthMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="auto">Auto (Prefer Flat Subscription if Active)</option>
                  <option value="subscription">Flat-Rate Subscription Proxy ($0.00/token)</option>
                  <option value="api_key">Direct API Key Meter</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Model</label>
                <select
                  value={testModelId}
                  onChange={(e) => setTestModelId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {PROVIDER_METAS.find(m => m.id === testProvider)?.supportedModels.map(sm => (
                    <option key={sm.id} value={sm.id}>{sm.name} ({sm.tier})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExecuteSandboxTest}
                disabled={isExecutingTest || !testPrompt.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50"
              >
                {isExecutingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Execute Direct Sandbox Query</span>
              </button>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Sandbox Test Payload</label>
                  <span className="text-[11px] font-mono text-slate-500">{testPrompt.length} chars</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                  <span className="font-semibold text-indigo-400 font-mono">What goes in this box:</span> Enter any sample question, code refactor instruction, or test query to benchmark live response latency, token consumption, and model outputs directly through this provider's verified credentials.
                </div>

                <textarea
                  rows={4}
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Enter test prompt or payload... (e.g. Synthesize a 3-tier microservice architecture for token optimization and verify live execution latency)"
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {testResponse && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-xs">
                    <span className="font-semibold text-slate-200">Execution Output</span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-emerald-400">{testResponse.latencyMs}ms</span>
                      <span>•</span>
                      <span className="text-indigo-400">{testResponse.billingMode === 'subscription_flat_rate' ? 'Flat Subscription ($0.00)' : 'API Key Meter'}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                    {testResponse.text || testResponse.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OAuth / Google Login Modal */}
      {oauthModalProvider && (
        <SubscriptionOAuthModal
          isOpen={Boolean(oauthModalProvider)}
          onClose={() => setOauthModalProvider(null)}
          provider={oauthModalProvider}
          providerDisplayName={PROVIDER_METAS.find(m => m.id === oauthModalProvider)?.name || oauthModalProvider}
          defaultEmail={profile?.primaryContactEmail || 'solarastra.in@gmail.com'}
          onSuccess={() => {
            setNotification({ type: 'success', message: `Subscription for ${oauthModalProvider.toUpperCase()} connected successfully.` });
            loadData();
          }}
        />
      )}

      {/* Floating Low Balance Toast Notification System */}
      {lowBalanceAlerts.length > 0 && lowBalanceAlerts.some(a => !dismissedAlerts[a.provider]) && (
        <LowBalanceToast
          alerts={lowBalanceAlerts.filter(a => !dismissedAlerts[a.provider])}
          onDismiss={handleDismissToastAlert}
          onAdjustLimit={handleNavigateToAdjustLimit}
          onSwitchToSubscription={handleNavigateToSubscription}
        />
      )}

      {/* Local Auth Gate Modal for BYOK Lockout */}
      <AuthGateModal
        isOpen={isLocalAuthModalOpen}
        onClose={() => setIsLocalAuthModalOpen(false)}
        title="Sign In to Configure BYOK Credentials"
        reason="To safeguard corporate API keys, enforce token spend limits, and isolate tenant encryption keys, you must be fully signed in using Google Auth or have completed account registration before configuring Bring Your Own Key (BYOK) credentials."
        onSuccess={() => {
          setIsLocalAuthModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
