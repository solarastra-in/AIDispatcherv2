import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Check, 
  Lock, 
  Users, 
  Sparkles, 
  Cpu, 
  KeyRound, 
  Globe, 
  Building2, 
  Layers, 
  SlidersHorizontal,
  FolderTree,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  ChevronRight,
  Crown,
  Key,
  Shield,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPersona, UserRole } from '../types';
import { ROLE_DEFINITIONS } from '../utils/permissions';
import { PERSONA_PROFILES } from '../data/mockData';

interface RoleMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
  onNavigateTab?: (tab: string) => void;
  realUserEmail?: string | null;
}

interface RoleAuthorityProfile {
  tierLevel: number;
  tierLabel: string;
  scopeTitle: string;
  scopeTag: string;
  domainLabel: string;
  gradientBg: string;
  borderClass: string;
  accentText: string;
  barColor: string;
  summary: string;
  keyPrivileges: string[];
  scopeBoundaries: string[];
  category: 'user' | 'lead' | 'admin' | 'root';
}

const ROLE_AUTHORITY_DATA: Record<UserRole, RoleAuthorityProfile> = {
  guest: {
    tierLevel: 1,
    tierLabel: 'Tier 1 of 6',
    scopeTitle: 'Public Guest Explorer',
    scopeTag: 'PUBLIC SANDBOX',
    domainLabel: 'Public Marketing & Static Demos',
    gradientBg: 'from-slate-900/90 via-slate-900/60 to-slate-950/80',
    borderClass: 'border-slate-700/40',
    accentText: 'text-slate-300',
    barColor: 'bg-slate-500',
    summary: 'Restricted evaluation session. Can view product catalogs and run pricing simulations with no persistent state or live dispatch access.',
    keyPrivileges: [
      'Interactive ROI Calculator & Benchmarks',
      'Read-Only AI Model Directory & Specs',
      'Public Architecture & Pipeline Documentation',
    ],
    scopeBoundaries: [
      'Gated from live prompt dispatches & multi-engine routing',
      'No personal or company BYOK credential storage',
      'No team creation or budget allocations',
    ],
    category: 'user',
  },
  user: {
    tierLevel: 2,
    tierLabel: 'Tier 2 of 6',
    scopeTitle: 'Pro Developer / Individual BYOK',
    scopeTag: 'INDIVIDUAL SANDBOX',
    domainLabel: 'Developer Personal Workspace',
    gradientBg: 'from-emerald-950/40 via-slate-900/80 to-slate-950/90',
    borderClass: 'border-emerald-500/30',
    accentText: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    summary: 'Individual power developer. Holds direct manual model selection and personal BYOK API credentials for custom prototype engineering.',
    keyPrivileges: [
      'Full Multi-Engine Live Prompt Dispatch',
      'Personal BYOK Keys (Gemini, Claude, OpenAI, DeepSeek)',
      'Local CLI Tunnel & Manual Model Overrides',
      'Personal Multi-Turn Stateful Workspace Studio',
    ],
    scopeBoundaries: [
      'Single-seat individual developer boundary',
      'Cannot view other team member credentials or telemetry',
      'No organizational team management or company quota governance',
    ],
    category: 'user',
  },
  team_member: {
    tierLevel: 3,
    tierLabel: 'Tier 3 of 6',
    scopeTitle: 'Department Team Member',
    scopeTag: 'POD EXECUTION SCOPE',
    domainLabel: 'Enterprise Department Pod',
    gradientBg: 'from-blue-950/40 via-slate-900/80 to-slate-950/90',
    borderClass: 'border-blue-500/30',
    accentText: 'text-blue-400',
    barColor: 'bg-blue-500',
    summary: 'Standard organizational team engineer. Dispatches live queries governed by assigned department policies and inherited company credentials.',
    keyPrivileges: [
      'Submit Live AI Dispatches via Team Policies',
      'Inherit Organization BYOK & Enterprise Models',
      'View Department Token Spend & ROI Telemetry',
      'Workspace Stateful Collaboration',
    ],
    scopeBoundaries: [
      'Cannot edit or view raw API keys or provider secrets',
      'Execution restricted to policy-approved model tiers',
      'Cannot invite peers or adjust pod token budgets',
    ],
    category: 'user',
  },
  team_admin: {
    tierLevel: 4,
    tierLabel: 'Tier 4 of 6',
    scopeTitle: 'Team Lead / Pod Manager',
    scopeTag: 'DEPARTMENT SCOPE',
    domainLabel: 'Assigned Department / Engineering Pod',
    gradientBg: 'from-cyan-950/40 via-slate-900/80 to-slate-950/90',
    borderClass: 'border-cyan-500/30',
    accentText: 'text-cyan-400',
    barColor: 'bg-cyan-500',
    summary: 'Department supervisor managing assigned member seats, pod-level BYOK keys, and member model access within organizational allocation.',
    keyPrivileges: [
      'Manage Assigned Pod Members & Role Assignments',
      'Configure Team-Specific BYOK Keys & Department Models',
      'Set Seat-Level Token Quotas within Department Allocation',
      'Inspect Real-Time Pod Telemetry & Cost Avoidance',
    ],
    scopeBoundaries: [
      'Single department boundary (cannot view other pods)',
      'Cannot create additional teams or change organization limits',
      'Strictly isolated from root SuperAdmin console & global SMTP',
    ],
    category: 'lead',
  },
  corporate_admin: {
    tierLevel: 5,
    tierLabel: 'Tier 5 of 6',
    scopeTitle: 'Corporate Admin / Organization Director',
    scopeTag: 'COMPANY TENANT SCOPE',
    domainLabel: 'Enterprise Organization (e.g. SolarAstra Energy)',
    gradientBg: 'from-purple-950/50 via-slate-900/90 to-slate-950',
    borderClass: 'border-purple-500/40 ring-1 ring-purple-500/20',
    accentText: 'text-purple-300',
    barColor: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    summary: 'Organization controller with multi-team authority: creates sub-teams, manages company BYOK key inheritance, sets department token budgets, and configures company fallback policies.',
    keyPrivileges: [
      'Provision & Manage Multiple Teams / Departments (Up to 10)',
      'Company-Wide BYOK Credential Vault & Delegation to Pods',
      'Set Department Token & USD Spend Caps from Org Pool',
      'Appoint Department Leads & Configure Routing Fallbacks',
      'Company-Wide Telemetry, Invoices & Cost Avoidance Audit',
    ],
    scopeBoundaries: [
      'Strict Tenant Isolation (scoped exclusively to company account)',
      'Gated from Platform SuperAdmin Root Console',
      'Cannot modify other companies or global SMTP infrastructure',
    ],
    category: 'admin',
  },
  platform_admin: {
    tierLevel: 6,
    tierLabel: 'Tier 6 of 6',
    scopeTitle: 'Platform SuperAdmin / Root Master',
    scopeTag: 'GLOBAL ROOT SCOPE',
    domainLabel: 'WhyOr Dispatch Platform Global Infrastructure',
    gradientBg: 'from-orange-950/50 via-slate-900/90 to-slate-950',
    borderClass: 'border-orange-500/40 ring-1 ring-orange-500/20',
    accentText: 'text-orange-300',
    barColor: 'bg-gradient-to-r from-orange-500 to-amber-400',
    summary: 'Master system administrator with unrestricted root authority across all enterprise tenants, platform master keys, global SMTP servers, and system telemetry.',
    keyPrivileges: [
      'Unrestricted Platform SuperAdmin Root Console',
      'Global SMTP Server Infrastructure & Verification Dispatch',
      'Multi-Tenant Company Onboarding & Master Contract Terms',
      'Platform Master AI Engine Keys & Fallback Engine Secret Proxies',
      'Full Multi-Tenant Audit Trail & Billing Ledger Oversight',
    ],
    scopeBoundaries: [
      'Full Root Global Authority across the entire WhyOr platform ecosystem',
    ],
    category: 'root',
  },
};

