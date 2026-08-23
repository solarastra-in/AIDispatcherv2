import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert, 
  Sliders, 
  ChevronRight,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { AIProvider } from '../types';

export interface LowBalanceAlert {
  provider: AIProvider;
  providerDisplayName: string;
  monthlySpendLimitUsd: number;
  currentSpendUsd: number;
  remainingBalanceUsd: number;
  quotaUsagePct: number;
  lowBalanceThresholdPct: number;
  isCritical: boolean; // >= 90% or balance < $10
}

interface LowBalanceToastProps {
  alerts: LowBalanceAlert[];
  onDismiss: (provider?: AIProvider) => void;
  onAdjustLimit?: (provider: AIProvider) => void;
  onSwitchToSubscription?: (provider: AIProvider) => void;
  autoDismissMs?: number;
}

export const LowBalanceToast: React.FC<LowBalanceToastProps> = ({
  alerts,
  onDismiss,
  onAdjustLimit,
  onSwitchToSubscription,
  autoDismissMs,
}) => {
  const [activeAlertIndex, setActiveAlertIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(100);

  if (!alerts || alerts.length === 0) return null;

  const currentAlert = alerts[Math.min(activeAlertIndex, alerts.length - 1)] || alerts[0];

  // Auto-dismiss countdown timer if specified and not paused
  useEffect(() => {
    if (!autoDismissMs || isPaused) return;

    const interval = 100;
    const step = (interval / autoDismissMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [autoDismissMs, isPaused, onDismiss]);

  const hasCritical = alerts.some(a => a.isCritical);

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slideUp sm:max-w-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      aria-live="assertive"
    >
      <div className={`relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        hasCritical 
          ? 'bg-slate-950/95 border-rose-500/70 shadow-rose-950/50 ring-1 ring-rose-500/30' 
          : 'bg-slate-950/95 border-amber-500/70 shadow-amber-950/50 ring-1 ring-amber-500/30'
      }`}>
        {/* Top Accent Strip */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${
          hasCritical 
            ? 'from-rose-500 via-red-500 to-amber-500' 
            : 'from-amber-400 via-orange-400 to-amber-600'
        }`} />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                currentAlert.isCritical 
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse' 
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
              }`}>
                {currentAlert.isCritical ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    currentAlert.isCritical
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {currentAlert.isCritical ? 'Quota Exhaustion Imminent' : 'Low Balance Warning'}
                  </span>
                  {alerts.length > 1 && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({activeAlertIndex + 1} of {alerts.length} keys)
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-100 mt-1 flex items-center gap-1.5">
                  <span>{currentAlert.providerDisplayName} API Key Quota Nearing Limit</span>
                </h4>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => onDismiss(currentAlert.provider)}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quota Progress & Balance Breakdown */}
          <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                <span>Spend: <strong>${currentAlert.currentSpendUsd.toFixed(2)}</strong> / ${currentAlert.monthlySpendLimitUsd.toFixed(2)}</span>
              </span>
              <span className={`font-bold ${currentAlert.isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
                {currentAlert.quotaUsagePct.toFixed(1)}% Used
              </span>
            </div>

            {/* Visual Meter Bar */}
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  currentAlert.isCritical 
                    ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, currentAlert.quotaUsagePct))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-slate-500" />
                Remaining Balance: <strong className={currentAlert.isCritical ? 'text-rose-300 font-mono' : 'text-amber-300 font-mono'}>${currentAlert.remainingBalanceUsd.toFixed(2)}</strong>
              </span>
              <span className="text-[10px] text-slate-500">
                Alert Threshold: {currentAlert.lowBalanceThresholdPct}%
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              {onAdjustLimit && (
                <button
                  onClick={() => {
                    onAdjustLimit(currentAlert.provider);
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all border border-slate-700 shadow-sm"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Adjust Spend Limit</span>
                </button>
              )}

              {onSwitchToSubscription && (
                <button
                  onClick={() => {
                    onSwitchToSubscription(currentAlert.provider);
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Switch to $0 Flat Rate</span>
                </button>
              )}
            </div>

            {/* Pagination for multiple provider alerts */}
            {alerts.length > 1 && (
              <div className="flex items-center justify-end space-x-1 self-end sm:self-center">
                {alerts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveAlertIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === activeAlertIndex ? 'bg-amber-400 w-4' : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Auto dismiss timer indicator */}
        {autoDismissMs && (
          <div 
            className="h-1 bg-amber-500/30 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>
  );
};
