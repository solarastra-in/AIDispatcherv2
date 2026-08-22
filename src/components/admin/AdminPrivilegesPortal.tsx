import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Search, 
  Filter, 
  Check, 
  X, 
  Edit3, 
  Save, 
  Lock, 
  Key, 
  Sliders, 
  Mail, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  UserCheck, 
  UserX,
  FileText,
  DollarSign,
  Cpu,
  ArrowRight,
  Send,
  Zap
} from 'lucide-react';
import { 
  CompanyFirestore, 
  TeamFirestore, 
  loadCompaniesFromFirestore, 
  loadTeamsFromFirestore, 
  saveTeamToFirestore,
  recordAuditLogToFirestore,
  logEmailToFirestore,
  auth
} from '../../lib/firebase';

export interface AdminPrivileges {
  canConfigureBYOK: boolean;
  canSetSpendLimits: boolean;
  canInviteMembers: boolean;
  canOverrideRouting: boolean;
  canViewAuditLogs: boolean;
  canManageSmtpAlerts: boolean;
  canExportReports: boolean;
  canAccessPromptLedger: boolean;
}

export interface EnrichedAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  companyName: string;
  teamId: string;
  teamName: string;
  tierCap: string;
  monthlyTokenQuota: number;
  monthlyTokensUsed: number;
  privileges: AdminPrivileges;
  status: 'active' | 'suspended';
  isCompanyAdmin: boolean;
}

const PRIVILEGE_DESCRIPTIONS: { key: keyof AdminPrivileges; label: string; description: string; icon: any }[] = [
  { 
    key: 'canConfigureBYOK', 
    label: 'BYOK Vault & Proxy Tunneling', 
    description: 'Add, update, or remove company API keys, session tokens, and local reverse proxy adapters.',
    icon: Key 
  },
  { 
    key: 'canSetSpendLimits', 
    label: 'Spend Limits & Quota Control', 
    description: 'Adjust monthly committed budgets ($ USD) and hard daily token caps across departments.',
    icon: DollarSign 
  },
  { 
    key: 'canInviteMembers', 
    label: 'User Provisioning & Seat Assignment', 
    description: 'Invite new engineers, reallocate seat licenses, and assign role caps.',
    icon: Users 
  },
  { 
    key: 'canOverrideRouting', 
    label: 'Routing & Model Overrides', 
    description: 'Bypass Thompson Sampling Pareto optimizer to force specific frontier models (Claude 3.7 / GPT-4.5).',
    icon: Cpu 
  },
  { 
    key: 'canViewAuditLogs', 
    label: 'Compliance & Audit Trail Access', 
    description: 'Inspect company-wide security access events, IP stamps, and administrative mutations.',
    icon: ShieldCheck 
  },
  { 
    key: 'canManageSmtpAlerts', 
    label: 'SMTP Quota & Security Alerts', 
    description: 'Subscribe or modify automated email alerts on 80% / 100% quota depletion.',
    icon: Mail 
  },
  { 
    key: 'canExportReports', 
    label: 'Billing & Telemetry CSV Export', 
    description: 'Download raw execution telemetry, cost avoidance reports, and financial invoices.',
    icon: FileText 
  },
  { 
    key: 'canAccessPromptLedger', 
    label: 'Context Ledger & Prompt History', 
    description: 'Inspect sanitized prompt inputs and model output artifacts across the team.',
    icon: Sliders 
  }
];

