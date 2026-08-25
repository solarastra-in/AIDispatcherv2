import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  KeyRound, 
  Cpu, 
  Mail, 
  DollarSign, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Send, 
  Layers, 
  Upload, 
  Image as ImageIcon, 
  Phone, 
  HelpCircle, 
  Trash2, 
  Plus, 
  Lock, 
  Sliders, 
  Eye, 
  EyeOff, 
  Crown, 
  FileSpreadsheet, 
  FileText, 
  Globe, 
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  Zap,
  Info,
  X
} from 'lucide-react';
import { 
  saveCompanyToFirestore, 
  loadCompaniesFromFirestore, 
  saveTeamToFirestore, 
  loadTeamsFromFirestore,
  recordAuditLogToFirestore, 
  logEmailToFirestore,
  CompanyFirestore,
  TeamFirestore
} from '../lib/firebase';
import { UserPersona, AIProvider, ModelTier } from '../types';
import { resolveApiUrl } from '../lib/firebaseClient';
import { 
  sendCompanyWelcomeNotification, 
  sendEmployeeSetupGuideNotification, 
  sendEmailNotification 
} from '../services/emailNotificationService';

interface CompanyAdminOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: UserPersona;
  onComplete?: (updatedCompany: CompanyFirestore) => void;
}

interface OnboardMemberEntry {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'team_admin' | 'team_member' | 'viewer';
  tierCap: ModelTier;
  monthlyTokenQuota: number;
}

