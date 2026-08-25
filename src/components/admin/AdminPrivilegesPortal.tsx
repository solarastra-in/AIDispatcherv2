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
  Zap,
  Crown,
  Layers,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  SlidersHorizontal,
  Server,
  Network
} from 'lucide-react';
import { 
  CompanyFirestore, 
  TeamFirestore, 
  loadCompaniesFromFirestore, 
  loadTeamsFromFirestore, 
  saveCompanyToFirestore,
  saveTeamToFirestore,
  recordAuditLogToFirestore,
  logEmailToFirestore,
  CorporateAdminPrivileges,
  CompanyAdminUser,
  auth
} from '../../lib/firebase';

export interface AdminPrivileges {
  // Team Creation & Hierarchy Controls
  canCreateTeams?: boolean;
  maxTeamsAllowed?: number;
  canAssignTeamLeads?: boolean;
  canDeleteTeams?: boolean;
  canSetTeamBudgets?: boolean;
  allowedTeamTiers?: ('low' | 'mid' | 'high' | 'frontier' | 'deep_reasoning')[];

  // BYOK Management Controls
  canConfigureBYOK: boolean;
  canAddProviderKeys?: boolean;
  canDeleteProviderKeys?: boolean;
  canToggleSubscriptionFallback?: boolean;
  canEnforceTeamKeyInheritance?: boolean;
  allowedBYOKProviders?: string[];

  // Spend, Members, & Platform Governance
  canSetSpendLimits: boolean;
  maxBudgetAllocatedUsd?: number;
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
  isCorporateAdmin?: boolean;
}

const ALL_BYOK_PROVIDERS = [
  { id: 'google', name: 'Google Gemini', icon: '✨' },
  { id: 'openai', name: 'OpenAI GPT', icon: '⚡' },
  { id: 'anthropic', name: 'Anthropic Claude', icon: '🧠' },
  { id: 'deepseek', name: 'DeepSeek R1', icon: '🔬' },
  { id: 'groq', name: 'Groq LPUs', icon: '🚀' },
  { id: 'mistral', name: 'Mistral AI', icon: '🌐' }
];

const ALL_TIERS: ('low' | 'mid' | 'high' | 'frontier' | 'deep_reasoning')[] = [
  'low',
  'mid',
  'high',
  'frontier',
  'deep_reasoning'
];