export const RoleMatrixModal: React.FC<RoleMatrixModalProps> = ({
  isOpen,
  onClose,
  activePersona,
  onSelectPersona,
  onNavigateTab,
  realUserEmail,
}) => {
  const isRealSuperAdmin = !!(realUserEmail && realUserEmail.toLowerCase() === 'solarastra.in@gmail.com');
  const isPersonaSelectable = (role: string) => isRealSuperAdmin || role === 'guest' || role === 'user';
  const [activeViewMode, setActiveViewMode] = useState<'matrix' | 'scope_comparison' | 'corporate_focus'>('matrix');

  if (!isOpen) return null;

  const authProfile = ROLE_AUTHORITY_DATA[activePersona.role] || ROLE_AUTHORITY_DATA.user;
  const authorityPercentage = (authProfile.tierLevel / 6) * 100;

  const pagesMatrix = [
    { name: 'Overview / Home', id: 'home', guest: true, user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true, note: 'Public Product Marketing' },
    { name: 'How It Works & Pipeline', id: 'how-it-works', guest: true, user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true, note: 'Architecture & Engine Pipeline' },
    { name: 'Capabilities Deck', id: 'capabilities', guest: true, user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true, note: 'Enterprise Specs & Security' },
    { name: 'Examples & ROI Calculator', id: 'examples', guest: true, user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true, note: 'Interactive Cost Simulator' },
    { name: 'Pricing & 7-Day Trial', id: 'pricing', guest: true, user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true, note: 'Tiers & Free Trial Signup' },
    { name: 'Contact & Inquiries', id: 'contact', guest: true, user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true, note: 'Enterprise Quotes & Support' },
    { name: 'Market Architecture', id: 'research', guest: true, user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true, note: 'Competitive Benchmark Analysis' },
    { name: 'Dispatch Console', id: 'dispatch', guest: 'Preview Only (No Run)', user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true, note: 'Unified Multi-Engine Routing' },
    { name: 'Workspace Studio', id: 'workspace', guest: false, user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true, note: 'Multi-turn Stateful Sessions' },
    { name: 'Models Catalog', id: 'catalog', guest: 'Read-only', user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true, note: 'Live AI Model Directory' },
    { name: 'Context Ledger', id: 'ledger', guest: 'Read-only Demo', user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true, note: 'SHA-256 State Compression' },
    { name: 'Savings & Trends', id: 'analytics', guest: 'Sample Telemetry', user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true, note: 'Real-time ROI Analytics' },
    { name: 'Company BYOK & Keys', id: 'credentials', guest: false, user: 'Personal BYOK', team_member: 'Assigned View', team_admin: 'Team Scoped', corporate_admin: 'Company Tenant BYOK', platform_admin: 'Global Master Keys', note: 'Key & Credential Management' },
    { name: 'Team & Governance', id: 'teams', guest: false, user: false, team_member: 'Member View', team_admin: 'Single Team Admin', corporate_admin: 'Multi-Team & Org Admin', platform_admin: 'Platform Global Admin', note: 'RBAC, Budgets & Quotas' },
    { name: 'SuperAdmin Console', id: 'admin', guest: false, user: false, team_member: false, team_admin: false, corporate_admin: false, platform_admin: true, note: 'Platform Root Administration' },
  ];

  const submissionCapabilities = [
    { label: 'Submit Live AI Dispatches', guest: false, user: true, team_member: true, team_admin: true, corporate_admin: true, platform_admin: true },
    { label: 'Manual Engine / Model Selection', guest: false, user: true, team_member: 'If Policy Allows', team_admin: true, corporate_admin: true, platform_admin: true },
    { label: 'Connect Personal BYOK / Local CLI Tunnel', guest: false, user: true, team_member: false, team_admin: 'Team Keys', corporate_admin: 'Company BYOK', platform_admin: 'Global Master' },
    { label: 'Manage Team-Specific Credentials & Inheritance', guest: false, user: false, team_member: false, team_admin: 'Team Scoped', corporate_admin: 'Full Org Scope', platform_admin: 'Global Root Scope' },
    { label: 'Create Multiple Teams & Appoint Leads', guest: false, user: false, team_member: false, team_admin: false, corporate_admin: 'Up to Org Limit', platform_admin: 'Unlimited Platform' },
    { label: 'Set Department Token & USD Budgets', guest: false, user: false, team_member: false, team_admin: 'Within Allocation', corporate_admin: 'Full Org Budget', platform_admin: 'Platform Quotas' },
    { label: 'Configure Company Routing & Fallback Policies', guest: false, user: false, team_member: false, team_admin: false, corporate_admin: true, platform_admin: true },
    { label: 'Global SMTP Infrastructure & Platform Audit', guest: false, user: false, team_member: false, team_admin: false, corporate_admin: false, platform_admin: true },
  ];

  const renderCell = (val: any, roleKey: UserRole) => {
    const isCurrentRole = activePersona.role === roleKey;
    if (val === true) {
      return (
        <span className={`inline-flex items-center font-bold ${isCurrentRole ? 'text-emerald-300' : 'text-emerald-400'}`}>
          <Check className="w-3.5 h-3.5 mr-1" /> Allowed
        </span>
      );
    }
    if (val === false) {
      return (
        <span className={`inline-flex items-center ${isCurrentRole ? 'text-rose-300/90' : 'text-slate-500'}`}>
          <Lock className="w-3 h-3 mr-1 text-rose-400/70" /> Gated
        </span>
      );
    }
    return (
      <span className={`text-[10px] font-sans px-1.5 py-0.5 rounded border whitespace-nowrap ${
        isCurrentRole 
          ? 'bg-amber-400/20 text-amber-200 border-amber-300/40 font-semibold' 
          : 'text-amber-300 bg-amber-500/10 border-amber-400/20'
      }`}>
        {val}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-6xl w-full p-5 sm:p-8 shadow-2xl relative my-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close Role Matrix"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-400/30 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                  6-Tier Role & Permissions Matrix
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Corporate Admin Enhanced
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-tenant hierarchy governing view permissions, team credential inheritance, and administrative boundaries.
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeViewMode === 'matrix'
                  ? 'bg-orange-500 text-slate-950 font-bold shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Permissions Matrix
            </button>
            <button
              onClick={() => setActiveViewMode('corporate_focus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'corporate_focus'
                  ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Corporate Admin Scope
            </button>
            <button
              onClick={() => setActiveViewMode('scope_comparison')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'scope_comparison'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Scope Hierarchy
            </button>
          </div>
        </div>

        {/* Persona Switcher Quick Bar with Layout Transitions */}
        <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 my-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Test With Live Role Personas
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Click any role below to observe dynamic scope transition animations
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {PERSONA_PROFILES.map((p) => {
              const isSelected = p.id === activePersona.id;
              const spec = ROLE_DEFINITIONS[p.role];
              const isCorp = p.role === 'corporate_admin';
              const isSuper = p.role === 'platform_admin';
              const isLead = p.role === 'team_admin';
              const isSelectable = isPersonaSelectable(p.role);

              return (
                <motion.button
                  key={p.id}
                  layout
                  whileHover={isSelectable ? { scale: 1.02 } : undefined}
                  whileTap={isSelectable ? { scale: 0.98 } : undefined}
                  disabled={!isSelectable}
                  title={isSelectable ? undefined : 'Sign in as the platform super admin to preview this role'}
                  onClick={() => { if (isSelectable) onSelectPersona(p); }}
                  className={`flex flex-col p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                    !isSelectable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? isCorp
                        ? 'bg-purple-500/20 border-purple-400/80 shadow-lg shadow-purple-500/20 ring-2 ring-purple-400/60'
                        : isSuper
                        ? 'bg-orange-500/20 border-orange-400/80 shadow-lg shadow-orange-500/20 ring-2 ring-orange-400/60'
                        : isLead
                        ? 'bg-cyan-500/20 border-cyan-400/80 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/60'
                        : 'bg-emerald-500/15 border-emerald-400/70 shadow-lg ring-2 ring-emerald-400/50'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {/* Role Type Pill Badge */}
                  {isCorp && (
                    <div className="absolute top-0 right-0 bg-purple-500 text-[8px] font-bold text-white px-1.5 py-0.2 rounded-bl">
                      TENANT
                    </div>
                  )}
                  {isSuper && (
                    <div className="absolute top-0 right-0 bg-orange-500 text-[8px] font-bold text-slate-950 px-1.5 py-0.2 rounded-bl">
                      ROOT
                    </div>
                  )}
                  {isLead && (
                    <div className="absolute top-0 right-0 bg-cyan-500 text-[8px] font-bold text-slate-950 px-1.5 py-0.2 rounded-bl">
                      POD
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-1.5">
                    <img 
                      src={p.avatar} 
                      alt={p.name} 
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-xs font-bold text-white truncate">{p.name.split(' ')[0]}</span>
                  </div>
                  
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold w-fit mb-1 ${spec?.badgeColor || ''}`}>
                    {p.role.replace('_', ' ')}
                  </span>
                  
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    {p.companyName || p.title}
                  </span>

                  {/* Active Selected Animated Indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="activePersonaPill"
                      className="absolute inset-0 border-2 border-white/40 pointer-events-none rounded-xl"
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* DYNAMIC ROLE SCOPE TRANSITION BANNER (Animated with AnimatePresence) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePersona.id}
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`mb-5 p-5 rounded-2xl bg-gradient-to-br ${authProfile.gradientBg} border ${authProfile.borderClass} shadow-xl relative overflow-hidden`}
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${ROLE_DEFINITIONS[activePersona.role]?.badgeColor || ''}`}>
                    {authProfile.tierLabel}
                  </span>
                  <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-white/10 border border-white/15">
                    {authProfile.scopeTag}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Domain: <span className="text-white font-semibold">{authProfile.domainLabel}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-lg sm:text-xl font-display font-bold text-white">
                    {activePersona.name}: <span className={authProfile.accentText}>{authProfile.scopeTitle}</span>
                  </h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {authProfile.summary}
                </p>
              </div>

              {/* Authority Level Power Gauge */}
              <div className="bg-slate-950/70 border border-white/10 rounded-xl p-3.5 min-w-[260px] space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Authority Scope Level:</span>
                  <span className={`font-bold ${authProfile.accentText}`}>
                    Level {authProfile.tierLevel} / 6 ({authorityPercentage.toFixed(0)}%)
                  </span>
                </div>

                {/* Animated Progress Meter */}
                <div className="relative w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${authorityPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${authProfile.barColor}`}
                  />
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                  <span>Guest</span>
                  <span>Pro Dev</span>
                  <span>Pod Lead</span>
                  <span className="text-purple-300 font-bold">Corp Admin</span>
                  <span className="text-orange-400 font-bold">SuperAdmin</span>
                </div>
              </div>
            </div>

            {/* Privileges vs Boundaries Quick Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10 text-xs font-mono">
              <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Key Authority Capabilities
                </div>
                <ul className="space-y-1.5 text-slate-300 text-[11px] font-sans">
                  {authProfile.keyPrivileges.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-mono mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Governance Boundaries & Restrictions
                </div>
                <ul className="space-y-1.5 text-slate-300 text-[11px] font-sans">
                  {authProfile.scopeBoundaries.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-mono mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* VIEW MODE 1: CORPORATE ADMIN FOCUS CALLOUT */}
        <AnimatePresence mode="wait">
          {activeViewMode === 'corporate_focus' && (
            <motion.div
              key="corporate_focus"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Corporate Admin Hero Card */}
              <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/40 flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">Corporate Admin Scope of Management</h3>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 rounded-md border border-purple-400/30">
                          TENANT ISOLATED
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Authoritative organization-level controller managing company-wide AI credentials, sub-teams, and department spend caps.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('credentials')}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Manage Company BYOK
                    </button>
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('teams')}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" /> Manage Teams & RBAC
                    </button>
                  </div>
                </div>

                {/* Specific Scopes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-purple-500/20">
                  {/* Scope 1: Credentials */}
                  <div className="bg-slate-950/60 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-purple-300 text-xs font-bold font-mono mb-2">
                      <KeyRound className="w-4 h-4 text-purple-400" /> 1. Team-Specific Credentials
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 font-sans">
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>Configure company-wide BYOK provider keys (Gemini, Claude, OpenAI, DeepSeek, Groq).</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>Assign specific keys to individual teams (e.g. reasoning models to R&D pod, budget models to support).</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>Toggle company subscription fallback and enforce zero-data retention policies.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Scope 2: Multi-Team Hierarchy */}
                  <div className="bg-slate-950/60 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-purple-300 text-xs font-bold font-mono mb-2">
                      <FolderTree className="w-4 h-4 text-purple-400" /> 2. Multi-Team Provisioning
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 font-sans">
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>Create and archive up to company tier limit (e.g. 10 teams/pods).</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>Appoint and replace Team Leads / Managers for each department.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>Invite engineers and configure seat-level model tier permissions.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Scope 3: Budget & Guardrails */}
                  <div className="bg-slate-950/60 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-purple-300 text-xs font-bold font-mono mb-2">
                      <SlidersHorizontal className="w-4 h-4 text-purple-400" /> 3. Budgets & Fallbacks
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 font-sans">
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>Set monthly USD and token budgets per team from organization pool.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>Enforce model tier restrictions (e.g., block frontier models for junior seats).</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <span className="text-slate-400">Strictly isolated from root SuperAdmin console & global platform SMTP.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Scope Contrast: Corporate Admin vs SuperAdmin */}
              <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-5">
                <h4 className="text-sm font-mono text-cyan-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Authority Comparison: Corporate Admin vs. Platform SuperAdmin
                </h4>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03] text-slate-300">
                        <th className="p-3 font-semibold">Governance Area</th>
                        <th className="p-3 text-purple-300 font-bold bg-purple-500/10">Corporate Admin (Tenant Scope)</th>
                        <th className="p-3 text-orange-400 font-bold bg-orange-500/10">Platform SuperAdmin (Root Global)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr className="hover:bg-white/[0.01]">
                        <td className="p-3 font-sans font-medium text-white">Management Domain</td>
                        <td className="p-3 text-slate-300">Single Enterprise Tenant (e.g. SolarAstra Energy Systems)</td>
                        <td className="p-3 text-orange-300">Global Platform (all enterprise companies, tenants & users)</td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="p-3 font-sans font-medium text-white">AI Key Management</td>
                        <td className="p-3 text-slate-300">Company BYOK & Team-Specific Credential Assignments</td>
                        <td className="p-3 text-orange-300">Platform Master Fallback Keys, Environment Secrets & Proxies</td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="p-3 font-sans font-medium text-white">Team Creation</td>
                        <td className="p-3 text-slate-300">Create & manage sub-teams within company account</td>
                        <td className="p-3 text-orange-300">Onboard new companies, modify subscription contracts</td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="p-3 font-sans font-medium text-white">Budget Authority</td>
                        <td className="p-3 text-slate-300">Distribute company quota across internal departments</td>
                        <td className="p-3 text-orange-300">Global platform limits, Stripe invoices & payment reconciliations</td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="p-3 font-sans font-medium text-white">Audit & Telemetry</td>
                        <td className="p-3 text-slate-300">Company-wide audit logs & team token spend tracking</td>
                        <td className="p-3 text-orange-300">Multi-tenant root audit logs, SMTP dispatch & error delivery</td>
                      </tr>
                      <tr className="hover:bg-white/[0.01]">
                        <td className="p-3 font-sans font-medium text-white">SuperAdmin Console</td>
                        <td className="p-3 text-red-400 font-bold flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Gated / Blocked (Tenant Isolation)
                        </td>
                        <td className="p-3 text-emerald-400 font-bold">
                          <Check className="w-3.5 h-3.5 inline mr-1" /> Full Root Access (solarastra.in@gmail.com)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VIEW MODE 2: SCOPE HIERARCHY BREAKDOWN */}
        <AnimatePresence mode="wait">
          {activeViewMode === 'scope_comparison' && (
            <motion.div
              key="scope_comparison"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Level 1: Platform SuperAdmin */}
                <div className={`rounded-2xl p-5 relative transition-all ${
                  activePersona.role === 'platform_admin'
                    ? 'bg-slate-950/90 border-2 border-orange-400 ring-2 ring-orange-400/40 shadow-xl'
                    : 'bg-slate-950/70 border border-orange-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono font-bold text-xs">
                      L1
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white">Platform SuperAdmin</h4>
                        {activePersona.role === 'platform_admin' && (
                          <span className="px-1.5 py-0.2 rounded bg-orange-500 text-slate-950 font-mono text-[9px] font-bold">ACTIVE</span>
                        )}
                      </div>
                      <span className="text-[10px] text-orange-400 font-mono">GLOBAL ROOT SCOPE</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mb-3 font-sans">
                    Master administrator with platform-wide governance over all tenants, AI proxies, and root infrastructure.
                  </p>
                  <div className="text-[11px] text-slate-400 space-y-1.5 border-t border-white/10 pt-3 font-mono">
                    <div className="text-white font-sans font-semibold">Key Capabilities:</div>
                    <div>• Root SuperAdmin Console</div>
                    <div>• Global SMTP Server & Verification</div>
                    <div>• Multi-Tenant Company Provisioning</div>
                    <div>• Platform Master AI Engine Keys</div>
                  </div>
                </div>

                {/* Level 2: Corporate Admin */}
                <div className={`rounded-2xl p-5 relative transition-all ${
                  activePersona.role === 'corporate_admin'
                    ? 'bg-slate-950/90 border-2 border-purple-400 ring-2 ring-purple-400/40 shadow-xl'
                    : 'bg-slate-950/70 border border-purple-500/40 ring-1 ring-purple-400/30'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-mono font-bold text-xs">
                      L2
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white">Corporate Admin</h4>
                        {activePersona.role === 'corporate_admin' && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500 text-white font-mono text-[9px] font-bold">ACTIVE</span>
                        )}
                      </div>
                      <span className="text-[10px] text-purple-300 font-mono">COMPANY TENANT SCOPE</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mb-3 font-sans">
                    Enterprise organization director managing sub-teams, company BYOK keys, and department budget allocations.
                  </p>
                  <div className="text-[11px] text-slate-400 space-y-1.5 border-t border-white/10 pt-3 font-mono">
                    <div className="text-purple-300 font-sans font-semibold">Key Capabilities:</div>
                    <div>• Company BYOK & Team-Specific Keys</div>
                    <div>• Create & Manage Multiple Teams</div>
                    <div>• Appoint Team Leads & Quotas</div>
                    <div>• Organization Routing & Fallback</div>
                  </div>
                </div>

                {/* Level 3: Team Lead */}
                <div className={`rounded-2xl p-5 relative transition-all ${
                  activePersona.role === 'team_admin'
                    ? 'bg-slate-950/90 border-2 border-cyan-400 ring-2 ring-cyan-400/40 shadow-xl'
                    : 'bg-slate-950/70 border border-cyan-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono font-bold text-xs">
                      L3
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white">Team Lead / Manager</h4>
                        {activePersona.role === 'team_admin' && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 font-mono text-[9px] font-bold">ACTIVE</span>
                        )}
                      </div>
                      <span className="text-[10px] text-cyan-300 font-mono">DEPARTMENT SCOPE</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mb-3 font-sans">
                    Department lead managing assigned members, pod token limits, and team-level prompt dispatches.
                  </p>
                  <div className="text-[11px] text-slate-400 space-y-1.5 border-t border-white/10 pt-3 font-mono">
                    <div className="text-cyan-300 font-sans font-semibold">Key Capabilities:</div>
                    <div>• Single Team Member Management</div>
                    <div>• Pod Token Usage Monitoring</div>
                    <div>• Department Tier Enforcements</div>
                    <div>• Team BYOK & Model Selection</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VIEW MODE 3: COMPLETE PERMISSIONS MATRIX (DEFAULT) */}
        <AnimatePresence mode="wait">
          {activeViewMode === 'matrix' && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* 1. Page Navigation & Visibility Matrix */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4" /> 1. Page Navigation & View Visibility Matrix
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Active role highlighted in table column below
                  </span>
                </div>
                
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/50">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                        <th className="p-3 font-semibold text-slate-200">Page / Section</th>
                        <th className={`p-3 text-center transition-colors ${activePersona.role === 'guest' ? 'bg-white/10 text-white font-bold' : ''}`}>
                          Guest Visitor {activePersona.role === 'guest' && '★'}
                        </th>
                        <th className={`p-3 text-center transition-colors ${activePersona.role === 'user' ? 'bg-emerald-500/15 text-emerald-300 font-bold' : ''}`}>
                          Pro Dev {activePersona.role === 'user' && '★'}
                        </th>
                        <th className={`p-3 text-center transition-colors ${activePersona.role === 'team_member' ? 'bg-blue-500/15 text-blue-300 font-bold' : ''}`}>
                          Team Member {activePersona.role === 'team_member' && '★'}
                        </th>
                        <th className={`p-3 text-center transition-colors ${activePersona.role === 'team_admin' ? 'bg-cyan-500/15 text-cyan-300 font-bold' : ''}`}>
                          Team Lead {activePersona.role === 'team_admin' && '★'}
                        </th>
                        <th className={`p-3 text-center transition-colors ${activePersona.role === 'corporate_admin' ? 'bg-purple-500/20 text-purple-200 font-bold ring-1 ring-purple-400/40' : 'text-purple-300 bg-purple-500/5 font-bold'}`}>
                          Corporate Admin {activePersona.role === 'corporate_admin' && '★'}
                        </th>
                        <th className={`p-3 text-center transition-colors ${activePersona.role === 'platform_admin' ? 'bg-orange-500/20 text-orange-200 font-bold ring-1 ring-orange-400/40' : 'text-orange-400 font-bold'}`}>
                          SuperAdmin {activePersona.role === 'platform_admin' && '★'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pagesMatrix.map((row) => (
                        <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3">
                            <div className="font-sans font-semibold text-white">{row.name}</div>
                            <div className="text-[10px] text-slate-400">{row.note}</div>
                          </td>
                          <td className={`p-3 text-center ${activePersona.role === 'guest' ? 'bg-white/[0.04]' : ''}`}>
                            {renderCell(row.guest, 'guest')}
                          </td>
                          <td className={`p-3 text-center ${activePersona.role === 'user' ? 'bg-emerald-500/[0.06]' : ''}`}>
                            {renderCell(row.user, 'user')}
                          </td>
                          <td className={`p-3 text-center ${activePersona.role === 'team_member' ? 'bg-blue-500/[0.06]' : ''}`}>
                            {renderCell(row.team_member, 'team_member')}
                          </td>
                          <td className={`p-3 text-center ${activePersona.role === 'team_admin' ? 'bg-cyan-500/[0.06]' : ''}`}>
                            {renderCell(row.team_admin, 'team_admin')}
                          </td>
                          <td className={`p-3 text-center ${activePersona.role === 'corporate_admin' ? 'bg-purple-500/10' : 'bg-purple-500/5'}`}>
                            {renderCell(row.corporate_admin, 'corporate_admin')}
                          </td>
                          <td className={`p-3 text-center ${activePersona.role === 'platform_admin' ? 'bg-orange-500/10' : ''}`}>
                            {renderCell(row.platform_admin, 'platform_admin')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Submission & Operational Authority */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> 2. Submission Authority & Administrative Operations
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Execution & Modification Permissions
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/50">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                        <th className="p-3 font-semibold text-slate-200">Capability / Operational Action</th>
                        <th className={`p-3 text-center transition-colors ${activePersona.role === 'guest' ? 'bg-white/10 text-white font-bold' : ''}`}>
                          Guest Visitor {activePersona.role === 'guest' && '★'}
                        </th>
                        <th className={`p-3 text-center transition-colors ${activePersona.role === 'user' ? 'bg-emerald-500/15 text-emerald-300 font-bold' : ''}`}>
                          Pro Dev {activePersona.role === 'user' && '★'}
                        </th>
                        <th className={`p-3 text-center transition-colors ${activePersona.role === 'team_member' ? 'bg-blue-500/15 text-blue-300 font-bold' : ''}`}>
                          Team Member {activePersona.role === 'team_member' && '★'}
                        </th>
                        <th className={`p-3 text-center transition-colors ${activePersona.role === 'team_admin' ? 'bg-cyan-500/15 text-cyan-300 font-bold' : ''}`}>
                          Team Lead {activePersona.role === 'team_admin' && '★'}
                        </th>
                        <th className={`p-3 text-center transition-colors ${activePersona.role === 'corporate_admin' ? 'bg-purple-500/20 text-purple-200 font-bold ring-1 ring-purple-400/40' : 'text-purple-300 bg-purple-500/5 font-bold'}`}>
                          Corporate Admin {activePersona.role === 'corporate_admin' && '★'}
                        </th>
                        <th className={`p-3 text-center transition-colors ${activePersona.role === 'platform_admin' ? 'bg-orange-500/20 text-orange-200 font-bold ring-1 ring-orange-400/40' : 'text-orange-400 font-bold'}`}>
                          SuperAdmin {activePersona.role === 'platform_admin' && '★'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {submissionCapabilities.map((row) => (
                        <tr key={row.label} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3 font-sans text-slate-200 font-medium">{row.label}</td>
                          <td className={`p-3 text-center ${activePersona.role === 'guest' ? 'bg-white/[0.04]' : ''}`}>
                            {renderCell(row.guest, 'guest')}
                          </td>
                          <td className={`p-3 text-center ${activePersona.role === 'user' ? 'bg-emerald-500/[0.06]' : ''}`}>
                            {renderCell(row.user, 'user')}
                          </td>
                          <td className={`p-3 text-center ${activePersona.role === 'team_member' ? 'bg-blue-500/[0.06]' : ''}`}>
                            {renderCell(row.team_member, 'team_member')}
                          </td>
                          <td className={`p-3 text-center ${activePersona.role === 'team_admin' ? 'bg-cyan-500/[0.06]' : ''}`}>
                            {renderCell(row.team_admin, 'team_admin')}
                          </td>
                          <td className={`p-3 text-center ${activePersona.role === 'corporate_admin' ? 'bg-purple-500/10' : 'bg-purple-500/5'}`}>
                            {renderCell(row.corporate_admin, 'corporate_admin')}
                          </td>
                          <td className={`p-3 text-center ${activePersona.role === 'platform_admin' ? 'bg-orange-500/10' : ''}`}>
                            {renderCell(row.platform_admin, 'platform_admin')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="mt-7 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Active Test Persona:</span>
            <span className="text-white font-bold">{activePersona.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${ROLE_DEFINITIONS[activePersona.role]?.badgeColor || ''}`}>
              {activePersona.role.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs cursor-pointer transition-all shadow-md shadow-orange-500/20"
            >
              Close & Apply Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