export const AdminPrivilegesPortal: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyFirestore[]>([]);
  const [teams, setTeams] = useState<TeamFirestore[]>([]);
  const [enrichedUsers, setEnrichedUsers] = useState<EnrichedAdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Active User being edited
  const [editingUser, setEditingUser] = useState<EnrichedAdminUser | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fetchCloudData = async () => {
    setIsLoading(true);
    try {
      const [comps, tms] = await Promise.all([
        loadCompaniesFromFirestore(),
        loadTeamsFromFirestore()
      ]);
      setCompanies(comps);
      setTeams(tms);

      // Build enriched users list
      const usersList: EnrichedAdminUser[] = [];

      tms.forEach(team => {
        const comp = comps.find(c => c.id === team.companyId);
        const compName = comp?.name || team.companyName || 'Enterprise';
        const billingEmail = comp?.billingEmail || '';
        
        (team.members || []).forEach(member => {
          const isLead = member.role.toLowerCase().includes('admin') || member.role.toLowerCase().includes('lead') || (billingEmail ? member.email === billingEmail : false);
          
          // Derive default privileges based on role if not stored
          const defaultPrivs: AdminPrivileges = (member as any).privileges || {
            canConfigureBYOK: isLead,
            canSetSpendLimits: isLead,
            canInviteMembers: isLead,
            canOverrideRouting: isLead,
            canViewAuditLogs: isLead,
            canManageSmtpAlerts: isLead,
            canExportReports: isLead,
            canAccessPromptLedger: true
          };

          usersList.push({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            companyId: team.companyId,
            companyName: compName,
            teamId: team.id,
            teamName: team.name,
            tierCap: member.tierCap || 'Frontier Tier 3',
            monthlyTokenQuota: member.monthlyTokenQuota || 10_000_000,
            monthlyTokensUsed: member.monthlyTokensUsed || 0,
            privileges: defaultPrivs,
            status: member.status === 'suspended' ? 'suspended' : 'active',
            isCompanyAdmin: isLead
          });
        });
      });

      setEnrichedUsers(usersList);
    } catch (err) {
      console.warn('Error loading admin privileges', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudData();
  }, []);

  // Filtered users
  const filteredUsers = enrichedUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.teamName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany = selectedCompanyFilter === 'all' || u.companyId === selectedCompanyFilter;
    const matchesRole = 
      roleFilter === 'all' || 
      (roleFilter === 'admin' && u.isCompanyAdmin) ||
      (roleFilter === 'member' && !u.isCompanyAdmin);

    return matchesSearch && matchesCompany && matchesRole;
  });

  // Apply Preset
  const applyPreset = (preset: 'super_admin' | 'finance_officer' | 'team_lead' | 'developer' | 'read_only') => {
    if (!editingUser) return;

    let newPrivs: AdminPrivileges;
    let newRole = editingUser.role;

    switch (preset) {
      case 'super_admin':
        newPrivs = {
          canConfigureBYOK: true,
          canSetSpendLimits: true,
          canInviteMembers: true,
          canOverrideRouting: true,
          canViewAuditLogs: true,
          canManageSmtpAlerts: true,
          canExportReports: true,
          canAccessPromptLedger: true
        };
        newRole = 'Company SuperAdmin / Executive';
        break;
      case 'finance_officer':
        newPrivs = {
          canConfigureBYOK: false,
          canSetSpendLimits: true,
          canInviteMembers: false,
          canOverrideRouting: false,
          canViewAuditLogs: true,
          canManageSmtpAlerts: true,
          canExportReports: true,
          canAccessPromptLedger: false
        };
        newRole = 'Finance & Compliance Officer';
        break;
      case 'team_lead':
        newPrivs = {
          canConfigureBYOK: true,
          canSetSpendLimits: false,
          canInviteMembers: true,
          canOverrideRouting: true,
          canViewAuditLogs: false,
          canManageSmtpAlerts: true,
          canExportReports: true,
          canAccessPromptLedger: true
        };
        newRole = 'Engineering Lead / Admin';
        break;
      case 'developer':
        newPrivs = {
          canConfigureBYOK: false,
          canSetSpendLimits: false,
          canInviteMembers: false,
          canOverrideRouting: true,
          canViewAuditLogs: false,
          canManageSmtpAlerts: false,
          canExportReports: false,
          canAccessPromptLedger: true
        };
        newRole = 'Senior AI Developer';
        break;
      case 'read_only':
        newPrivs = {
          canConfigureBYOK: false,
          canSetSpendLimits: false,
          canInviteMembers: false,
          canOverrideRouting: false,
          canViewAuditLogs: false,
          canManageSmtpAlerts: false,
          canExportReports: true,
          canAccessPromptLedger: false
        };
        newRole = 'Observer / Read-Only';
        break;
    }

    setEditingUser({
      ...editingUser,
      role: newRole,
      isCompanyAdmin: preset === 'super_admin' || preset === 'team_lead',
      privileges: newPrivs
    });
  };

  // Toggle single privilege
  const togglePrivilege = (key: keyof AdminPrivileges) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      privileges: {
        ...editingUser.privileges,
        [key]: !editingUser.privileges[key]
      }
    });
  };

  // Save changes to Firestore
  const handleSavePrivileges = async () => {
    if (!editingUser) return;
    setIsSaving(true);

    try {
      // Find the team
      const team = teams.find(t => t.id === editingUser.teamId);
      if (!team) throw new Error('Associated team not found');

      // Update members array
      const updatedMembers = (team.members || []).map(m => {
        if (m.id === editingUser.id) {
          return {
            ...m,
            role: editingUser.role,
            tierCap: editingUser.tierCap,
            monthlyTokenQuota: editingUser.monthlyTokenQuota,
            status: editingUser.status,
            privileges: editingUser.privileges
          };
        }
        return m;
      });

      const updatedTeam: TeamFirestore = {
        ...team,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      };

      await saveTeamToFirestore(updatedTeam);

      // Update local state
      setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
      setEnrichedUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));

      // Record Audit Log
      const adminEmail = auth.currentUser?.email || 'Admin Superuser';
      await recordAuditLogToFirestore(
        'Updated Admin Privileges & Role',
        'rbac_management',
        adminEmail,
        `Modified privileges & assigned role '${editingUser.role}' for ${editingUser.name} (${editingUser.email}) in '${editingUser.companyName}'.`
      );

      // Trigger SMTP Notice
      try {
        await fetch('/api/admin/smtp/send-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: editingUser.email,
            subject: `[WhyOr Dispatch AI] Security Privilege & Role Update: ${editingUser.role}`,
            templateType: 'admin_privilege_grant',
            customMessage: `Dear ${editingUser.name},\n\nYour administrator privileges on WhyOr Dispatch AI for ${editingUser.companyName} have been updated by Portal SuperAdmin (${adminEmail}).\n\nAssigned Role: ${editingUser.role}\nTier Allowance: ${editingUser.tierCap}\nActive Permissions: ${Object.entries(editingUser.privileges).filter(([_, v]) => v).map(([k]) => k).join(', ')}.`,
            sentBy: adminEmail
          })
        });
      } catch (mailErr) {
        console.warn('SMTP privilege notification notice:', mailErr);
      }

      setNotification({
        type: 'success',
        text: `Privilege matrix for '${editingUser.name}' saved and synced across cloud tenant.`
      });
      setEditingUser(null);
    } catch (err: any) {
      setNotification({ type: 'error', text: `Failed to update privileges: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-purple-950/40 to-slate-900/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold font-display text-white">Company Admins & RBAC Privilege Matrix</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
              SuperAdmin Authority
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Designate company administrators, assign granular executive privileges (BYOK configuration, spend limits, routing overrides, security audits), and enforce least-privilege tenant governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCloudData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Sync Privileges</span>
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
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white font-mono cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by admin name, email, company, or department..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer max-w-[200px]"
          >
            <option value="all">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins & Leads Only</option>
            <option value="member">Standard Members</option>
          </select>
        </div>
      </div>

      {/* ADMINS & PRIVILEGES TABLE */}
      <div className="bg-slate-900/70 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Admin / Member Name</th>
                <th className="py-3.5 px-4 font-semibold">Tenant & Team</th>
                <th className="py-3.5 px-4 font-semibold">Role & Access Tier</th>
                <th className="py-3.5 px-4 font-semibold">Active Privilege Matrix</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    No administrators or members match your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const privCount = Object.values(user.privileges).filter(Boolean).length;
                  const isFullAdmin = privCount >= 7;

                  return (
                    <tr key={`${user.teamId}_${user.id}`} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Name & Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold font-mono text-sm shrink-0 ${
                            user.isCompanyAdmin
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20'
                              : 'bg-slate-800 text-slate-300 border-white/10'
                          }`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.isCompanyAdmin && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company & Team */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-200">{user.companyName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{user.teamName}</span>
                        </div>
                      </td>

                      {/* Role & Access Tier */}
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          user.isCompanyAdmin
                            ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-slate-800 text-slate-300 border-white/10'
                        }`}>
                          {user.role}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1 font-mono">
                          Cap: {user.tierCap}
                        </div>
                      </td>

                      {/* Privilege Matrix Pills */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap items-center gap-1 max-w-sm">
                          {user.privileges.canConfigureBYOK && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-mono" title="BYOK Vault Access">
                              BYOK
                            </span>
                          )}
                          {user.privileges.canSetSpendLimits && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[9px] font-mono" title="Spend & Budget Cap Control">
                              Spend Limits
                            </span>
                          )}
                          {user.privileges.canInviteMembers && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[9px] font-mono" title="Seat & Member Provisioning">
                              User Invites
                            </span>
                          )}
                          {user.privileges.canOverrideRouting && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] font-mono" title="Model Routing Overrides">
                              Routing Overrides
                            </span>
                          )}
                          {user.privileges.canViewAuditLogs && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-mono" title="Security Audit Logs">
                              Audit Logs
                            </span>
                          )}
                          {user.privileges.canManageSmtpAlerts && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[9px] font-mono" title="SMTP Quota Alerts">
                              SMTP Alerts
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono ml-1">
                            ({privCount}/8 granted)
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setEditingUser({ ...user })}
                          className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-medium flex items-center gap-1.5 ml-auto transition-all cursor-pointer shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Configure Privileges</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT PRIVILEGES MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-base">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Privilege Matrix: {editingUser.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {editingUser.email} • {editingUser.companyName} ({editingUser.teamName})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets Strip */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Quick Role Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('super_admin')}
                  className="px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Company SuperAdmin</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('team_lead')}
                  className="px-3 py-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Engineering Lead</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('finance_officer')}
                  className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Finance & Budget</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('developer')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Senior Developer</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('read_only')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Observer / Read-Only</span>
                </button>
              </div>
            </div>

            {/* Custom Role Title & Tier Allowance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Executive Role</label>
                <input
                  type="text"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Max Accessible Model Tier</label>
                <select
                  value={editingUser.tierCap}
                  onChange={(e) => setEditingUser({ ...editingUser, tierCap: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Frontier Tier 3">Frontier Tier 3 (Reasoning & Frontier Coding)</option>
                  <option value="General Tier 2">General Tier 2 (High-Speed Production)</option>
                  <option value="Fast Tier 1">Fast Tier 1 (Ultra-Low Latency)</option>
                </select>
              </div>
            </div>

            {/* Granular Privilege Checkboxes */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Granular Security & Operational Privileges
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRIVILEGE_DESCRIPTIONS.map(({ key, label, description, icon: Icon }) => {
                  const isChecked = !!editingUser.privileges[key];

                  return (
                    <div
                      key={key}
                      onClick={() => togglePrivilege(key)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked 
                          ? 'bg-purple-950/30 border-purple-500/40 shadow-sm' 
                          : 'bg-slate-950/50 border-white/5 opacity-70 hover:opacity-100 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        isChecked 
                          ? 'bg-purple-600 border-purple-400 text-white' 
                          : 'border-white/20 bg-slate-900 text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                          <Icon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{label}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>SMTP email notice will be dispatched to {editingUser.email}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSavePrivileges}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Privilege Matrix</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