export const AdminPrivilegesPortal: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyFirestore[]>([]);
  const [teams, setTeams] = useState<TeamFirestore[]>([]);
  const [enrichedUsers, setEnrichedUsers] = useState<EnrichedAdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [portalTab, setPortalTab] = useState<'hierarchy' | 'matrix' | 'policy_rules'>('hierarchy');

  // Hierarchy view interactive selection
  const [selectedHierarchyCompanyId, setSelectedHierarchyCompanyId] = useState<string>('');
  const [selectedHierarchyNode, setSelectedHierarchyNode] = useState<{
    type: 'super_admin' | 'corporate_admin' | 'team_lead' | 'member';
    id: string;
    name: string;
    email: string;
    details: any;
  } | null>(null);

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

      if (comps.length > 0 && !selectedHierarchyCompanyId) {
        setSelectedHierarchyCompanyId(comps[0].id);
      }

      // Build enriched users list
      const usersList: EnrichedAdminUser[] = [];

      // 1. Corporate Admins attached directly to companies
      comps.forEach(comp => {
        if (comp.companyAdmins && Array.isArray(comp.companyAdmins)) {
          comp.companyAdmins.forEach(ca => {
            usersList.push({
              id: ca.id,
              name: ca.name,
              email: ca.email,
              role: 'corporate_admin',
              companyId: comp.id,
              companyName: comp.name,
              teamId: 'corp-admin-level',
              teamName: 'Corporate Executive (All Teams)',
              tierCap: ca.tierCap || 'Frontier Tier 3',
              monthlyTokenQuota: ca.monthlyTokenQuota || comp.monthlyTokenQuota || 50_000_000,
              monthlyTokensUsed: ca.monthlyTokensUsed || 0,
              privileges: {
                canCreateTeams: ca.privileges?.canCreateTeams ?? true,
                maxTeamsAllowed: ca.privileges?.maxTeamsAllowed ?? 10,
                canAssignTeamLeads: ca.privileges?.canAssignTeamLeads ?? true,
                canDeleteTeams: ca.privileges?.canDeleteTeams ?? true,
                canSetTeamBudgets: ca.privileges?.canSetTeamBudgets ?? true,
                allowedTeamTiers: ca.privileges?.allowedTeamTiers ?? ['low', 'mid', 'high', 'frontier', 'deep_reasoning'],
                canConfigureBYOK: ca.privileges?.canManageBYOK ?? true,
                canAddProviderKeys: ca.privileges?.canAddProviderKeys ?? true,
                canDeleteProviderKeys: ca.privileges?.canDeleteProviderKeys ?? true,
                canToggleSubscriptionFallback: ca.privileges?.canToggleSubscriptionFallback ?? true,
                canEnforceTeamKeyInheritance: ca.privileges?.canEnforceTeamKeyInheritance ?? true,
                allowedBYOKProviders: ca.privileges?.allowedBYOKProviders ?? ['google', 'openai', 'anthropic', 'deepseek', 'groq', 'mistral'],
                canSetSpendLimits: ca.privileges?.canManageBudgets ?? true,
                maxBudgetAllocatedUsd: ca.privileges?.maxBudgetAllocatedUsd ?? 5000,
                canInviteMembers: ca.privileges?.canInviteMembers ?? true,
                canOverrideRouting: ca.privileges?.canConfigureRouting ?? true,
                canViewAuditLogs: ca.privileges?.canViewTelemetry ?? true,
                canManageSmtpAlerts: ca.privileges?.canManageSmtpAlerts ?? true,
                canExportReports: true,
                canAccessPromptLedger: true,
              },
              status: ca.status === 'suspended' ? 'suspended' : 'active',
              isCompanyAdmin: true,
              isCorporateAdmin: true,
            });
          });
        }
      });

      // 2. Team members and team leads
      tms.forEach(team => {
        const comp = comps.find(c => c.id === team.companyId);
        const compName = comp?.name || team.companyName || 'Enterprise';
        const billingEmail = comp?.billingEmail || '';
        
        (team.members || []).forEach(member => {
          // Avoid duplicate entries if corp admin already listed
          if (usersList.some(u => u.email.toLowerCase() === member.email.toLowerCase() && u.companyId === team.companyId)) {
            return;
          }
          const isLead = member.role.toLowerCase().includes('admin') || member.role.toLowerCase().includes('lead') || (billingEmail ? member.email === billingEmail : false);
          
          const rawPrivs: any = (member as any).privileges || {};
          const defaultPrivs: AdminPrivileges = {
            canCreateTeams: false,
            maxTeamsAllowed: 0,
            canAssignTeamLeads: false,
            canDeleteTeams: false,
            canSetTeamBudgets: false,
            allowedTeamTiers: ['low', 'mid', 'high'],
            canConfigureBYOK: rawPrivs.canConfigureBYOK ?? isLead,
            canAddProviderKeys: rawPrivs.canAddProviderKeys ?? isLead,
            canDeleteProviderKeys: rawPrivs.canDeleteProviderKeys ?? isLead,
            canToggleSubscriptionFallback: rawPrivs.canToggleSubscriptionFallback ?? isLead,
            canEnforceTeamKeyInheritance: rawPrivs.canEnforceTeamKeyInheritance ?? false,
            allowedBYOKProviders: rawPrivs.allowedBYOKProviders ?? ['google', 'openai', 'anthropic'],
            canSetSpendLimits: rawPrivs.canSetSpendLimits ?? isLead,
            maxBudgetAllocatedUsd: rawPrivs.maxBudgetAllocatedUsd ?? 1000,
            canInviteMembers: rawPrivs.canInviteMembers ?? isLead,
            canOverrideRouting: rawPrivs.canOverrideRouting ?? isLead,
            canViewAuditLogs: rawPrivs.canViewAuditLogs ?? isLead,
            canManageSmtpAlerts: rawPrivs.canManageSmtpAlerts ?? isLead,
            canExportReports: rawPrivs.canExportReports ?? isLead,
            canAccessPromptLedger: rawPrivs.canAccessPromptLedger ?? true,
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
            isCompanyAdmin: isLead,
            isCorporateAdmin: false,
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
      (roleFilter === 'admin' && (u.isCompanyAdmin || u.isCorporateAdmin)) ||
      (roleFilter === 'member' && !u.isCompanyAdmin && !u.isCorporateAdmin);

    return matchesSearch && matchesCompany && matchesRole;
  });

  // Apply Preset
  const applyPreset = (preset: 'super_admin' | 'corporate_admin' | 'finance_officer' | 'team_lead' | 'developer' | 'read_only') => {
    if (!editingUser) return;

    let newPrivs: AdminPrivileges;
    let newRole = editingUser.role;

    switch (preset) {
      case 'super_admin':
        newPrivs = {
          canCreateTeams: true,
          maxTeamsAllowed: 50,
          canAssignTeamLeads: true,
          canDeleteTeams: true,
          canSetTeamBudgets: true,
          allowedTeamTiers: ['low', 'mid', 'high', 'frontier', 'deep_reasoning'],
          canConfigureBYOK: true,
          canAddProviderKeys: true,
          canDeleteProviderKeys: true,
          canToggleSubscriptionFallback: true,
          canEnforceTeamKeyInheritance: true,
          allowedBYOKProviders: ['google', 'openai', 'anthropic', 'deepseek', 'groq', 'mistral'],
          canSetSpendLimits: true,
          maxBudgetAllocatedUsd: 10000,
          canInviteMembers: true,
          canOverrideRouting: true,
          canViewAuditLogs: true,
          canManageSmtpAlerts: true,
          canExportReports: true,
          canAccessPromptLedger: true
        };
        newRole = 'Company SuperAdmin / Executive';
        break;

      case 'corporate_admin':
        newPrivs = {
          canCreateTeams: true,
          maxTeamsAllowed: 10,
          canAssignTeamLeads: true,
          canDeleteTeams: true,
          canSetTeamBudgets: true,
          allowedTeamTiers: ['low', 'mid', 'high', 'frontier', 'deep_reasoning'],
          canConfigureBYOK: true,
          canAddProviderKeys: true,
          canDeleteProviderKeys: true,
          canToggleSubscriptionFallback: true,
          canEnforceTeamKeyInheritance: true,
          allowedBYOKProviders: ['google', 'openai', 'anthropic', 'deepseek', 'groq', 'mistral'],
          canSetSpendLimits: true,
          maxBudgetAllocatedUsd: 5000,
          canInviteMembers: true,
          canOverrideRouting: true,
          canViewAuditLogs: true,
          canManageSmtpAlerts: true,
          canExportReports: true,
          canAccessPromptLedger: true
        };
        newRole = 'Corporate Administrator';
        break;

      case 'finance_officer':
        newPrivs = {
          canCreateTeams: false,
          maxTeamsAllowed: 0,
          canAssignTeamLeads: false,
          canDeleteTeams: false,
          canSetTeamBudgets: true,
          allowedTeamTiers: ['low', 'mid', 'high'],
          canConfigureBYOK: false,
          canAddProviderKeys: false,
          canDeleteProviderKeys: false,
          canToggleSubscriptionFallback: false,
          canEnforceTeamKeyInheritance: false,
          allowedBYOKProviders: [],
          canSetSpendLimits: true,
          maxBudgetAllocatedUsd: 5000,
          canInviteMembers: false,
          canOverrideRouting: false,
          canViewAuditLogs: true,
          canManageSmtpAlerts: true,
          canExportReports: true,
          canAccessPromptLedger: false
        };
        newRole = 'Finance & Budget Controller';
        break;

      case 'team_lead':
        newPrivs = {
          canCreateTeams: false,
          maxTeamsAllowed: 0,
          canAssignTeamLeads: false,
          canDeleteTeams: false,
          canSetTeamBudgets: false,
          allowedTeamTiers: ['low', 'mid', 'high', 'frontier'],
          canConfigureBYOK: true,
          canAddProviderKeys: true,
          canDeleteProviderKeys: false,
          canToggleSubscriptionFallback: true,
          canEnforceTeamKeyInheritance: false,
          allowedBYOKProviders: ['google', 'openai', 'anthropic'],
          canSetSpendLimits: false,
          maxBudgetAllocatedUsd: 1500,
          canInviteMembers: true,
          canOverrideRouting: true,
          canViewAuditLogs: false,
          canManageSmtpAlerts: true,
          canExportReports: true,
          canAccessPromptLedger: true
        };
        newRole = 'Engineering Lead / Team Admin';
        break;

      case 'developer':
        newPrivs = {
          canCreateTeams: false,
          maxTeamsAllowed: 0,
          canAssignTeamLeads: false,
          canDeleteTeams: false,
          canSetTeamBudgets: false,
          allowedTeamTiers: ['low', 'mid', 'high'],
          canConfigureBYOK: false,
          canAddProviderKeys: false,
          canDeleteProviderKeys: false,
          canToggleSubscriptionFallback: false,
          canEnforceTeamKeyInheritance: false,
          allowedBYOKProviders: [],
          canSetSpendLimits: false,
          maxBudgetAllocatedUsd: 250,
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
          canCreateTeams: false,
          maxTeamsAllowed: 0,
          canAssignTeamLeads: false,
          canDeleteTeams: false,
          canSetTeamBudgets: false,
          allowedTeamTiers: ['low'],
          canConfigureBYOK: false,
          canAddProviderKeys: false,
          canDeleteProviderKeys: false,
          canToggleSubscriptionFallback: false,
          canEnforceTeamKeyInheritance: false,
          allowedBYOKProviders: [],
          canSetSpendLimits: false,
          maxBudgetAllocatedUsd: 0,
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
      isCompanyAdmin: preset === 'super_admin' || preset === 'corporate_admin' || preset === 'team_lead',
      isCorporateAdmin: preset === 'corporate_admin',
      privileges: newPrivs
    });
  };

  // Toggle single boolean privilege
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

  // Toggle BYOK Provider
  const toggleBYOKProvider = (providerId: string) => {
    if (!editingUser) return;
    const current = editingUser.privileges.allowedBYOKProviders || [];
    const exists = current.includes(providerId);
    const updated = exists ? current.filter(p => p !== providerId) : [...current, providerId];
    setEditingUser({
      ...editingUser,
      privileges: {
        ...editingUser.privileges,
        allowedBYOKProviders: updated
      }
    });
  };

  // Toggle Allowed Tier
  const toggleAllowedTier = (tier: 'low' | 'mid' | 'high' | 'frontier' | 'deep_reasoning') => {
    if (!editingUser) return;
    const current = editingUser.privileges.allowedTeamTiers || [];
    const exists = current.includes(tier);
    const updated = exists ? current.filter(t => t !== tier) : [...current, tier];
    setEditingUser({
      ...editingUser,
      privileges: {
        ...editingUser.privileges,
        allowedTeamTiers: updated
      }
    });
  };

  // Save changes to Firestore
  const handleSavePrivileges = async () => {
    if (!editingUser) return;
    setIsSaving(true);

    try {
      const adminEmail = auth.currentUser?.email || 'solarastra.in@gmail.com';

      // 1. Check if user is a Corporate Admin on CompanyFirestore
      if (editingUser.isCorporateAdmin || editingUser.teamId === 'corp-admin-level') {
        const comp = companies.find(c => c.id === editingUser.companyId);
        if (!comp) throw new Error('Company tenant not found');

        const corpPrivs: CorporateAdminPrivileges = {
          canCreateTeams: editingUser.privileges.canCreateTeams ?? true,
          maxTeamsAllowed: editingUser.privileges.maxTeamsAllowed ?? 10,
          canAssignTeamLeads: editingUser.privileges.canAssignTeamLeads ?? true,
          canDeleteTeams: editingUser.privileges.canDeleteTeams ?? true,
          canSetTeamBudgets: editingUser.privileges.canSetTeamBudgets ?? true,
          allowedTeamTiers: editingUser.privileges.allowedTeamTiers ?? ['low', 'mid', 'high', 'frontier', 'deep_reasoning'],
          canManageBYOK: editingUser.privileges.canConfigureBYOK ?? true,
          canAddProviderKeys: editingUser.privileges.canAddProviderKeys ?? true,
          canDeleteProviderKeys: editingUser.privileges.canDeleteProviderKeys ?? true,
          canToggleSubscriptionFallback: editingUser.privileges.canToggleSubscriptionFallback ?? true,
          canEnforceTeamKeyInheritance: editingUser.privileges.canEnforceTeamKeyInheritance ?? true,
          allowedBYOKProviders: editingUser.privileges.allowedBYOKProviders ?? ['google', 'openai', 'anthropic', 'deepseek', 'groq', 'mistral'],
          canManageBudgets: editingUser.privileges.canSetSpendLimits ?? true,
          maxBudgetAllocatedUsd: editingUser.privileges.maxBudgetAllocatedUsd ?? 5000,
          canInviteMembers: editingUser.privileges.canInviteMembers ?? true,
          canConfigureRouting: editingUser.privileges.canOverrideRouting ?? true,
          canViewTelemetry: editingUser.privileges.canViewAuditLogs ?? true,
          canManageSmtpAlerts: editingUser.privileges.canManageSmtpAlerts ?? true,
          canManageCompanyProfile: true,
        };

        const existingAdmins = comp.companyAdmins || [];
        const updatedAdmins: CompanyAdminUser[] = existingAdmins.map(a => {
          if (a.id === editingUser.id || a.email.toLowerCase() === editingUser.email.toLowerCase()) {
            return {
              ...a,
              title: editingUser.role,
              tierCap: editingUser.tierCap,
              monthlyTokenQuota: editingUser.monthlyTokenQuota,
              status: editingUser.status,
              privileges: corpPrivs,
              lastActiveAt: new Date().toISOString()
            };
          }
          return a;
        });

        const updatedCompany: CompanyFirestore = {
          ...comp,
          companyAdmins: updatedAdmins,
          updatedAt: new Date().toISOString()
        };

        await saveCompanyToFirestore(updatedCompany);
        setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
      } else {
        // 2. Otherwise user is a member on TeamFirestore
        const team = teams.find(t => t.id === editingUser.teamId);
        if (!team) throw new Error('Associated team not found');

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
        setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
      }

      setEnrichedUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));

      // Record Audit Log
      await recordAuditLogToFirestore(
        'Updated Tiered Admin Privileges',
        'rbac_management',
        adminEmail,
        `Modified granular privileges & assigned role '${editingUser.role}' for ${editingUser.name} (${editingUser.email}) in '${editingUser.companyName}'.`
      );

      // Trigger SMTP Notice
      try {
        await fetch('/api/admin/smtp/send-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: editingUser.email,
            subject: `[WhyOr Dispatch AI] Security Privilege & Delegated Authority Update: ${editingUser.role}`,
            templateType: 'admin_privilege_grant',
            customMessage: `Dear ${editingUser.name},\n\nYour administrator privileges on WhyOr Dispatch AI for ${editingUser.companyName} have been updated by Portal SuperAdmin (${adminEmail}).\n\nAssigned Role: ${editingUser.role}\nTier Allowance: ${editingUser.tierCap}\nTeam Creation: ${editingUser.privileges.canCreateTeams ? 'Allowed (Max ' + (editingUser.privileges.maxTeamsAllowed || 'unlimited') + ')' : 'Restricted'}\nBYOK Management: ${editingUser.privileges.canConfigureBYOK ? 'Active (' + (editingUser.privileges.allowedBYOKProviders?.join(', ') || 'All') + ')' : 'Restricted'}.`,
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

  const selectedCompanyObj = companies.find(c => c.id === selectedHierarchyCompanyId) || companies[0];
  const selectedCompanyTeams = teams.filter(t => t.companyId === selectedCompanyObj?.id);
  const selectedCompanyAdmins = selectedCompanyObj?.companyAdmins || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-purple-950/40 to-slate-900/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold font-display text-white">Tiered Administrative Hierarchy & RBAC Governance</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
              SuperAdmin Authority
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            Super Admins define corporate-level admins with granular authority over team creation, BYOK credential management, departmental spend limits, and multi-tier model availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCloudData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Sync Hierarchy</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setPortalTab('hierarchy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
            portalTab === 'hierarchy'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400'
              : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tiered Organizational Hierarchy</span>
        </button>

        <button
          onClick={() => setPortalTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
            portalTab === 'matrix'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400'
              : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>RBAC Privileges Matrix</span>
        </button>

        <button
          onClick={() => setPortalTab('policy_rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
            portalTab === 'policy_rules'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400'
              : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Delegation Rules & Boundaries</span>
        </button>
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

      {/* ==================== TAB 1: TIERED ORGANIZATIONAL HIERARCHY ==================== */}
      {portalTab === 'hierarchy' && (
        <div className="space-y-6">
          {/* Tenant Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Select Company Hierarchy Scope:
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {companies.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedHierarchyCompanyId(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    selectedHierarchyCompanyId === c.id
                      ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Visual 4-Tier Hierarchy Diagram */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-8 shadow-2xl relative overflow-hidden">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[radial-gradient(#9333ea15_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

            {/* LEVEL 1: SUPER ADMIN */}
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold uppercase">
                  Tier 1: Master Platform SuperAdmin
                </span>
                <span className="text-xs text-slate-400">Full tenant provisioning, global routing & master authority</span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border border-amber-500/40 shadow-lg shadow-amber-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
                    <Crown className="w-6 h-6 text-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">Solar Astra SuperAdmin</h3>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        ROOT GOVERNANCE
                      </span>
                    </div>
                    <div className="text-xs font-mono text-purple-300">
                      solarastra.in@gmail.com
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Controls all tenants • Designates Corporate Admins • Grants Granular Privileges
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-amber-500/30 text-amber-300">
                    👑 Appoint Corporate Admins
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-purple-500/30 text-purple-300">
                    🏢 Onboard Tenants
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-cyan-500/30 text-cyan-300">
                    🌐 Global SMTP & Vault
                  </span>
                </div>
              </div>
            </div>

            {/* Downward Connector Arrow */}
            <div className="flex justify-center -my-4 relative z-10">
              <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500/60 to-purple-500/60" />
            </div>

            {/* LEVEL 2: CORPORATE LEVEL ADMINS */}
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-mono font-bold uppercase">
                    Tier 2: Delegated Corporate Admins ({selectedCompanyObj?.name || 'Selected Tenant'})
                  </span>
                  <span className="text-xs text-slate-400">Granular Team Creation & BYOK Provider Management</span>
                </div>
                <span className="text-xs font-mono text-purple-300">
                  {selectedCompanyAdmins.length} Appointed Executive{selectedCompanyAdmins.length === 1 ? '' : 's'}
                </span>
              </div>

              {selectedCompanyAdmins.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-dashed border-purple-500/30 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    No Corporate Admin appointed for <strong className="text-white">{selectedCompanyObj?.name}</strong> yet.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    SuperAdmins can assign specific corporate-level admins from the Onboarding tab or RBAC Matrix.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCompanyAdmins.map(admin => {
                    const enriched = enrichedUsers.find(u => u.id === admin.id || u.email.toLowerCase() === admin.email.toLowerCase());
                    return (
                      <div
                        key={admin.id}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/40 hover:border-purple-400 transition-all space-y-3 relative shadow-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-400/40 flex items-center justify-center font-bold text-sm text-purple-200">
                              {admin.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                <span>{admin.name}</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  CORP ADMIN
                                </span>
                              </div>
                              <div className="text-xs font-mono text-purple-300">{admin.email}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{admin.title || 'Director of AI Engineering'}</div>
                            </div>
                          </div>

                          <button
                            onClick={() => enriched && setEditingUser({ ...enriched })}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                            title="Edit Delegated Privileges"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Granular Scope Summary */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 space-y-1.5 text-[11px]">
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Users className="w-3 h-3 text-indigo-400" /> Team Creation Authority:
                            </span>
                            <span className="font-mono font-bold text-emerald-400">
                              {admin.privileges?.canCreateTeams ? `Allowed (Max ${admin.privileges?.maxTeamsAllowed || 10} teams)` : 'Restricted'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Key className="w-3 h-3 text-amber-400" /> BYOK Management:
                            </span>
                            <span className="font-mono font-bold text-amber-300">
                              {admin.privileges?.canManageBYOK ? 'Active Provider Vault' : 'Inherited Only'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-300">
                            <span className="text-slate-400 flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-emerald-400" /> Max Budget Allocation:
                            </span>
                            <span className="font-mono font-bold text-purple-300">
                              ${(admin.privileges?.maxBudgetAllocatedUsd || 5000).toLocaleString()} USD
                            </span>
                          </div>
                        </div>

                        {/* Active BYOK Provider Chips */}
                        <div className="flex flex-wrap gap-1">
                          {(admin.privileges?.allowedBYOKProviders || ['google', 'openai', 'anthropic']).map(prov => (
                            <span key={prov} className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-[9px] font-mono text-slate-300">
                              ✓ {prov.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Downward Connector Arrow */}
            <div className="flex justify-center -my-4 relative z-10">
              <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500/60 to-indigo-500/60" />
            </div>

            {/* LEVEL 3: DEPARTMENTAL TEAMS & TEAM LEADS */}
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-mono font-bold uppercase">
                    Tier 3: Departmental Teams & Assigned Team Leads
                  </span>
                  <span className="text-xs text-slate-400">Created by Corporate Admin / SuperAdmin</span>
                </div>
                <span className="text-xs font-mono text-indigo-300">
                  {selectedCompanyTeams.length} Active Team{selectedCompanyTeams.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedCompanyTeams.map(team => (
                  <div
                    key={team.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-indigo-500/30 hover:border-indigo-400 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{team.name}</h4>
                        <div className="text-[11px] font-mono text-indigo-300">
                          Lead: {team.leadEmail || 'Assigned Lead'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                        {team.members?.length || 0} Members
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                      <div>Tier Cap: <span className="text-slate-200">{team.tierCap || 'Frontier Tier 3'}</span></div>
                      <div>Allocated Quota: <span className="text-purple-300">{((team.monthlyTokenQuota || 10_000_000)/1_000_000).toFixed(0)}M tokens/mo</span></div>
                    </div>

                    {/* Team Members Strip */}
                    <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1">
                      {(team.members || []).slice(0, 3).map(m => (
                        <span key={m.id} className="px-1.5 py-0.5 rounded bg-slate-900 text-[9px] text-slate-300 font-mono">
                          {m.name.split(' ')[0]}
                        </span>
                      ))}
                      {(team.members?.length || 0) > 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-[9px] text-slate-400 font-mono">
                          +{((team.members?.length || 0) - 3)} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Downward Connector Arrow */}
            <div className="flex justify-center -my-4 relative z-10">
              <div className="w-0.5 h-6 bg-gradient-to-b from-indigo-500/60 to-cyan-500/60" />
            </div>

            {/* LEVEL 4: DEVELOPERS & ENGINEERS */}
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono font-bold uppercase">
                  Tier 4: Individual Engineers & End Users
                </span>
                <span className="text-xs text-slate-400">Scoped dispatch execution, corroboration loops, and prompt ledger tools</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-400">
                  Engineers inherit approved model catalogs, BYOK provider vaults, and hard spending limits configured by their designated Corporate Admin.
                </span>
                <span className="font-mono text-cyan-300 text-[11px]">
                  Governed under Least-Privilege Role Boundaries
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: RBAC PRIVILEGES MATRIX TABLE ==================== */}
      {portalTab === 'matrix' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by admin name, email, company, or team role..."
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
                <option value="admin">Corporate & Team Admins</option>
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
                    <th className="py-3.5 px-4 font-semibold">User & Identity</th>
                    <th className="py-3.5 px-4 font-semibold">Tenant & Hierarchy Level</th>
                    <th className="py-3.5 px-4 font-semibold">Role & Access Tier</th>
                    <th className="py-3.5 px-4 font-semibold">Delegated Privileges</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Configure</th>
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
                      return (
                        <tr key={`${user.teamId}_${user.id}`} className="hover:bg-white/[0.02] transition-colors group">
                          {/* Name & Email */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold font-mono text-sm shrink-0 ${
                                user.isCorporateAdmin
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                                  : user.isCompanyAdmin
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : 'bg-slate-800 text-slate-300 border-white/10'
                              }`}>
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {user.isCorporateAdmin && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      CORP ADMIN
                                    </span>
                                  )}
                                  {!user.isCorporateAdmin && user.isCompanyAdmin && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      LEAD
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
                              user.isCorporateAdmin
                                ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border-amber-500/40'
                                : user.isCompanyAdmin
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
                              {user.privileges.canCreateTeams && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-mono" title="Team Creation Allowed">
                                  Create Teams (Max {user.privileges.maxTeamsAllowed || '∞'})
                                </span>
                              )}
                              {user.privileges.canConfigureBYOK && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-mono" title="BYOK Vault Access">
                                  BYOK Vault
                                </span>
                              )}
                              {user.privileges.canSetSpendLimits && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[9px] font-mono" title="Spend & Budget Cap Control">
                                  Spend Limits (${user.privileges.maxBudgetAllocatedUsd || 1000})
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
        </div>
      )}

      {/* ==================== TAB 3: DELEGATION RULES & BOUNDARIES ==================== */}
      {portalTab === 'policy_rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Team Creation & Hierarchy Boundaries</h3>
                <p className="text-xs text-slate-400">Rules governing corporate admin sub-team provisioning</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Max Teams Enforcement
                </div>
                <p className="text-[11px] text-slate-400">
                  Corporate Admins cannot create more teams than the ceiling configured by SuperAdmin in their <code className="text-purple-300">maxTeamsAllowed</code> quota.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Tier Ceiling Inheritance
                </div>
                <p className="text-[11px] text-slate-400">
                  Teams created by a Corporate Admin inherit allowed model tiers clamped to <code className="text-purple-300">allowedTeamTiers</code>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Deletion & Lead Reassignment
                </div>
                <p className="text-[11px] text-slate-400">
                  Corporate Admins can only delete teams or reassign leads if explicitly permitted via delegated privilege toggles.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">BYOK & Provider Key Governance</h3>
                <p className="text-xs text-slate-400">Rules governing provider credential storage & subscription fallback</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Provider Allowlist Filtering
                </div>
                <p className="text-[11px] text-slate-400">
                  Corporate Admins can only configure API keys for providers included in their <code className="text-amber-300">allowedBYOKProviders</code> list.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Subscription Fallback Control
                </div>
                <p className="text-[11px] text-slate-400">
                  When a provider API key reaches quota or error limits, automatic fallback to Google One / Flat-rate AI subscriptions can be toggled.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Sub-Team Key Inheritance
                </div>
                <p className="text-[11px] text-slate-400">
                  Enforces corporate-level key inheritance so all departmental sub-teams route securely through the verified corporate credential pool.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT PRIVILEGES MODAL ==================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-base">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Configure Delegated Privileges: {editingUser.name}
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
                Administrative Role Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('corporate_admin')}
                  className="px-3 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Corporate Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('team_lead')}
                  className="px-3 py-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Team Lead</span>
                </button>

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
                <label className="block text-slate-300 font-medium mb-1">Assigned Executive Role Title</label>
                <input
                  type="text"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Max Accessible Model Tier Cap</label>
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

            {/* SECTION 1: TEAM CREATION & HIERARCHY PRIVILEGES */}
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Team Creation & Hierarchy Controls
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={editingUser.privileges.canCreateTeams}
                    onChange={() => togglePrivilege('canCreateTeams')}
                    className="w-4 h-4 accent-indigo-500 rounded"
                  />
                  <span className="font-semibold text-indigo-300">Can Create & Manage Teams</span>
                </label>
              </div>

              {editingUser.privileges.canCreateTeams && (
                <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Max Teams Allowed: <span className="text-indigo-300 font-bold font-mono">{editingUser.privileges.maxTeamsAllowed || 10}</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={30}
                        step={1}
                        value={editingUser.privileges.maxTeamsAllowed || 10}
                        onChange={(e) => setEditingUser({
                          ...editingUser,
                          privileges: {
                            ...editingUser.privileges,
                            maxTeamsAllowed: Number(e.target.value)
                          }
                        })}
                        className="w-full accent-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-2 justify-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingUser.privileges.canAssignTeamLeads}
                          onChange={() => togglePrivilege('canAssignTeamLeads')}
                          className="w-3.5 h-3.5 accent-indigo-500 rounded"
                        />
                        <span className="text-slate-300">Can Assign & Reassign Team Leads</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingUser.privileges.canDeleteTeams}
                          onChange={() => togglePrivilege('canDeleteTeams')}
                          className="w-3.5 h-3.5 accent-indigo-500 rounded"
                        />
                        <span className="text-slate-300">Can Delete Teams</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-mono">
                      Permitted Team Tier Ceilings:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_TIERS.map(tier => {
                        const isAllowed = (editingUser.privileges.allowedTeamTiers || []).includes(tier);
                        return (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => toggleAllowedTier(tier)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                              isAllowed
                                ? 'bg-indigo-600/30 text-indigo-200 border-indigo-400/50'
                                : 'bg-slate-900 text-slate-500 border-white/5 hover:border-white/10'
                            }`}
                          >
                            {isAllowed ? '✓ ' : '+ '}{tier.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: BYOK MANAGEMENT CONTROLS */}
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    BYOK & Provider Key Management
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={editingUser.privileges.canConfigureBYOK}
                    onChange={() => togglePrivilege('canConfigureBYOK')}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span className="font-semibold text-amber-300">Can Manage BYOK Vault</span>
                </label>
              </div>

              {editingUser.privileges.canConfigureBYOK && (
                <div className="space-y-3 pt-2 border-t border-white/5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950/60 border border-white/5">
                      <input
                        type="checkbox"
                        checked={editingUser.privileges.canAddProviderKeys}
                        onChange={() => togglePrivilege('canAddProviderKeys')}
                        className="w-3.5 h-3.5 accent-amber-500 rounded"
                      />
                      <span className="text-slate-300 text-[11px]">Can Add API Keys</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950/60 border border-white/5">
                      <input
                        type="checkbox"
                        checked={editingUser.privileges.canDeleteProviderKeys}
                        onChange={() => togglePrivilege('canDeleteProviderKeys')}
                        className="w-3.5 h-3.5 accent-amber-500 rounded"
                      />
                      <span className="text-slate-300 text-[11px]">Can Delete Keys</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950/60 border border-white/5">
                      <input
                        type="checkbox"
                        checked={editingUser.privileges.canToggleSubscriptionFallback}
                        onChange={() => togglePrivilege('canToggleSubscriptionFallback')}
                        className="w-3.5 h-3.5 accent-amber-500 rounded"
                      />
                      <span className="text-slate-300 text-[11px]">Subscription Fallback</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1.5 font-mono">
                      Permitted BYOK AI Providers:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_BYOK_PROVIDERS.map(prov => {
                        const isPermitted = (editingUser.privileges.allowedBYOKProviders || []).includes(prov.id);
                        return (
                          <button
                            key={prov.id}
                            type="button"
                            onClick={() => toggleBYOKProvider(prov.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isPermitted
                                ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 shadow-sm'
                                : 'bg-slate-950 text-slate-500 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <span>{prov.icon}</span>
                            <span>{prov.name}</span>
                            {isPermitted && <Check className="w-3 h-3 text-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: SPENDING LIMITS & PLATFORM GOVERNANCE */}
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white uppercase font-mono tracking-wider">
                  Budgets, Member Invites & Governance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.privileges.canSetSpendLimits}
                    onChange={() => togglePrivilege('canSetSpendLimits')}
                    className="w-4 h-4 accent-purple-500 rounded"
                  />
                  <div>
                    <div className="font-semibold text-white">Can Manage Budgets & Spend Caps</div>
                    <div className="text-[10px] text-slate-400">Allocate departmental quotas</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.privileges.canInviteMembers}
                    onChange={() => togglePrivilege('canInviteMembers')}
                    className="w-4 h-4 accent-purple-500 rounded"
                  />
                  <div>
                    <div className="font-semibold text-white">Can Invite Engineers & Members</div>
                    <div className="text-[10px] text-slate-400">Provision seats & assign roles</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.privileges.canOverrideRouting}
                    onChange={() => togglePrivilege('canOverrideRouting')}
                    className="w-4 h-4 accent-purple-500 rounded"
                  />
                  <div>
                    <div className="font-semibold text-white">Can Configure Model Routing</div>
                    <div className="text-[10px] text-slate-400">Override Pareto Thompson Sampling</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.privileges.canViewAuditLogs}
                    onChange={() => togglePrivilege('canViewAuditLogs')}
                    className="w-4 h-4 accent-purple-500 rounded"
                  />
                  <div>
                    <div className="font-semibold text-white">Can View Live Telemetry & Audit Logs</div>
                    <div className="text-[10px] text-slate-400">Inspect security events & usage</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>SMTP email notification will be dispatched to {editingUser.email}</span>
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