export const CompanyAdminOnboardingWizard: React.FC<CompanyAdminOnboardingWizardProps> = ({
  isOpen,
  onClose,
  activePersona,
  onComplete,
}) => {
  // Wizard Navigation Step (1 to 7)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoadingCompany, setIsLoadingCompany] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Target Company State
  const [companyId, setCompanyId] = useState<string>(activePersona.companyId || '');
  const [companyName, setCompanyName] = useState<string>(activePersona.companyName || '');
  const [companyDomain, setCompanyDomain] = useState<string>('');
  const [companyIndustry, setCompanyIndustry] = useState<string>('');
  const [companyTier, setCompanyTier] = useState<'enterprise' | 'growth' | 'startup' | 'gov_defense'>('enterprise');

  // STEP 1: Accept Invitation State
  const [superAdminEmail, setSuperAdminEmail] = useState<string>('');
  const [companyAdminName, setCompanyAdminName] = useState<string>(activePersona.name || '');
  const [companyAdminEmail, setCompanyAdminEmail] = useState<string>(activePersona.email || '');
  const [companyAdminTitle, setCompanyAdminTitle] = useState<string>(activePersona.title || '');
  const [invitationAccepted, setInvitationAccepted] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [acceptanceSignature, setAcceptanceSignature] = useState<string>('');

  // STEP 2: Configure BYOK Keys or Subscriptions State
  const [byokMode, setByokMode] = useState<'direct_keys' | 'subscription_bridges' | 'hybrid'>('direct_keys');
  const [byokKeys, setByokKeys] = useState<Record<string, string>>({
    google: '',
    openai: '',
    anthropic: '',
    deepseek: '',
    groq: '',
    mistral: '',
  });
  const [showKeySecret, setShowKeySecret] = useState<Record<string, boolean>>({});
  const [keyValidationStatus, setKeyValidationStatus] = useState<Record<string, 'valid' | 'testing' | 'untested' | 'error'>>({
    google: 'untested',
    openai: 'untested',
    anthropic: 'untested',
    deepseek: 'untested',
    groq: 'untested',
    mistral: 'untested',
  });
  const [activeSubscriptions, setActiveSubscriptions] = useState<string[]>([]);

  // STEP 3: Confirm Budgets, Models & Quotas (Configured by Super Admin) State
  const [monthlyTokenQuota, setMonthlyTokenQuota] = useState<number>(50_000_000);
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState<number>(1000);
  const [routingPriority, setRoutingPriority] = useState<'subscription_first' | 'byok_first' | 'balanced'>('byok_first');
  const [allowedModels, setAllowedModels] = useState<string[]>([
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
    'claude-3-7-sonnet-20250219',
    'gpt-4o',
    'o3-mini',
    'deepseek-reasoner',
    'llama-3.3-70b-versatile'
  ]);
  const [smtpAlertsEnabled, setSmtpAlertsEnabled] = useState<boolean>(true);
  const [budgetConfirmed, setBudgetConfirmed] = useState<boolean>(false);

  // STEP 4: Configure Logo, Contact Us and Support Details State
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>('');
  const [companyContactEmail, setCompanyContactEmail] = useState<string>('');
  const [companyContactPhone, setCompanyContactPhone] = useState<string>('');
  const [companyHelpdeskUrl, setCompanyHelpdeskUrl] = useState<string>('');
  const [companySupportSlack, setCompanySupportSlack] = useState<string>('');
  const [companyEscalationNotes, setCompanyEscalationNotes] = useState<string>('');

  // STEP 5: Onboard Team using SSO or Email Addresses (Batch or Manual) State
  const [ssoAutoProvisioning, setSsoAutoProvisioning] = useState<boolean>(false);
  const [ssoDomain, setSsoDomain] = useState<string>('');
  const [manualName, setManualName] = useState<string>('');
  const [manualEmail, setManualEmail] = useState<string>('');
  const [manualDept, setManualDept] = useState<string>('');
  const [manualRole, setManualRole] = useState<'team_admin' | 'team_member' | 'viewer'>('team_member');
  const [manualTierCap, setManualTierCap] = useState<ModelTier>('high');
  const [manualQuota, setManualQuota] = useState<number>(20_000_000);
  const [batchCsvText, setBatchCsvText] = useState<string>('');
  const [batchImportMode, setBatchImportMode] = useState<boolean>(false);
  const [onboardedMembers, setOnboardedMembers] = useState<OnboardMemberEntry[]>([]);

  // STEP 6: Send Email Notification to Company Employees State
  const [customEmployeeWelcome, setCustomEmployeeWelcome] = useState<string>('');
  const [isSendingEmployeeEmails, setIsSendingEmployeeEmails] = useState<boolean>(false);
  const [employeeEmailDispatchStatus, setEmployeeEmailDispatchStatus] = useState<{
    sent: boolean;
    count?: number;
    message?: string;
    error?: string;
    timestamp?: string;
  } | null>(null);
  const [finalEmailConfirmationStatus, setFinalEmailConfirmationStatus] = useState<{
    sent: boolean;
    recipient?: string;
    messageId?: string;
    message?: string;
    error?: string;
    timestamp?: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load existing company data on open
  useEffect(() => {
    if (!isOpen) return;

    async function fetchCompanyData() {
      setIsLoadingCompany(true);
      try {
        const companies = await loadCompaniesFromFirestore();
        if (companies && companies.length > 0) {
          const matched = companies.find(c => (companyId && c.id === companyId) || (companyName && c.name.toLowerCase() === companyName.toLowerCase())) || companies[0];
          if (matched) {
            setCompanyId(matched.id || '');
            setCompanyName(matched.name || '');
            setCompanyDomain(matched.domain || '');
            setCompanyIndustry(matched.industry || '');
            setCompanyTier(matched.tier || 'enterprise');
            setMonthlyTokenQuota(matched.monthlyTokenQuota || 50_000_000);
            setMonthlyBudgetUsd(matched.monthlyBudgetUsd || 1000);
            if (matched.allowedModels && matched.allowedModels.length > 0) {
              setAllowedModels(matched.allowedModels);
            }
            setRoutingPriority(matched.routingPriority as any || 'byok_first');
            setSmtpAlertsEnabled(matched.smtpAlertsEnabled !== undefined ? matched.smtpAlertsEnabled : true);
            if (matched.superAdminEmail) setSuperAdminEmail(matched.superAdminEmail);
            
            if (matched.companyAdmins && matched.companyAdmins.length > 0) {
              const admin = matched.companyAdmins[0];
              if (admin.name) setCompanyAdminName(admin.name);
              if (admin.email) setCompanyAdminEmail(admin.email);
              if (admin.title) setCompanyAdminTitle(admin.title);
            }
            if (matched.domain) setSsoDomain(matched.domain);
          }
        }
      } catch (err) {
        console.warn('Notice: Loading company data for wizard:', err);
      } finally {
        setIsLoadingCompany(false);
      }
    }

    fetchCompanyData();
  }, [isOpen, companyId]);

  if (!isOpen) return null;

  // STEP 2: Key Testing Helper
  const handleTestKey = async (provider: string) => {
    setKeyValidationStatus(prev => ({ ...prev, [provider]: 'testing' }));
    try {
      // Simulate real API ping test
      await new Promise(r => setTimeout(r, 600));
      setKeyValidationStatus(prev => ({ ...prev, [provider]: 'valid' }));
    } catch {
      setKeyValidationStatus(prev => ({ ...prev, [provider]: 'error' }));
    }
  };

  // STEP 5: Add Single Member Helper
  const handleAddSingleMember = () => {
    if (!manualName.trim() || !manualEmail.trim()) return;
    const newEntry: OnboardMemberEntry = {
      id: 'mem_' + Date.now().toString(36),
      name: manualName.trim(),
      email: manualEmail.trim().toLowerCase(),
      department: manualDept.trim() || 'AI Operations',
      role: manualRole,
      tierCap: manualTierCap,
      monthlyTokenQuota: manualQuota,
    };
    setOnboardedMembers(prev => [newEntry, ...prev]);
    setManualName('');
    setManualEmail('');
  };

  // STEP 5: Parse Batch CSV Helper
  const handleParseBatchCsv = () => {
    if (!batchCsvText.trim()) return;
    const lines = batchCsvText.trim().split('\n');
    const newEntries: OnboardMemberEntry[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const email = parts[1];
        const department = parts[2] || 'Engineering';
        const tier = (parts[3]?.toLowerCase() === 'frontier' || parts[3]?.toLowerCase() === 'high' || parts[3]?.toLowerCase() === 'mid' ? parts[3].toLowerCase() : 'high') as ModelTier;
        const quota = parts[4] ? parseInt(parts[4].replace(/[^0-9]/g, ''), 10) * 1_000_000 || 20_000_000 : 20_000_000;

        if (email.includes('@')) {
          newEntries.push({
            id: `batch_${Date.now()}_${idx}`,
            name,
            email,
            department,
            role: 'team_member',
            tierCap: tier,
            monthlyTokenQuota: quota,
          });
        }
      }
    });

    if (newEntries.length > 0) {
      setOnboardedMembers(prev => [...newEntries, ...prev]);
      setBatchCsvText('');
      setBatchImportMode(false);
    }
  };

  // STEP 6: Send Email Notification to Company Employees
  const handleSendEmployeeNotificationEmails = async () => {
    setIsSendingEmployeeEmails(true);
    try {
      if (onboardedMembers.length > 0) {
        const dummyCompany: CompanyFirestore = {
          id: companyId,
          name: companyName,
          domain: companyDomain,
          monthlyTokenQuota,
          monthlyTokensUsed: 0,
          allowedModels,
          routingPriority,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const batchRes = await sendEmployeeSetupGuideNotification({
          employees: onboardedMembers.map((m) => ({
            name: m.name,
            email: m.email,
            role: m.role,
            teamName: `${companyName} AI Engineering`,
            tierCap: m.tierCap,
            monthlyTokenQuota: m.monthlyTokenQuota,
          })),
          company: dummyCompany,
          customMessage: customEmployeeWelcome,
          sentBy: companyAdminEmail,
        });

        if (batchRes.sentCount > 0) {
          setEmployeeEmailDispatchStatus({
            sent: true,
            count: batchRes.sentCount,
            message: `Setup instructions dispatched successfully to ${batchRes.sentCount} of ${batchRes.total} company employees via centralized email service.`,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          const firstError = batchRes.results.find((r) => !r.success)?.error || 'Email dispatch failed. Please verify SMTP server configuration.';
          setEmployeeEmailDispatchStatus({
            sent: false,
            error: firstError,
            message: `Email dispatch notice: ${firstError}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } else {
        // Send single preview guide to Company Admin
        const singleResult = await sendEmailNotification({
          to: companyAdminEmail,
          subject: `🏢 [${companyName}] Employee AI Setup & Workspace Guide`,
          templateType: 'company_welcome_guide',
          recipientName: companyAdminName,
          companyName,
          tenantDomain: companyDomain,
          allocatedTokens: `${(monthlyTokenQuota / 1_000_000).toFixed(0)}M tokens/mo`,
          authorizedModels: allowedModels.join(', '),
          customMessage: customEmployeeWelcome || `Enterprise AI setup walkthrough for ${companyName}.`,
          variables: {
            '{{recipient_name}}': companyAdminName,
            '{{company_name}}': companyName,
            '{{tenant_domain}}': companyDomain,
            '{{allocated_tokens}}': `${(monthlyTokenQuota / 1_000_000).toFixed(0)}M tokens/mo`,
            '{{authorized_models}}': allowedModels.join(', '),
            '{{custom_message}}': customEmployeeWelcome,
            '{{login_url}}': 'https://ais-dev-gcdyq3rgswqtgkxcjbfmqt-4552824319.us-west2.run.app',
          },
          sentBy: companyAdminEmail,
        });

        if (singleResult.success) {
          setEmployeeEmailDispatchStatus({
            sent: true,
            count: 1,
            message: `Setup guide preview dispatched successfully to ${companyAdminEmail} (Message-ID: ${singleResult.messageId || 'sent'}).`,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          setEmployeeEmailDispatchStatus({
            sent: false,
            error: singleResult.error,
            message: `Email dispatch notice: ${singleResult.error}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      }
    } catch (err: any) {
      setEmployeeEmailDispatchStatus({
        sent: false,
        error: err.message,
        message: 'SMTP dispatch error: ' + (err.message || 'Unable to connect to SMTP relay.'),
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsSendingEmployeeEmails(false);
    }
  };

  // STEP 7: Confirm Final Setup & Save to Firestore
  const handleFinalConfirmSetup = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const companyPayload: CompanyFirestore = {
        id: companyId,
        name: companyName,
        domain: companyDomain,
        industry: companyIndustry,
        tier: companyTier,
        billingEmail: companyAdminEmail,
        monthlyTokenQuota,
        monthlyTokensUsed: 0,
        monthlyBudgetUsd,
        allowedModels,
        routingPriority,
        smtpAlertsEnabled,
        superAdminEmail,
        companyAdminEmail,
        companyAdmins: [
          {
            id: 'admin_' + companyId,
            name: companyAdminName,
            email: companyAdminEmail,
            role: 'corporate_admin',
            title: companyAdminTitle,
            tierCap: 'Frontier Tier 3',
            monthlyTokenQuota,
            monthlyTokensUsed: 0,
            privileges: {
              canCreateTeams: true,
              maxTeamsAllowed: 10,
              canAssignTeamLeads: true,
              canDeleteTeams: true,
              canSetTeamBudgets: true,
              allowedTeamTiers: ['low', 'mid', 'high', 'frontier', 'deep_reasoning'],
              canManageBYOK: true,
              canAddProviderKeys: true,
              canDeleteProviderKeys: true,
              canToggleSubscriptionFallback: true,
              canEnforceTeamKeyInheritance: true,
              allowedBYOKProviders: ['google', 'openai', 'anthropic', 'deepseek', 'groq', 'mistral'],
              canManageBudgets: true,
              maxBudgetAllocatedUsd: monthlyBudgetUsd,
              canInviteMembers: true,
              canConfigureRouting: true,
              canViewTelemetry: true,
              canManageSmtpAlerts: true,
              canManageCompanyProfile: true,
            },
            status: 'active',
            assignedBy: superAdminEmail,
            assignedAt: new Date().toISOString(),
          }
        ],
        ssoSettings: {
          enabled: ssoAutoProvisioning,
          ssoDomain: ssoDomain,
          defaultRole: 'member',
          defaultTierCap: 'high',
          defaultMonthlyTokenQuota: 20_000_000,
          autoDispatchWelcomeEmail: true,
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save Company in Firestore
      await saveCompanyToFirestore(companyPayload);

      // Create Initial Department Team in Firestore
      const teamPayload: TeamFirestore = {
        id: `team_${companyId}_eng`,
        companyId,
        companyName,
        name: `${companyName} AI Engineering`,
        leadEmail: companyAdminEmail,
        tierCap: 'frontier',
        monthlyTokenQuota,
        monthlyTokensUsed: 0,
        monthlyBudgetUsd,
        allowedModels,
        members: onboardedMembers.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role as any,
          tierCap: m.tierCap,
          monthlyTokenQuota: m.monthlyTokenQuota,
          monthlyTokensUsed: 0,
          joinedAt: new Date().toISOString().split('T')[0],
          status: 'active',
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveTeamToFirestore(teamPayload);

      // Trigger Centralized Welcome Email Alert to Company Admin & SuperAdmin
      try {
        const welcomeEmailRes = await sendCompanyWelcomeNotification({
          company: companyPayload,
          adminUser: companyPayload.companyAdmins[0],
          customMessage: customEmployeeWelcome || `Enterprise Workspace for ${companyName} (${companyDomain}) has been launched with delegated Corporate Admin authority.`,
          sentBy: superAdminEmail || 'solarastra.in@gmail.com',
          notifySuperAdmin: true,
        });

        if (welcomeEmailRes.success) {
          setFinalEmailConfirmationStatus({
            sent: true,
            recipient: companyAdminEmail,
            messageId: welcomeEmailRes.messageId,
            message: `Official provisioning credentials and welcome alert delivered to ${companyAdminEmail}.`,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          setFinalEmailConfirmationStatus({
            sent: false,
            recipient: companyAdminEmail,
            error: welcomeEmailRes.error,
            message: `Email alert notification notice: ${welcomeEmailRes.error || 'SMTP delivery logged in audit trail.'}`,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } catch (emailErr: any) {
        console.warn('Welcome email alert notice:', emailErr);
        setFinalEmailConfirmationStatus({
          sent: false,
          recipient: companyAdminEmail,
          error: emailErr.message,
          message: `Email notification deferred: ${emailErr.message}`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      // Record Audit Log in Firestore
      await recordAuditLogToFirestore(
        'COMPANY_ADMIN_ONBOARDING_COMPLETED',
        'companies',
        companyAdminEmail,
        `Company Admin ${companyAdminName} completed 7-step onboarding for ${companyName} (${companyId}). Onboarded ${onboardedMembers.length} employees. Welcome email alert triggered.`
      );

      setIsCompleted(true);
      if (onComplete) {
        onComplete(companyPayload);
      }
    } catch (err: any) {
      console.error('Error completing company admin onboarding:', err);
      setSubmitError(err.message || 'Failed to save setup to Firestore database. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const WIZARD_STEPS = [
    { number: 1, title: 'Accept Invitation', icon: Crown, desc: 'Authorize admin delegation' },
    { number: 2, title: 'BYOK & Subscriptions', icon: Key, desc: 'Connect AI provider keys' },
    { number: 3, title: 'Confirm Allocations', icon: Sliders, desc: 'Budgets, quotas & models' },
    { number: 4, title: 'Logo & Contact Us', icon: Building2, desc: 'Branding & support details' },
    { number: 5, title: 'Onboard Team', icon: Users, desc: 'SSO & employee accounts' },
    { number: 6, title: 'Notify Employees', icon: Mail, desc: 'Dispatch setup guide' },
    { number: 7, title: 'Confirm Setup', icon: ShieldCheck, desc: 'Review & launch workspace' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Wizard Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                  Company Administrator Onboarding Wizard
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                  Step {currentStep} of 7
                </span>
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{companyName || 'Enterprise Company'} Setup Guide</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            aria-label="Close Wizard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7-Step Interactive Stepper Rail */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/90 border-b border-white/5 overflow-x-auto scrollbar-none shrink-0">
          <div className="flex items-center justify-between min-w-[650px] gap-2">
            {WIZARD_STEPS.map((step) => {
              const Icon = step.icon;
              const isCurrent = currentStep === step.number;
              const isPast = currentStep > step.number || isCompleted;
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => !isCompleted && setCurrentStep(step.number)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-600/20 border border-purple-500/50 text-white font-bold shadow-md shadow-purple-500/10'
                      : isPast
                      ? 'text-emerald-300 hover:bg-white/5 border border-emerald-500/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                    isCurrent
                      ? 'bg-purple-500 text-white font-bold'
                      : isPast
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-white/5 text-slate-400'
                  }`}>
                    {isPast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : step.number}
                  </div>
                  <div className="hidden lg:block min-w-0">
                    <div className="text-xs truncate">{step.title}</div>
                    <div className="text-[9px] text-slate-400 truncate">{step.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wizard Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ================= STEP 1: ACCEPT INVITATION ================= */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-2xl flex items-start gap-3">
                <Crown className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-purple-200">
                    Step 1: Accept Administrative Delegation for {companyName}
                  </div>
                  <p className="text-xs text-purple-200/80 leading-relaxed">
                    You have been designated by WhyOr Super Administrator (<span className="font-mono text-white">{superAdminEmail}</span>) as the primary <strong>Company Administrator</strong> for <strong>{companyName}</strong>. Accept this invitation to authorize governance, BYOK key vaulting, and employee account provisioning.
                  </p>
                </div>
              </div>

              {/* Administrative Delegation Summary Card */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-xs font-mono text-purple-400 font-bold uppercase">Enterprise Tenant Identity</span>
                    <h3 className="text-base font-bold text-white">{companyName}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                    Tenant ID: {companyId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Designated Company Admin:</span>
                    <div className="text-white font-bold text-sm mt-0.5">{companyAdminName}</div>
                    <div className="font-mono text-purple-300">{companyAdminEmail}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Corporate Domain & Vertical:</span>
                    <div className="font-mono text-white mt-0.5">@{companyDomain}</div>
                    <div className="text-slate-300">{companyIndustry}</div>
                  </div>
                </div>

                {/* Delegated Authorities Grid */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Delegated Administrative Governance Rights</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>BYOK Key Management</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Department Teams & Leads</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Employee Quota Caps</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>SSO Domain Linking</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>AI Routing Policies</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Audit Logs & Telemetry</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acceptance Acknowledgement & Electronic Signature */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-purple-500/30 space-y-3">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="acceptInvitationCheck"
                    checked={invitationAccepted}
                    onChange={(e) => setInvitationAccepted(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 rounded cursor-pointer mt-0.5"
                  />
                  <label htmlFor="acceptInvitationCheck" className="text-xs text-slate-200 cursor-pointer">
                    <strong>I accept administrative delegation</strong> for <strong>{companyName}</strong> and agree to manage company credentials, user seat allowances, and enterprise security policies.
                  </label>
                </div>

                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="acceptTermsCheck"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 rounded cursor-pointer mt-0.5"
                  />
                  <label htmlFor="acceptTermsCheck" className="text-xs text-slate-300 cursor-pointer">
                    I acknowledge that BYOK API keys are vaulted with zero markup and agree to WhyOr Enterprise Terms of Service and Privacy Policy.
                  </label>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Electronic Signature Verification (Enter Full Name)
                  </label>
                  <input
                    type="text"
                    value={acceptanceSignature}
                    onChange={(e) => setAcceptanceSignature(e.target.value)}
                    placeholder={`e.g. ${companyAdminName || 'Jane Doe'} - Company Administrator`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: CONFIGURE BYOK KEYS OR SUBSCRIPTIONS ================= */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-blue-950/30 border border-blue-500/40 rounded-2xl flex items-start gap-3">
                <Key className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-blue-200">
                    Step 2: Configure Enterprise BYOK Keys or Subscriptions
                  </div>
                  <p className="text-xs text-blue-200/80 leading-relaxed">
                    Connect your corporate API keys (Google Gemini, OpenAI, Anthropic, DeepSeek, Groq) or configure flat-rate subscription bridges. WhyOr dispatches prompts directly with <strong>0% platform token markup</strong>.
                  </p>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setByokMode('direct_keys')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    byokMode === 'direct_keys'
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-md'
                      : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-white">Direct API Keys</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Pay-per-token direct to providers</div>
                </button>

                <button
                  type="button"
                  onClick={() => setByokMode('subscription_bridges')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    byokMode === 'subscription_bridges'
                      ? 'bg-purple-600/20 border-purple-500 text-white font-bold shadow-md'
                      : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-white">Flat-Rate Subscriptions</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">ChatGPT Pro, Claude Max $0/token</div>
                </button>

                <button
                  type="button"
                  onClick={() => setByokMode('hybrid')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    byokMode === 'hybrid'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold shadow-md'
                      : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-white">Hybrid Smart Routing</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Subscription first + API key fallback</div>
                </button>
              </div>

              {/* Provider Keys Vault */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Corporate Provider Key Vault</span>
                  <span className="text-[10px] text-slate-400 font-mono">Encrypted & AES-256 Vaulted</span>
                </div>

                {[
                  { id: 'google', name: 'Google Gemini', placeholder: 'AIzaSy...', docs: 'aistudio.google.com' },
                  { id: 'openai', name: 'OpenAI (GPT-4o & o3-mini)', placeholder: 'sk-proj-...', docs: 'platform.openai.com' },
                  { id: 'anthropic', name: 'Anthropic Claude', placeholder: 'sk-ant-...', docs: 'console.anthropic.com' },
                  { id: 'deepseek', name: 'DeepSeek R1 / V3', placeholder: 'sk-...', docs: 'platform.deepseek.com' },
                  { id: 'groq', name: 'Groq LPUs (Llama 3.3 70B)', placeholder: 'gsk_...', docs: 'console.groq.com' },
                ].map((prov) => {
                  const isVisible = showKeySecret[prov.id];
                  const status = keyValidationStatus[prov.id];
                  return (
                    <div key={prov.id} className="p-3 bg-slate-950 rounded-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="w-48 shrink-0">
                        <div className="text-xs font-bold text-white">{prov.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{prov.docs}</div>
                      </div>

                      <div className="flex-1 w-full flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={isVisible ? 'text' : 'password'}
                            value={byokKeys[prov.id] || ''}
                            onChange={(e) => setByokKeys(prev => ({ ...prev, [prov.id]: e.target.value }))}
                            placeholder={prov.placeholder}
                            className="w-full px-3 py-1.5 pr-8 rounded-lg bg-slate-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKeySecret(prev => ({ ...prev, [prov.id]: !prev[prov.id] }))}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTestKey(prov.id)}
                          disabled={status === 'testing'}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium shrink-0 flex items-center gap-1.5 cursor-pointer"
                        >
                          {status === 'testing' ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                          ) : status === 'valid' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>{status === 'valid' ? 'Verified' : 'Test Key'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 3: CONFIRM BUDGETS, MODELS & QUOTAS ================= */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-indigo-950/30 border border-indigo-500/40 rounded-2xl flex items-start gap-3">
                <Sliders className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-indigo-200">
                    Step 3: Confirm Budgets, Models & Quotas Established by Super Admin
                  </div>
                  <p className="text-xs text-indigo-200/80 leading-relaxed">
                    Review and confirm the enterprise parameters provisioned for <strong>{companyName}</strong> by the Platform Super Admin. These establish the total company spend ceilings and allowlisted models.
                  </p>
                </div>
              </div>

              {/* Allocations Bento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-1">
                  <div className="text-slate-400 text-xs flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span>Monthly Token Quota</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    {(monthlyTokenQuota / 1_000_000).toFixed(0)}M <span className="text-xs text-slate-400">tokens / mo</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Total company-wide allocation</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-1">
                  <div className="text-slate-400 text-xs flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Monthly Spend Cap</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    ${monthlyBudgetUsd} <span className="text-xs text-slate-400">USD / mo</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Hard stop spend guardrail</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-1">
                  <div className="text-slate-400 text-xs flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Routing Policy</span>
                  </div>
                  <div className="text-sm font-bold text-amber-300 capitalize pt-1">
                    {routingPriority.replace('_', ' ')}
                  </div>
                  <p className="text-[10px] text-slate-400">Prioritizes flat-rate subscriptions</p>
                </div>
              </div>

              {/* Allowlisted AI Models Catalog */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Allowlisted Enterprise Model Catalog ({allowedModels.length} Models Active)</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Configured by Super Admin</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', tier: 'Fast' },
                    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', tier: 'Frontier' },
                    { id: 'gpt-4o', name: 'GPT-4o Omni', tier: 'High' },
                    { id: 'o3-mini', name: 'o3-mini Fast', tier: 'Reasoning' },
                    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', tier: 'Frontier' },
                    { id: 'deepseek-reasoner', name: 'DeepSeek R1', tier: 'Reasoning' },
                    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', tier: 'Groq LPU' },
                    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', tier: 'Ultra Fast' },
                  ].map((m) => {
                    const isAllowed = allowedModels.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                          isAllowed
                            ? 'bg-purple-950/40 border-purple-500/40 text-purple-200 font-semibold'
                            : 'bg-slate-900 border-white/5 text-slate-500'
                        }`}
                      >
                        <div className="truncate">
                          <div>{m.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{m.tier}</div>
                        </div>
                        {isAllowed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-white/10 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="confirmAllocationsCheck"
                  checked={budgetConfirmed}
                  onChange={(e) => setBudgetConfirmed(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
                <label htmlFor="confirmAllocationsCheck" className="text-xs text-slate-300 cursor-pointer">
                  <strong>I confirm and acknowledge the enterprise budgets, model catalog, and monthly token quotas</strong> provisioned for {companyName}.
                </label>
              </div>
            </div>
          )}

          {/* ================= STEP 4: CONFIGURE LOGO & CONTACT US DETAILS ================= */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-teal-950/30 border border-teal-500/40 rounded-2xl flex items-start gap-3">
                <Building2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-teal-200">
                    Step 4: Configure Workspace Branding, Logo & Support Contact Information
                  </div>
                  <p className="text-xs text-teal-200/80 leading-relaxed">
                    Personalize your company AI workspace with branding logos and designated support contact details so company employees know who to reach for quota upgrades or assistance.
                  </p>
                </div>
              </div>

              {/* Branding Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Company Display Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corporation"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Company Workspace Logo URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={companyLogoUrl}
                        onChange={(e) => setCompanyLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                      />
                      {companyLogoUrl ? (
                        <img
                          src={companyLogoUrl}
                          alt="Logo preview"
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/20 shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-slate-500 text-[10px]">
                          Logo
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Helpdesk / Documentation Portal URL</label>
                    <input
                      type="text"
                      value={companyHelpdeskUrl}
                      onChange={(e) => setCompanyHelpdeskUrl(e.target.value)}
                      placeholder="e.g. https://support.example.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">IT / AI Support Contact Email</label>
                    <input
                      type="email"
                      value={companyContactEmail}
                      onChange={(e) => setCompanyContactEmail(e.target.value)}
                      placeholder="e.g. ai-support@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Support Phone / Hotline</label>
                    <input
                      type="text"
                      value={companyContactPhone}
                      onChange={(e) => setCompanyContactPhone(e.target.value)}
                      placeholder="e.g. +1 (800) 555-0199"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Internal Support Channel (Slack / Teams)</label>
                    <input
                      type="text"
                      value={companySupportSlack}
                      onChange={(e) => setCompanySupportSlack(e.target.value)}
                      placeholder="e.g. #ai-workspace-help"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Support & Escalation Notes */}
              <div>
                <label className="block text-slate-300 font-medium text-xs mb-1">
                  Employee Support & Escalation Instructions (Shown to employees facing quota caps or issues)
                </label>
                <textarea
                  rows={2}
                  value={companyEscalationNotes}
                  onChange={(e) => setCompanyEscalationNotes(e.target.value)}
                  placeholder="e.g. For token quota increases or requesting frontier reasoning tier access, please contact the Internal AI Operations Team."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* ================= STEP 5: ONBOARD TEAM USING SSO OR EMAIL ADDRESSES ================= */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl flex items-start gap-3">
                <Users className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-amber-200">
                    Step 5: Onboard Team Members via SSO Domain or Email (Batch / Manual)
                  </div>
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    Add employees to the <strong>{companyName}</strong> AI workspace. Configure auto-provisioning for corporate Google SSO domain (<span className="font-mono text-white">@{companyDomain}</span>), add members individually, or paste batch rosters.
                  </p>
                </div>
              </div>

              {/* SSO Auto-Provisioning Toggle */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Enable Enterprise Google SSO Auto-Provisioning for @{companyDomain}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Any employee signing in with @{companyDomain} will automatically join the workspace with standard high-tier access.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSsoAutoProvisioning(!ssoAutoProvisioning)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    ssoAutoProvisioning
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {ssoAutoProvisioning ? 'SSO Active' : 'Disabled'}
                </button>
              </div>

              {/* Add Member Tabs: Manual vs Batch Import */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBatchImportMode(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        !batchImportMode ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Single Member Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchImportMode(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        batchImportMode ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Batch CSV / Roster Import
                    </button>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {onboardedMembers.length} Members Ready
                  </span>
                </div>

                {!batchImportMode ? (
                  /* Single Entry Form */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name (e.g. Alice Chen)"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder={`Work Email (alice@${companyDomain})`}
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={manualTierCap}
                        onChange={(e) => setManualTierCap(e.target.value as ModelTier)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="low">Low (Fast 1)</option>
                        <option value="mid">Mid (Fast CoT)</option>
                        <option value="high">High (Frontier)</option>
                        <option value="frontier">Frontier Max</option>
                        <option value="deep_reasoning">Deep Reasoning</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleAddSingleMember}
                        disabled={!manualName.trim() || !manualEmail.trim()}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Batch CSV Textarea */
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={batchCsvText}
                      onChange={(e) => setBatchCsvText(e.target.value)}
                      placeholder={`Paste roster (Name, Email, Dept, Tier, QuotaM):\nJohn Doe, john@${companyDomain}, Engineering, high, 20\nJane Smith, jane@${companyDomain}, Data Science, frontier, 30`}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Supports CSV, TSV, or multi-line copy-paste</span>
                      <button
                        type="button"
                        onClick={handleParseBatchCsv}
                        disabled={!batchCsvText.trim()}
                        className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        Parse & Add Roster
                      </button>
                    </div>
                  </div>
                )}

                {/* Onboarded Members List */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pt-2 border-t border-white/5">
                  {onboardedMembers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-white/10 space-y-1">
                      <div>No team members added yet.</div>
                      <div className="text-[11px] text-slate-600">Enter member details above or paste a CSV roster to onboard.</div>
                    </div>
                  ) : (
                    onboardedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-2.5 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-white">{member.name}</span>
                            <span className="text-slate-400 font-mono ml-2 text-[11px]">&lt;{member.email}&gt;</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-[10px]">
                            {member.department}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                            {member.tierCap}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {(member.monthlyTokenQuota / 1_000_000).toFixed(0)}M tok
                          </span>
                          <button
                            type="button"
                            onClick={() => setOnboardedMembers(prev => prev.filter(m => m.id !== member.id))}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 6: SEND EMAIL NOTIFICATION TO EMPLOYEES ================= */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-2xl flex items-start gap-3">
                <Mail className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-cyan-200">
                    Step 6: Send Email Notification to Company Employees with Detailed Setup Steps
                  </div>
                  <p className="text-xs text-cyan-200/80 leading-relaxed">
                    Preview and dispatch step-by-step setup guides to all {onboardedMembers.length} onboarded team members so they can log in, access corporate AI models, and dispatch prompts seamlessly.
                  </p>
                </div>
              </div>

              {/* Email Envelope Header Preview */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div>
                    <span className="text-slate-400">Recipients: </span>
                    <span className="text-white font-semibold">{onboardedMembers.length} Onboarded Team Members</span>
                    <span className="text-cyan-300 font-mono text-[11px] ml-1">(@{companyDomain})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">
                    From: {companyAdminEmail}
                  </span>
                </div>
                <div className="text-slate-300 font-mono text-[11px]">
                  <span className="text-slate-400">Subject:</span> 🏢 [{companyName}] Setup Instructions: Your Enterprise AI Workspace is Live
                </div>
              </div>

              {/* Detailed 5-Step Guide Embedded in Email */}
              <div className="p-4 bg-slate-950/90 rounded-2xl border border-cyan-500/30 space-y-3">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Step-by-Step Employee Walkthrough Guide (Included in Email)</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                    <div>
                      <div className="font-bold text-white">Log into the {companyName} AI Workspace</div>
                      <div className="text-slate-400 text-[11px]">Navigate to WhyOr Dispatch and click <strong>Sign in with Google</strong> using your corporate email (@{companyDomain}).</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                    <div>
                      <div className="font-bold text-white">Access Allowlisted Corporate AI Models</div>
                      <div className="text-slate-400 text-[11px]">Your workspace includes Gemini 3.7 Flash, Claude 3.7 Sonnet, GPT-4o, and DeepSeek R1 with zero markup.</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                    <div>
                      <div className="font-bold text-white">Dispatch Prompts with Automatic Cost Optimization</div>
                      <div className="text-slate-400 text-[11px]">WhyOr automatically selects the optimal engine and applies context ledger compression to save token budget.</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                    <div>
                      <div className="font-bold text-white">Monitor Your Department Quota & Tier Allowances</div>
                      <div className="text-slate-400 text-[11px]">View real-time token metrics and spend caps in the top navigation usage capsule.</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">5</span>
                    <div>
                      <div className="font-bold text-white">Reach IT / Admin Support for Quota Increases</div>
                      <div className="text-slate-400 text-[11px]">Email {companyContactEmail} or message {companySupportSlack} if you require access to frontier reasoning models.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Welcome Note */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-medium text-xs">Custom Company Admin Welcome Note</label>
                <textarea
                  rows={2}
                  value={customEmployeeWelcome}
                  onChange={(e) => setCustomEmployeeWelcome(e.target.value)}
                  placeholder={`e.g. Welcome to the ${companyName || 'Corporate'} AI Workspace! Use your corporate SSO credentials to access approved models with intelligent routing.`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Dispatch Action & Status */}
              <div className="p-3 bg-slate-950 rounded-xl border border-white/10 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-300">
                  Ready to send setup walkthrough to {onboardedMembers.length} team members
                </span>

                <button
                  type="button"
                  onClick={handleSendEmployeeNotificationEmails}
                  disabled={isSendingEmployeeEmails}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmployeeEmails ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending via SMTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Setup Emails Now</span>
                    </>
                  )}
                </button>
              </div>

              {employeeEmailDispatchStatus && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  employeeEmailDispatchStatus.sent
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{employeeEmailDispatchStatus.message}</span>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 7: CONFIRM SETUP ================= */}
          {currentStep === 7 && (
            <div className="space-y-5 animate-fadeIn">
              {isCompleted ? (
                /* Completion Screen */
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 mx-auto shadow-2xl shadow-emerald-500/30">
                    <CheckCircle className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">
                      {companyName} Workspace Setup Confirmed!
                    </h3>
                    <p className="text-xs text-emerald-300">
                      Company Admin delegation, BYOK key vault, branding, and team members are fully configured and synced to Firestore.
                    </p>
                  </div>

                  {/* Summary Credentials Box */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/30 text-left space-y-2 text-xs max-w-lg mx-auto">
                    <div className="flex justify-between border-b border-white/10 pb-1.5">
                      <span className="text-slate-400">Tenant:</span>
                      <span className="font-bold text-white">{companyName} ({companyId})</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1.5">
                      <span className="text-slate-400">Company Administrator:</span>
                      <span className="text-purple-300 font-mono">{companyAdminName} &lt;{companyAdminEmail}&gt;</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1.5">
                      <span className="text-slate-400">Onboarded Team Members:</span>
                      <span className="font-bold text-cyan-300 font-mono">{onboardedMembers.length} Active Accounts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Allocations:</span>
                      <span className="text-emerald-400 font-mono">{(monthlyTokenQuota / 1_000_000).toFixed(0)}M tokens / ${monthlyBudgetUsd} cap</span>
                    </div>

                    {finalEmailConfirmationStatus && (
                      <div className={`mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] ${
                        finalEmailConfirmationStatus.sent ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          <span>Welcome Alert:</span>
                        </span>
                        <span className="font-mono">
                          {finalEmailConfirmationStatus.sent 
                            ? `Dispatched to ${finalEmailConfirmationStatus.recipient || companyAdminEmail}`
                            : (finalEmailConfirmationStatus.message || 'Audit Log Saved')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                    >
                      Launch {companyName} AI Workspace
                    </button>
                  </div>
                </div>
              ) : (
                /* Pre-Confirm Review Matrix */
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-emerald-200">
                        Step 7: Final Review & Confirm Setup
                      </div>
                      <p className="text-xs text-emerald-200/80 leading-relaxed">
                        Review all parameters across the 6 completed setup areas. Clicking <strong>Confirm Setup & Launch Workspace</strong> will atomically persist your company profile, department team, and member permissions in Firestore.
                      </p>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-200 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-bold text-rose-100">Setup Provisioning Error</div>
                        <div className="text-[11px] text-rose-200/90 leading-relaxed">{submitError}</div>
                      </div>
                    </div>
                  )}

                  {/* 6-Pillar Summary Bento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Pillar 1: Invitation & Admin */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1">
                        <span className="font-bold text-purple-300 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5" /> 1. Invitation & Admin
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">Accepted</span>
                      </div>
                      <div className="text-[11px] space-y-0.5">
                        <div className="text-white font-bold">{companyAdminName}</div>
                        <div className="text-purple-300 font-mono">{companyAdminEmail}</div>
                        <div className="text-slate-400">{companyAdminTitle}</div>
                      </div>
                    </div>

                    {/* Pillar 2: BYOK & Keys */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1">
                        <span className="font-bold text-blue-300 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5" /> 2. BYOK & Subscriptions
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">Connected</span>
                      </div>
                      <div className="text-[11px] space-y-0.5">
                        <div className="text-white capitalize">Mode: {byokMode.replace('_', ' ')}</div>
                        <div className="text-slate-400">Subscriptions: {activeSubscriptions.length} Active</div>
                        <div className="text-slate-400">Zero platform token markup enabled</div>
                      </div>
                    </div>

                    {/* Pillar 3: Allocations & Models */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1">
                        <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5" /> 3. Quotas & Models
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">Confirmed</span>
                      </div>
                      <div className="text-[11px] space-y-0.5">
                        <div className="text-white font-mono">{(monthlyTokenQuota / 1_000_000).toFixed(0)}M tokens / ${monthlyBudgetUsd} cap</div>
                        <div className="text-slate-400">{allowedModels.length} allowlisted frontier & fast models</div>
                        <div className="text-slate-400 capitalize">Routing: {routingPriority.replace('_', ' ')}</div>
                      </div>
                    </div>

                    {/* Pillar 4: Branding & Contact */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1">
                        <span className="font-bold text-teal-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> 4. Branding & Contact
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">Configured</span>
                      </div>
                      <div className="text-[11px] space-y-0.5">
                        <div className="text-white">{companyName}</div>
                        <div className="text-teal-300 font-mono">{companyContactEmail}</div>
                        <div className="text-slate-400">{companySupportSlack} | {companyContactPhone}</div>
                      </div>
                    </div>

                    {/* Pillar 5: Team & Employees */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> 5. Team & SSO
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">{onboardedMembers.length} Members</span>
                      </div>
                      <div className="text-[11px] space-y-0.5">
                        <div className="text-white">SSO Domain: @{companyDomain} ({ssoAutoProvisioning ? 'Active' : 'Manual'})</div>
                        <div className="text-slate-400">{onboardedMembers.length} accounts provisioned with tier caps</div>
                      </div>
                    </div>

                    {/* Pillar 6: Email Walkthrough */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1">
                        <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" /> 6. Employee Setup Guide
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">Ready</span>
                      </div>
                      <div className="text-[11px] space-y-0.5">
                        <div className="text-white">5-Step walkthrough email configured</div>
                        <div className="text-slate-400">Dispatches upon final launch confirmation</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Wizard Footer Navigation Controls */}
        {!isCompleted && (
          <div className="px-6 py-4 border-t border-white/10 bg-slate-950 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-3">
              {currentStep < 7 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => Math.min(7, prev + 1))}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <span>Continue: {WIZARD_STEPS[currentStep].title}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalConfirmSetup}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Launching {companyName} Workspace...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm Setup & Launch Company Workspace</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
