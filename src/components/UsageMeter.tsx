import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  KeyRound, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown, 
  Clock, 
  RefreshCw,
  Sliders,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { auth, onAuthChanged } from '../lib/firebase';
import { authedFetch } from '../lib/firebaseClient';

export interface DailyLimitData {
  isAuthenticated: boolean;
  isGuest: boolean;
  email?: string;
  isSuperAdmin?: boolean;
  dailyPromptsUsed: number;
  dailyPromptLimit: number;
  dailyPromptsRemaining: number;
  hasConfiguredKeys: boolean;
  isUnlimited: boolean;
  resetsAt: string;
  notice?: string;
}

interface UsageMeterProps {
  onNavigateToKeys?: () => void;
  className?: string;
  isMobileDrawer?: boolean;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
  onNavigateToKeys,
  className = '',
  isMobileDrawer = false,
}) => {
  const [quotaData, setQuotaData] = useState<DailyLimitData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchQuotaStatus = async () => {
    try {
      setLoading(true);
      const res = await authedFetch('/api/user/daily-limit-status');
      if (res.ok) {
        const data = await res.json();
        setQuotaData(data);
      }
    } catch (err) {
      console.warn('Notice: Unable to refresh daily limit status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotaStatus();

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthChanged(() => {
      fetchQuotaStatus();
    });

    // Custom event listener for real-time quota updates after dispatches
    const handleQuotaUpdated = () => {
      fetchQuotaStatus();
    };
    window.addEventListener('daily-quota-updated', handleQuotaUpdated);
    window.addEventListener('focus', handleQuotaUpdated);

    return () => {
      unsubscribe();
      window.removeEventListener('daily-quota-updated', handleQuotaUpdated);
      window.removeEventListener('focus', handleQuotaUpdated);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!quotaData) {
    return null;
  }

  const isUnlimited = quotaData.isUnlimited || quotaData.hasConfiguredKeys || quotaData.isSuperAdmin;
  const used = quotaData.dailyPromptsUsed || 0;
  const limit = quotaData.dailyPromptLimit || 3;
  const remaining = isUnlimited ? 9999 : Math.max(0, limit - used);
  const isExhausted = !isUnlimited && remaining <= 0;
  const percentageUsed = isUnlimited ? 100 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));

  const handleConfigureKeysClick = () => {
    setIsOpen(false);
    if (onNavigateToKeys) {
      onNavigateToKeys();
    }
  };

  // Render Mobile Drawer Layout
  if (isMobileDrawer) {
    return (
      <div className={`rounded-2xl p-3 border transition-all ${
        isExhausted 
          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' 
          : isUnlimited 
          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' 
          : 'bg-slate-900/80 border-white/10 text-slate-200'
      } ${className}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 font-medium text-xs">
            <Zap className={`w-4 h-4 ${
              isExhausted ? 'text-rose-400' : isUnlimited ? 'text-emerald-400' : 'text-amber-400'
            }`} />
            <span className="font-semibold text-white">Daily Prompt Quota</span>
          </div>
          {isUnlimited ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> BYOK Unlimited
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              isExhausted
                ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                : remaining === 1
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
            }`}>
              {remaining} / {limit} left
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {!isUnlimited && (
          <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden mb-2 border border-white/5">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                isExhausted ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-amber-400 to-orange-500'
              }`}
              style={{ width: `${percentageUsed}%` }}
            />
          </div>
        )}

        {/* Status Text / Actions */}
        <div className="text-[11px] text-slate-300 mb-2 leading-relaxed">
          {isUnlimited ? (
            <span className="text-emerald-300/90">
              Personal BYOK provider keys connected. You have zero rate limits.
            </span>
          ) : isExhausted ? (
            <span className="text-rose-300 font-medium">
              Daily free limit of {limit} prompts reached for today.
            </span>
          ) : (
            <span className="text-slate-300">
              {used} of {limit} free trial prompts used today (Resets 00:00 UTC).
            </span>
          )}
        </div>

        <button
          id="mobile-configure-byok-keys-btn"
          onClick={handleConfigureKeysClick}
          className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
            isExhausted
              ? 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold'
              : isUnlimited
              ? 'bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{isExhausted ? 'Configure Personal API Keys (BYOK)' : isUnlimited ? 'Manage API Keys' : 'Configure Personal Keys for Unlimited'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // Render Desktop Navbar Pill & Popover
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        id="navbar-usage-meter-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono backdrop-blur-md transition-all cursor-pointer border ${
          isExhausted
            ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25 shadow-md shadow-rose-500/10 animate-pulse'
            : isUnlimited
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
            : remaining === 1
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
            : 'bg-white/[0.06] text-slate-200 border-white/15 hover:bg-white/[0.1]'
        }`}
        title="View daily prompt quota usage and BYOK API key status"
      >
        <Zap className={`w-3.5 h-3.5 ${
          isExhausted ? 'text-rose-400' : isUnlimited ? 'text-emerald-400' : 'text-amber-400'
        }`} />

        {isUnlimited ? (
          <span className="flex items-center gap-1 font-semibold text-emerald-300">
            <span>BYOK</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-400/20">∞</span>
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">
              {remaining}/{limit}
            </span>
            <span className="hidden xl:inline text-[10px] text-slate-400 font-sans">left</span>
            
            {/* Visual mini bar indicator */}
            <div className="w-8 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-white/10 hidden sm:block">
              <div 
                className={`h-full rounded-full ${
                  isExhausted ? 'bg-rose-500' : remaining === 1 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${percentageUsed}%` }}
              />
            </div>
          </div>
        )}

        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>

      {/* Popover Dropdown Details */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900/98 backdrop-blur-2xl border border-white/15 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Daily Quota & BYOK Status</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchQuotaStatus();
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Refresh quota status"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Usage Breakdown */}
          {isUnlimited ? (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 mb-3">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Unlimited Direct Access</span>
              </div>
              <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                Your personal BYOK keys or enterprise privileges are active. Prompts dispatch directly with zero rate limits or markups.
              </p>
            </div>
          ) : (
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Prompts Used Today:</span>
                <span className="font-mono font-bold text-white">{used} / {limit}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Remaining Today:</span>
                <span className={`font-mono font-bold ${
                  isExhausted ? 'text-rose-400' : remaining === 1 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {remaining} prompts
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/10">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${
                    isExhausted ? 'bg-rose-500' : remaining === 1 ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                  }`}
                  style={{ width: `${percentageUsed}%` }}
                />
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 pt-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Resets at 00:00 UTC daily</span>
              </div>
            </div>
          )}

          {/* Quota Reached Alert & BYOK Key CTA */}
          {isExhausted && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs mb-3 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Free Daily Limit Reached</span>
              </div>
              <p className="text-[11px] text-rose-300/90 leading-tight">
                To continue dispatching prompts without waiting for tomorrow's reset, connect your own API keys.
              </p>
            </div>
          )}

          {/* Action Link to Configure Keys */}
          <button
            id="navbar-configure-keys-cta-btn"
            onClick={handleConfigureKeysClick}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-md ${
              isExhausted
                ? 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold shadow-rose-500/20'
                : isUnlimited
                ? 'bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/40'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isExhausted ? 'Configure Personal API Keys' : isUnlimited ? 'Manage BYOK Credentials' : 'Add Personal Keys (Unlimited)'}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UsageMeter;
