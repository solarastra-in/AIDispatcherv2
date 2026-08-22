import React from 'react';
import { X, ShieldCheck, Check, Lock, Users, Sparkles, Cpu, KeyRound, Database, Globe, ArrowRight } from 'lucide-react';
import { UserPersona, UserRole } from '../types';
import { ROLE_DEFINITIONS } from '../utils/permissions';
import { PERSONA_PROFILES } from '../data/mockData';

interface RoleMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
  onNavigateTab?: (tab: string) => void;
}

export const RoleMatrixModal: React.FC<RoleMatrixModalProps> = ({
  isOpen,
  onClose,
  activePersona,
  onSelectPersona,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const roles: UserRole[] = ['guest', 'user', 'team_member', 'team_admin', 'platform_admin'];

  const pagesMatrix = [
    { name: 'Overview / Home', id: 'home', guest: true, user: true, team_member: true, team_admin: true, platform_admin: true, note: 'Public Marketing' },
    { name: 'How It Works & Pipeline', id: 'how-it-works', guest: true, user: true, team_member: true, team_admin: true, platform_admin: true, note: 'Public Marketing' },
    { name: 'Capabilities Deck', id: 'capabilities', guest: true, user: true, team_member: true, team_admin: true, platform_admin: true, note: 'Public Marketing' },
    { name: 'Examples & ROI Calculator', id: 'examples', guest: true, user: true, team_member: true, team_admin: true, platform_admin: true, note: 'Public Interactive' },
    { name: 'Pricing & 7-Day Trial', id: 'pricing', guest: true, user: true, team_member: true, team_admin: true, platform_admin: true, note: 'Public Tiers' },
    { name: 'Contact & Inquiries', id: 'contact', guest: true, user: true, team_member: true, team_admin: true, platform_admin: true, note: 'Public Inquiries' },
    { name: 'Market Architecture', id: 'research', guest: true, user: true, team_member: true, team_admin: true, platform_admin: true, note: 'Public Benchmarks' },
    { name: 'Dispatch Console', id: 'dispatch', guest: 'Preview Only (No Submit)', user: true, team_member: true, team_admin: true, platform_admin: true, note: 'Core AI Routing' },
    { name: 'Workspace Studio', id: 'workspace', guest: false, user: true, team_member: true, team_admin: true, platform_admin: true, note: 'Multi-turn Sessions' },
    { name: 'Models Catalog', id: 'catalog', guest: 'Read-only', user: true, team_member: true, team_admin: true, platform_admin: true, note: 'Model Directory' },
    { name: 'Context Ledger', id: 'ledger', guest: 'Read-only Demo', user: true, team_member: true, team_admin: true, platform_admin: true, note: 'State Chains' },
    { name: 'Savings & Trends', id: 'analytics', guest: 'Sample Telemetry', user: true, team_member: true, team_admin: true, platform_admin: true, note: 'ROI Analytics' },
    { name: 'Company BYOK & Keys', id: 'credentials', guest: false, user: true, team_member: 'Assigned', team_admin: true, platform_admin: true, note: 'Key Management' },
    { name: 'Team & Governance', id: 'teams', guest: false, user: false, team_member: 'Member View', team_admin: true, platform_admin: true, note: 'RBAC Policies' },
    { name: 'SuperAdmin Console', id: 'admin', guest: false, user: false, team_member: false, team_admin: false, platform_admin: true, note: 'Master Admin' },
  ];

  const submissionCapabilities = [
    { label: 'Submit Live AI Dispatches', guest: false, user: true, team_member: true, team_admin: true, platform_admin: true },
    { label: 'Manual Engine / Model Selection', guest: false, user: true, team_member: 'If Granted', team_admin: true, platform_admin: true },
    { label: 'Connect BYOK & Local CLI Tunnel', guest: false, user: true, team_member: false, team_admin: true, platform_admin: true },
    { label: 'Manage Team Members & Budgets', guest: false, user: false, team_member: false, team_admin: true, platform_admin: true },
    { label: 'Global SMTP & Platform Audit Logs', guest: false, user: false, team_member: false, team_admin: false, platform_admin: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-400/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
              Role & Permissions Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Complete access control policy for page navigation, feature visibility, and submission authority.
            </p>
          </div>
        </div>

        {/* Persona Switcher Quick Bar */}
        <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 my-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Test With Live Role Personas
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Click any role to preview navigation adaptation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {PERSONA_PROFILES.map((p) => {
              const isSelected = p.id === activePersona.id;
              const spec = ROLE_DEFINITIONS[p.role];
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPersona(p)}
                  className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500/15 border-orange-400/60 shadow-lg shadow-orange-500/10'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20" />
                    <span className="text-xs font-bold text-white truncate">{p.name}</span>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold w-fit ${spec?.badgeColor || ''}`}>
                    {p.role.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{p.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Page Navigation & Visibility Matrix */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-mono text-cyan-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" /> 1. Page Navigation & View Visibility
            </h3>
            
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                    <th className="p-3 font-semibold text-slate-200">Page / Section</th>
                    <th className="p-3 text-center">Guest Visitor</th>
                    <th className="p-3 text-center">Pro Developer</th>
                    <th className="p-3 text-center">Team Member</th>
                    <th className="p-3 text-center">Company Admin</th>
                    <th className="p-3 text-center text-orange-400">SuperAdmin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pagesMatrix.map((row) => {
                    const renderCell = (val: any) => {
                      if (val === true) {
                        return <span className="inline-flex items-center text-emerald-400 font-bold"><Check className="w-4 h-4 mr-0.5" /> Viewable</span>;
                      }
                      if (val === false) {
                        return <span className="inline-flex items-center text-slate-500"><Lock className="w-3 h-3 mr-0.5 text-red-400/80" /> Hidden / Gated</span>;
                      }
                      return <span className="text-[10px] text-amber-300 font-sans px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-400/20">{val}</span>;
                    };

                    return (
                      <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <div className="font-sans font-semibold text-white">{row.name}</div>
                          <div className="text-[10px] text-slate-400">{row.note}</div>
                        </td>
                        <td className="p-3 text-center">{renderCell(row.guest)}</td>
                        <td className="p-3 text-center">{renderCell(row.user)}</td>
                        <td className="p-3 text-center">{renderCell(row.team_member)}</td>
                        <td className="p-3 text-center">{renderCell(row.team_admin)}</td>
                        <td className="p-3 text-center">{renderCell(row.platform_admin)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submission & Action Permissions */}
          <div>
            <h3 className="text-sm font-mono text-emerald-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> 2. Submission & Operational Authority
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                    <th className="p-3 font-semibold text-slate-200">Capability / Submission Action</th>
                    <th className="p-3 text-center">Guest Visitor</th>
                    <th className="p-3 text-center">Pro Developer</th>
                    <th className="p-3 text-center">Team Member</th>
                    <th className="p-3 text-center">Company Admin</th>
                    <th className="p-3 text-center text-orange-400">SuperAdmin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {submissionCapabilities.map((row) => {
                    const renderCell = (val: any) => {
                      if (val === true) {
                        return <span className="inline-flex items-center text-emerald-400 font-bold"><Check className="w-4 h-4 mr-0.5" /> Allowed</span>;
                      }
                      if (val === false) {
                        return <span className="inline-flex items-center text-slate-500"><Lock className="w-3 h-3 mr-0.5 text-red-400/80" /> Blocked</span>;
                      }
                      return <span className="text-[10px] text-amber-300 font-sans px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-400/20">{val}</span>;
                    };

                    return (
                      <tr key={row.label} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-sans text-slate-200 font-medium">{row.label}</td>
                        <td className="p-3 text-center">{renderCell(row.guest)}</td>
                        <td className="p-3 text-center">{renderCell(row.user)}</td>
                        <td className="p-3 text-center">{renderCell(row.team_member)}</td>
                        <td className="p-3 text-center">{renderCell(row.team_admin)}</td>
                        <td className="p-3 text-center">{renderCell(row.platform_admin)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Current active role: <span className="text-white font-bold">{activePersona.name}</span> ({activePersona.role})
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs cursor-pointer transition-all shadow-md shadow-orange-500/20"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
