import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Download, 
  Users, 
  Cpu, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  Mail, 
  Plus, 
  RefreshCw, 
  Sliders, 
  ArrowUpRight, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  KeyRound,
  Lock,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import { 
  CompanyFirestore, 
  TeamFirestore,
  loadCompaniesFromFirestore, 
  saveCompanyToFirestore, 
  deleteCompanyFromFirestore,
  loadTeamsFromFirestore,
  recordAuditLogToFirestore,
  logEmailToFirestore,
  auth
} from '../../lib/firebase';

interface AdminCustomersPortalProps {
  onNavigateTab: (tab: string) => void;
  onSelectCompanyForOnboarding?: (companyId: string) => void;
}

export const AdminCustomersPortal: React.FC<AdminCustomersPortalProps> = ({ 
  onNavigateTab,
  onSelectCompanyForOnboarding
}) => {
  const [companies, setCompanies] = useState<CompanyFirestore[]>([]);
  const [teams, setTeams] = useState<TeamFirestore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Selected Company Modal & Editing
  const [editingCompany, setEditingCompany] = useState<CompanyFirestore | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [activeDetailsCompany, setActiveDetailsCompany] = useState<CompanyFirestore | null>(null);

  // Quick Action Email Dispatch
  const [isSendingAlert, setIsSendingAlert] = useState<boolean>(false);

  const fetchCloudData = async () => {
    setIsLoading(true);
    try {
      const [comps, tms] = await Promise.all([
        loadCompaniesFromFirestore(),
        loadTeamsFromFirestore()
      ]);
      setCompanies(comps);
      setTeams(tms);
    } catch (err) {
      console.warn('Error loading customers in admin portal', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudData();
  }, []);

  // Filtered companies
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.billingEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.industry && c.industry.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesTier && matchesStatus;
  });

  // Calculate high-level aggregates
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const totalMonthlyTokensAllocated = companies.reduce((acc, c) => acc + (c.monthlyTokenQuota || 0), 0);
  const totalMonthlyTokensConsumed = companies.reduce((acc, c) => acc + (c.monthlyTokensUsed || 0), 0);
  const totalMonthlyBudget = companies.reduce((acc, c) => acc + (c.monthlyBudgetUsd || 0), 0);

  // Toggle company status (Active / Suspended)
  const handleToggleStatus = async (company: CompanyFirestore) => {
    const newStatus = company.status === 'active' ? 'suspended' : 'active';
    const actionLabel = newStatus === 'active' ? 'Re-activated' : 'Suspended';
    
    if (!confirm(`Are you sure you want to ${actionLabel.toLowerCase()} account access for '${company.name}'?`)) {
      return;
    }

    const updated: CompanyFirestore = {
      ...company,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveCompanyToFirestore(updated);
      setCompanies(prev => prev.map(c => c.id === company.id ? updated : c));
      
      const adminEmail = auth.currentUser?.email || 'Admin Superuser';
      await recordAuditLogToFirestore(
        `${actionLabel} Tenant Account`,
        'customer_management',
        adminEmail,
        `Changed tenant status of '${company.name}' (${company.id}) to ${newStatus}.`
      );

      setNotification({
        type: 'success',
        text: `Company '${company.name}' status updated to ${newStatus.toUpperCase()}.`
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: `Failed to update status: ${err.message}` });
    }
  };

  // Save quick edits to Quota & Budget
  const handleSaveCompanyEdits = async () => {
    if (!editingCompany) return;
    setIsSavingEdit(true);

    try {
      const updated: CompanyFirestore = {
        ...editingCompany,
        updatedAt: new Date().toISOString()
      };

      await saveCompanyToFirestore(updated);
      setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));

      const adminEmail = auth.currentUser?.email || 'Admin Superuser';
      await recordAuditLogToFirestore(
        'Updated Tenant Quota & Budget',
        'customer_management',
        adminEmail,
        `Adjusted quota (${updated.monthlyTokenQuota.toLocaleString()} tokens) & budget ($${updated.monthlyBudgetUsd}) for '${updated.name}'.`
      );

      setNotification({
        type: 'success',
        text: `Updated configurations for '${updated.name}' successfully.`
      });
      setEditingCompany(null);
    } catch (err: any) {
      setNotification({ type: 'error', text: `Failed to save changes: ${err.message}` });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Dispatch Quota Notification via SMTP
  const handleSendUsageReport = async (company: CompanyFirestore) => {
    setIsSendingAlert(true);
    try {
      const res = await fetch('/api/admin/smtp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: company.billingEmail,
          subject: `[WhyOr Dispatch AI] Monthly Enterprise Usage & Quota Statement: ${company.name}`,
          templateType: 'quota_alert',
          customMessage: `Dear ${company.name} Administrator,\n\nYour current monthly token consumption is ${(company.monthlyTokensUsed || 0).toLocaleString()} out of ${company.monthlyTokenQuota.toLocaleString()} allocated tokens (${Math.round(((company.monthlyTokensUsed || 0) / Math.max(1, company.monthlyTokenQuota)) * 100)}% capacity). Your active routing priority is set to ${company.routingPriority.toUpperCase()}.\n\nLog in with your corporate Google Account to inspect granular per-team telemetry.`,
          sentBy: auth.currentUser?.email || 'Admin Superuser'
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          text: `Usage statement dispatched via SMTP to ${company.billingEmail} (${data.messageId || 'Success'}).`
        });
        await logEmailToFirestore({
          to: company.billingEmail,
          from: 'WhyOr Dispatch AI Enterprise <solarastra.in@gmail.com>',
          subject: `[WhyOr Dispatch AI] Usage Statement: ${company.name}`,
          emailType: 'quota_alert',
          status: 'sent',
          messageId: data.messageId,
          sentBy: auth.currentUser?.email || 'Admin Superuser'
        });
      } else {
        throw new Error(data.error || 'SMTP delivery failed');
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: `Failed to dispatch email: ${err.message}` });
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Domain', 'Industry', 'Tier', 'Status', 'Billing Email', 'Token Quota', 'Tokens Used', 'Budget USD', 'Routing Priority', 'Allowed Models'];
    const rows = companies.map(c => [
      c.id,
      `"${c.name}"`,
      c.domain,
      `"${c.industry || ''}"`,
      c.tier,
      c.status,
      c.billingEmail,
      c.monthlyTokenQuota,
      c.monthlyTokensUsed || 0,
      c.monthlyBudgetUsd || 0,
      c.routingPriority,
      `"${(c.allowedModels || []).join(', ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `whyor_onboarded_customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold font-display text-white">Onboarded Customers & Tenant Registry</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {companies.length} Active Tenants
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-time directory of enterprise organizations provisioned on WhyOr Dispatch AI. Monitor active token quotas, spend caps, and designated company administrators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchCloudData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Sync Registry</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-white/10 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onNavigateTab('onboarding')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Company</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-1.5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL TENANTS</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalCompanies} <span className="text-xs text-emerald-400 font-normal">({activeCompanies} active)</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {teams.length} total departments provisioned
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-1.5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>ALLOCATED TOKEN QUOTA</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {(totalMonthlyTokensAllocated / 1_000_000).toFixed(1)}M <span className="text-xs text-slate-400 font-normal">/ mo</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Across all active corporate tiers
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-1.5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>CONSUMED TOKENS (MTD)</span>
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-orange-400">
            {(totalMonthlyTokensConsumed / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <span>{Math.round((totalMonthlyTokensConsumed / Math.max(1, totalMonthlyTokensAllocated)) * 100)}% Global Utilization</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-1.5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>MONTHLY COMMITTED BUDGET</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ${totalMonthlyBudget.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Zero-markup direct BYOK & pooled rate
          </div>
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company name, domain, billing email, or industry..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Tiers</option>
            <option value="enterprise">Enterprise</option>
            <option value="growth">Growth</option>
            <option value="startup">Startup</option>
            <option value="gov_defense">Gov / Defense</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="bg-slate-900/70 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Company & Domain</th>
                <th className="py-3.5 px-4 font-semibold">Tier & Status</th>
                <th className="py-3.5 px-4 font-semibold">Token Consumption</th>
                <th className="py-3.5 px-4 font-semibold">Budget (USD)</th>
                <th className="py-3.5 px-4 font-semibold">Teams / Seats</th>
                <th className="py-3.5 px-4 font-semibold">Routing Engine</th>
                <th className="py-3.5 px-4 font-semibold text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    No onboarded customers match your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => {
                  const companyTeams = teams.filter(t => t.companyId === company.id);
                  const totalMembers = companyTeams.reduce((acc, t) => acc + (t.members ? t.members.length : 0), 0);
                  const usagePct = Math.min(100, Math.round(((company.monthlyTokensUsed || 0) / Math.max(1, company.monthlyTokenQuota)) * 100));

                  return (
                    <tr key={company.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Name & Domain */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold font-mono text-sm shrink-0">
                            {company.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{company.name}</span>
                              {company.domain && (
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-white/5">
                                  {company.domain}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{company.billingEmail}</span>
                              {company.industry && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-slate-500">{company.industry}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tier & Status */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                            company.tier === 'enterprise'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : company.tier === 'gov_defense'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}>
                            {company.tier}
                          </span>
                          <div>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              company.status === 'active' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                company.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                              }`} />
                              {company.status === 'active' ? 'Active' : 'Suspended'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Token Consumption */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 w-44">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-300">
                              {((company.monthlyTokensUsed || 0) / 1_000_000).toFixed(2)}M
                            </span>
                            <span className="text-slate-400">
                              {(company.monthlyTokenQuota / 1_000_000).toFixed(0)}M cap
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                usagePct > 90 
                                  ? 'bg-rose-500' 
                                  : usagePct > 75 
                                  ? 'bg-amber-500' 
                                  : 'bg-emerald-500'
                              }`} 
                              style={{ width: `${usagePct}%` }} 
                            />
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono text-right">
                            {usagePct}% consumed
                          </div>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-4 px-4 font-mono">
                        <div className="text-sm font-bold text-emerald-400">
                          ${(company.monthlyBudgetUsd || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">Monthly cap</div>
                      </td>

                      {/* Teams & Seats */}
                      <td className="py-4 px-4">
                        <div className="font-mono text-slate-200">
                          {companyTeams.length} {companyTeams.length === 1 ? 'Team' : 'Teams'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{totalMembers} Active Engineers</span>
                        </div>
                      </td>

                      {/* Routing Priority */}
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/10 font-mono text-[10px] uppercase">
                          {company.routingPriority || 'subscription_first'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {(company.allowedModels || []).length} models enabled
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendUsageReport(company)}
                            title="Dispatch Quota / Usage Email to Billing Contact via SMTP"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setEditingCompany(company)}
                            title="Edit Quota, Budget & Parameters"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(company)}
                            title={company.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              company.status === 'active'
                                ? 'bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white'
                                : 'bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white'
                            }`}
                          >
                            {company.status === 'active' ? (
                              <PauseCircle className="w-3.5 h-3.5" />
                            ) : (
                              <PlayCircle className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              if (onSelectCompanyForOnboarding) {
                                onSelectCompanyForOnboarding(company.id);
                              }
                              onNavigateTab('onboarding');
                            }}
                            title="Open in Full Onboarding Manager"
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK EDIT MODAL */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Edit Tenant: {editingCompany.name}</h3>
              </div>
              <button 
                onClick={() => setEditingCompany(null)}
                className="text-slate-400 hover:text-white text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Company Legal / Display Name</label>
                <input
                  type="text"
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Corporate Domain</label>
                  <input
                    type="text"
                    value={editingCompany.domain}
                    onChange={(e) => setEditingCompany({ ...editingCompany, domain: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Plan Tier</label>
                  <select
                    value={editingCompany.tier}
                    onChange={(e) => setEditingCompany({ ...editingCompany, tier: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="enterprise">Enterprise</option>
                    <option value="growth">Growth</option>
                    <option value="startup">Startup</option>
                    <option value="gov_defense">Gov / Defense</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Monthly Token Quota</label>
                  <input
                    type="number"
                    value={editingCompany.monthlyTokenQuota}
                    onChange={(e) => setEditingCompany({ ...editingCompany, monthlyTokenQuota: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Monthly Budget Limit ($ USD)</label>
                  <input
                    type="number"
                    value={editingCompany.monthlyBudgetUsd}
                    onChange={(e) => setEditingCompany({ ...editingCompany, monthlyBudgetUsd: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Primary Billing & Security Notification Email</label>
                <input
                  type="email"
                  value={editingCompany.billingEmail}
                  onChange={(e) => setEditingCompany({ ...editingCompany, billingEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Dispatch Routing Priority</label>
                <select
                  value={editingCompany.routingPriority}
                  onChange={(e) => setEditingCompany({ ...editingCompany, routingPriority: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="subscription_first">Subscription Session First (Flat-rate zero-cost)</option>
                  <option value="byok_first">BYOK Direct First (Strict latency & enterprise SLAs)</option>
                  <option value="balanced">Balanced Dynamic Pareto Routing (Cost & Speed optimization)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setEditingCompany(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveCompanyEdits}
                disabled={isSavingEdit}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingEdit ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
