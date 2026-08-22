import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, LogIn, Sparkles, UserCheck, Users, ShieldCheck } from 'lucide-react';
import { UserPersona, UserRole } from '../types';
import { getAccessRestrictionReason, ROLE_DEFINITIONS } from '../utils/permissions';

interface PageAccessGuardProps {
  tabId: string;
  activePersona: UserPersona;
  onNavigateTab: (tab: string) => void;
  onOpenAuthGate?: () => void;
  onOpenRoleMatrix?: () => void;
  onSwitchToSuperAdmin?: () => void;
}

export const PageAccessGuard: React.FC<PageAccessGuardProps> = ({
  tabId,
  activePersona,
  onNavigateTab,
  onOpenAuthGate,
  onOpenRoleMatrix,
  onSwitchToSuperAdmin,
}) => {
  const restriction = getAccessRestrictionReason(tabId, activePersona.role);
  const currentRoleSpec = ROLE_DEFINITIONS[activePersona.role];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900/90 border border-red-500/30 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden text-center">
        {/* Glow ambient background orb */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Heading */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-5 shadow-lg shadow-red-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-400/30 text-red-300 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            Security & RBAC Enforcement Gate
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            {restriction.title}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mt-3 leading-relaxed">
            {restriction.message}
          </p>

          {/* Current vs Required Role Card */}
          <div className="w-full max-w-lg mt-6 bg-slate-950/60 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Your Active Role</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${currentRoleSpec.badgeColor}`}>
                  {currentRoleSpec.label}
                </span>
                <span className="text-xs text-slate-300">({activePersona.email})</span>
              </div>
            </div>

            <div className="hidden sm:block text-slate-600 font-mono">→</div>

            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase">Required Role</div>
              <div className="text-xs font-mono font-bold text-amber-400 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {restriction.requiredRole}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={() => onNavigateTab('home')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold cursor-pointer transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Overview
            </button>

            {activePersona.role === 'guest' && (
              <>
                <button
                  onClick={() => onOpenAuthGate ? onOpenAuthGate() : onNavigateTab('pricing')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Sign In / 7-Day Free Trial
                </button>
              </>
            )}

            {tabId === 'teams' && activePersona.role === 'user' && (
              <button
                onClick={() => onNavigateTab('pricing')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
              >
                <Users className="w-4 h-4" />
                View Team & Enterprise Plans
              </button>
            )}

            {onOpenRoleMatrix && (
              <button
                onClick={onOpenRoleMatrix}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono font-bold cursor-pointer transition-all"
              >
                <UserCheck className="w-4 h-4" />
                View Role & Permissions Matrix
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
