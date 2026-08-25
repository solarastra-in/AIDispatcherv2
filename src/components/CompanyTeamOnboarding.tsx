import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Cpu, 
  Mail, 
  DollarSign, 
  Layers, 
  RefreshCw, 
  Search, 
  ChevronRight, 
  Send,
  Zap,
  Globe,
  Sliders,
  CheckCircle2,
  Key,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Crown,
  UserCheck,
  FileSpreadsheet,
  Upload,
  Download,
  FileText,
  ShieldAlert,
  ArrowRight,
  UserCog,
  Filter,
  CheckCircle,
  Copy,
  Info,
  ArrowLeft
} from 'lucide-react';
import { 
  CompanyFirestore, 
  TeamFirestore, 
  saveCompanyToFirestore, 
  loadCompaniesFromFirestore, 
  deleteCompanyFromFirestore, 
  saveTeamToFirestore, 
  loadTeamsFromFirestore, 
  deleteTeamFromFirestore,
  recordAuditLogToFirestore,
  logEmailToFirestore,
  saveSmtpSettingsToFirestore,
  loadSmtpSettingsFromFirestore,
  CompanySsoSettings
} from '../lib/firebase';
import { CompanyAdminUser, CorporateAdminPrivileges } from '../types';
import { resolveApiUrl } from '../lib/firebaseClient';
import { User } from 'firebase/auth';

const AVAILABLE_MODELS = [
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Hybrid Speed & Reasoning)', tier: 'Fast Tier 1', provider: 'Google', defaultChecked: true },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Ultra-Low Latency)', tier: 'Fast Tier 1', provider: 'Google', defaultChecked: true },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (Frontier Coding & Math)', tier: 'Frontier Tier 3', provider: 'Google', defaultChecked: true },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid Reasoning)', tier: 'Frontier Tier 3', provider: 'Anthropic', defaultChecked: true },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (High-Speed Code/Chat)', tier: 'Fast Tier 1', provider: 'Anthropic', defaultChecked: true },
  { id: 'gpt-4o', name: 'GPT-4o (Omni Production Model)', tier: 'General Tier 2', provider: 'OpenAI', defaultChecked: true },
  { id: 'gpt-4.5-preview', name: 'GPT-4.5 Orion (Next-Gen World Knowledge)', tier: 'Frontier Tier 3', provider: 'OpenAI', defaultChecked: true },
  { id: 'o3-mini', name: 'OpenAI o3-mini (High-Speed STEM Reasoning)', tier: 'General Tier 2', provider: 'OpenAI', defaultChecked: true },
  { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Open Reasoning Engine)', tier: 'Frontier Tier 3', provider: 'DeepSeek', defaultChecked: true },
  { id: 'deepseek-chat', name: 'DeepSeek V3 (High-Throughput Chat)', tier: 'Fast Tier 1', provider: 'DeepSeek', defaultChecked: true },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq LPU Instant)', tier: 'Fast Tier 1', provider: 'Groq', defaultChecked: true },
  { id: 'mistral-large-latest', name: 'Mistral Large 2 (Sovereign European AI)', tier: 'General Tier 2', provider: 'Mistral', defaultChecked: true },
];

const DEFAULT_CORPORATE_PRIVILEGES: CorporateAdminPrivileges = {
  // Team Creation & Hierarchy Controls
  canCreateTeams: true,
  maxTeamsAllowed: 10,
  canAssignTeamLeads: true,
  canDeleteTeams: true,
  canSetTeamBudgets: true,
  allowedTeamTiers: ['low', 'mid', 'high', 'frontier', 'deep_reasoning'],

  // BYOK Management Controls
  canManageBYOK: true,
  canAddProviderKeys: true,
  canDeleteProviderKeys: true,
  canToggleSubscriptionFallback: true,
  canEnforceTeamKeyInheritance: true,
  allowedBYOKProviders: ['google', 'openai', 'anthropic', 'deepseek', 'groq', 'mistral'],

  // Budget, Member & Platform Policies
  canManageBudgets: true,
  maxBudgetAllocatedUsd: 5000,
  canInviteMembers: true,
  canConfigureRouting: true,
  canViewTelemetry: true,
  canManageSmtpAlerts: true,
  canManageCompanyProfile: true,
};

const DEFAULT_COMPANIES: CompanyFirestore[] = [
  {
    id: 'comp_solarastra',
    name: 'SolarAstra Energy Systems',
    domain: 'solarastra.in',
    industry: 'CleanTech & Renewable Energy AI',
    tier: 'enterprise',
    billingEmail: 'solarastra.in@gmail.com',
    monthlyTokenQuota: 100_000_000,
    monthlyTokensUsed: 0,
    monthlyBudgetUsd: 5000,
    allowedModels: ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'claude-3-7-sonnet-20250219', 'deepseek-reasoner', 'gpt-4.5-preview'],
    routingPriority: 'subscription_first',
    smtpAlertsEnabled: true,
    superAdminEmail: 'solarastra.in@gmail.com',
    companyAdminEmail: 'elena.rostova@solarastra.in',
    companyAdmins: [
      {
        id: 'admin_elena_01',
        name: 'Elena Rostova',
        email: 'elena.rostova@solarastra.in',
        role: 'corporate_admin',
        title: 'Director of AI Engineering & Infrastructure',
        tierCap: 'Frontier Tier 3',
        monthlyTokenQuota: 50_000_000,
        monthlyTokensUsed: 3_200_000,
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
          maxBudgetAllocatedUsd: 5000,
          canInviteMembers: true,
          canConfigureRouting: true,
          canViewTelemetry: true,
          canManageSmtpAlerts: true,
          canManageCompanyProfile: true,
        },
        status: 'active',
        assignedBy: 'solarastra.in@gmail.com',
        assignedAt: '2025-01-15T00:00:00.000Z',
        lastActiveAt: '2025-02-24T10:30:00.000Z',
      }
    ],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const DEFAULT_TEAMS: TeamFirestore[] = [
  {
    id: 'team_solar_grid',
    companyId: 'comp_solarastra',
    companyName: 'SolarAstra Energy Systems',
    name: 'AI Engineering Lab',
    leadEmail: 'solarastra.in@gmail.com',
    tierCap: 'Frontier Tier 3 (Reasoning)',
    monthlyTokenQuota: 50_000_000,
    monthlyTokensUsed: 0,
    monthlyBudgetUsd: 2500,
    allowedModels: ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'claude-3-7-sonnet-20250219', 'deepseek-reasoner', 'gpt-4.5-preview'],
    members: [
      {
        id: 'mem_superadmin',
        name: 'SuperAdmin',
        email: 'solarastra.in@gmail.com',
        role: 'SuperAdmin / Lead Scientist',
        tierCap: 'Frontier Tier 3',
        monthlyTokenQuota: 50_000_000,
        monthlyTokensUsed: 0,
        joinedAt: new Date().toISOString().split('T')[0],
        status: 'active',
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

interface CompanyTeamOnboardingProps {
  currentUser: User | null;
  onNavigateTab?: (tab: string) => void;
}

export const CompanyTeamOnboarding: React.FC<CompanyTeamOnboardingProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [companies, setCompanies] = useState<CompanyFirestore[]>(DEFAULT_COMPANIES);
  const [teams, setTeams] = useState<TeamFirestore[]>(DEFAULT_TEAMS);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('comp_solarastra');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modals
  const [showOnboardCompanyModal, setShowOnboardCompanyModal] = useState<boolean>(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState<boolean>(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState<boolean>(false);
  const [showCorpAdminModal, setShowCorpAdminModal] = useState<boolean>(false);
  const [activeTeamForInvite, setActiveTeamForInvite] = useState<TeamFirestore | null>(null);

  // Corporate Admin Modal State
  const [editingCorpAdmin, setEditingCorpAdmin] = useState<CompanyAdminUser | null>(null);
  const [corpAdminName, setCorpAdminName] = useState<string>('');
  const [corpAdminEmail, setCorpAdminEmail] = useState<string>('');
  const [corpAdminTitle, setCorpAdminTitle] = useState<string>('Director of AI Infrastructure');
  const [corpAdminTierCap, setCorpAdminTierCap] = useState<string>('Frontier Tier 3');
  const [corpAdminQuota, setCorpAdminQuota] = useState<number>(50_000_000);
  const [corpAdminPrivileges, setCorpAdminPrivileges] = useState<CorporateAdminPrivileges>(DEFAULT_CORPORATE_PRIVILEGES);
  const [corpAdminSendEmail, setCorpAdminSendEmail] = useState<boolean>(true);
  const [isSubmittingCorpAdmin, setIsSubmittingCorpAdmin] = useState<boolean>(false);
  const [dispatchingCorpAdminEmail, setDispatchingCorpAdminEmail] = useState<string | null>(null);

  // New Company Form State
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newCompanyDomain, setNewCompanyDomain] = useState<string>('');
  const [newCompanyIndustry, setNewCompanyIndustry] = useState<string>('Enterprise AI & Software');
  const [newCompanyTier, setNewCompanyTier] = useState<'enterprise' | 'growth' | 'startup' | 'gov_defense'>('enterprise');
  const [newCompanyBillingEmail, setNewCompanyBillingEmail] = useState<string>('solarastra.in@gmail.com');
  const [newCompanyQuota, setNewCompanyQuota] = useState<number>(50_000_000);
  const [newCompanyBudget, setNewCompanyBudget] = useState<number>(3000);
  const [newCompanyRouting, setNewCompanyRouting] = useState<'subscription_first' | 'byok_first' | 'balanced'>('subscription_first');
  const [newCompanyModels, setNewCompanyModels] = useState<string[]>([
    'gemini-3.7-flash', 
    'gemini-3.1-flash-lite', 
    'claude-3-7-sonnet-20250219', 
    'gpt-4o', 
    'deepseek-reasoner'
  ]);
  const [newCompanySmtpAlerts, setNewCompanySmtpAlerts] = useState<boolean>(true);
  const [isSubmittingCompany, setIsSubmittingCompany] = useState<boolean>(false);

  // Designated Corporate Admin Form State
  const [newCorpAdminName, setNewCorpAdminName] = useState<string>('Elena Rostova');
  const [newCorpAdminEmail, setNewCorpAdminEmail] = useState<string>('elena.admin@solarastra.in');
  const [newCorpAdminTitle, setNewCorpAdminTitle] = useState<string>('Director of AI Engineering');
  const [newCorpAdminPrivileges, setNewCorpAdminPrivileges] = useState<CorporateAdminPrivileges>(DEFAULT_CORPORATE_PRIVILEGES);

  // Multi-Step Create Company Wizard State (5 Steps as requested)
  // Step 1: Define Company Name
  // Step 2: Input Company Admin Email
  // Step 3: Confirm budgets, models and other relevant details
  // Step 4: Send email notification to Company Admin with detailed steps to setup
  // Step 5: Confirm Setup
  const [companyWizardStep, setCompanyWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [hasAttemptedAdminStep, setHasAttemptedAdminStep] = useState<boolean>(false);
  const [adminStepError, setAdminStepError] = useState<string | null>(null);
  const [customSetupInstructions, setCustomSetupInstructions] = useState<string>(
    'Please follow the steps below to configure your corporate teams, connect enterprise BYOK keys, and allocate member quotas.'
  );
  const [isSendingWizardEmail, setIsSendingWizardEmail] = useState<boolean>(false);
  const [wizardEmailDispatchStatus, setWizardEmailDispatchStatus] = useState<{
    sent: boolean;
    timestamp?: string;
    message?: string;
    latencyMs?: number;
    error?: string;
  } | null>(null);
  const [autoDispatchOnConfirm, setAutoDispatchOnConfirm] = useState<boolean>(true);
  const [wizardCompletedCompany, setWizardCompletedCompany] = useState<CompanyFirestore | null>(null);

  // Helper for email regex validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Step validation helpers
  const isWizardStep1Valid = Boolean(
    newCompanyName.trim().length >= 2 && 
    newCompanyDomain.trim().length >= 2 && 
    (!newCompanyBillingEmail.trim() || isValidEmail(newCompanyBillingEmail))
  );

  const isWizardStep2Valid = Boolean(
    newCorpAdminName.trim().length >= 2 && 
    newCorpAdminEmail.trim().length >= 3 && 
    isValidEmail(newCorpAdminEmail)
  );

  const isWizardStep3Valid = Boolean(
    newCompanyModels.length > 0 && 
    newCompanyQuota > 0 && 
    newCompanyBudget > 0
  );

  const isWizardStep4Valid = Boolean(
    isWizardStep1Valid && isWizardStep2Valid && isWizardStep3Valid
  );

  const handleOpenCreateCompanyWizard = () => {
    setCompanyWizardStep(1);
    setHasAttemptedAdminStep(false);
    setAdminStepError(null);
    setWizardEmailDispatchStatus(null);
    setWizardCompletedCompany(null);
    setShowOnboardCompanyModal(true);
  };

  const handleSendWizardSetupEmail = async () => {
    const cleanAdminEmail = newCorpAdminEmail.trim().toLowerCase();
    if (!cleanAdminEmail || !isValidEmail(cleanAdminEmail)) {
      setAdminStepError('Please input a valid Company Admin email in Step 2 before testing email delivery.');
      return;
    }

    setIsSendingWizardEmail(true);
    setWizardEmailDispatchStatus(null);

    try {
      const companyVars = {
        '{{recipient_name}}': newCorpAdminName.trim() || 'Company Administrator',
        '{{recipient_email}}': cleanAdminEmail,
        '{{company_name}}': newCompanyName.trim() || 'Enterprise Workspace',
        '{{allocated_tokens}}': `${newCompanyQuota.toLocaleString()} tokens / month`,
        '{{budget_limit}}': `$${newCompanyBudget.toLocaleString()} / month`,
        '{{tenant_domain}}': newCompanyDomain.trim() || 'enterprise.ai',
        '{{authorized_models}}': newCompanyModels.join(', '),
        '{{routing_priority}}': newCompanyRouting === 'byok_first' ? 'BYOK Dedicated Priority' : 'Zero-Markup Flat-Rate Subscriptions',
        '{{custom_message}}': customSetupInstructions || 'Follow the step-by-step setup guide below to configure your corporate workspace.',
      };

      const res = await fetch(resolveApiUrl('/api/admin/smtp/send-test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanAdminEmail,
          subject: `🏢 [WhyOr Enterprise] Setup Instructions: Your ${newCompanyName.trim() || 'Company'} AI Workspace is Ready`,
          templateType: 'company_onboarded',
          recipientName: newCorpAdminName.trim() || 'Company Administrator',
          companyName: newCompanyName.trim() || 'Enterprise Workspace',
          allocatedTokens: `${newCompanyQuota.toLocaleString()} tokens / month`,
          budgetLimit: `$${newCompanyBudget.toLocaleString()} / month`,
          tenantDomain: newCompanyDomain.trim() || 'enterprise.ai',
          authorizedModels: newCompanyModels.join(', '),
          routingPriority: newCompanyRouting === 'byok_first' ? 'BYOK Dedicated Priority' : 'Zero-Markup Flat-Rate Subscriptions',
          customMessage: customSetupInstructions || 'Follow the step-by-step setup guide below to configure your corporate workspace.',
          sentBy: currentUser?.email || 'solarastra.in@gmail.com',
          variables: companyVars,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setWizardEmailDispatchStatus({
          sent: true,
          timestamp: new Date().toLocaleTimeString(),
          message: `Setup instructions email dispatched via SMTP relay to ${cleanAdminEmail}`,
          latencyMs: data.latencyMs,
        });
      } else {
        setWizardEmailDispatchStatus({
          sent: false,
          error: data.error || 'Failed to dispatch email. Check SMTP server settings.',
        });
      }
    } catch (err: any) {
      setWizardEmailDispatchStatus({
        sent: false,
        error: err.message || 'Network error connecting to SMTP relay service.',
      });
    } finally {
      setIsSendingWizardEmail(false);
    }
  };

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamLeadEmail, setNewTeamLeadEmail] = useState<string>('');
  const [newTeamTierCap, setNewTeamTierCap] = useState<string>('Frontier Tier 3 (Reasoning)');
  const [newTeamQuota, setNewTeamQuota] = useState<number>(20_000_000);
  const [newTeamBudget, setNewTeamBudget] = useState<number>(1000);
  const [newTeamModels, setNewTeamModels] = useState<string[]>([
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'claude-3-7-sonnet-20250219',
    'gpt-4o'
  ]);

  // Invite Member Form State
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('Senior AI Developer');
  const [inviteTierCap, setInviteTierCap] = useState<string>('Frontier Tier 3');
  const [inviteQuota, setInviteQuota] = useState<number>(10_000_000);
  const [dispatchSmtpWelcomeEmail, setDispatchSmtpWelcomeEmail] = useState<boolean>(true);
  const [isDispatchingEmail, setIsDispatchingEmail] = useState<boolean>(false);
  const [dispatchingMemberId, setDispatchingMemberId] = useState<string | null>(null);

  // SMTP Settings & Quick Setup Modal State
  const [smtpStatus, setSmtpStatus] = useState<{
    hasPassword: boolean;
    host: string;
    port: number;
    user: string;
    fromEmail: string;
    isVerified: boolean;
  } | null>(null);
  const [showSmtpQuickConfigModal, setShowSmtpQuickConfigModal] = useState<boolean>(false);
  const [targetMemberForEmail, setTargetMemberForEmail] = useState<{ member: any; team: TeamFirestore } | null>(null);
  const [quickSmtpHost, setQuickSmtpHost] = useState<string>('smtp.gmail.com');
  const [quickSmtpPort, setQuickSmtpPort] = useState<number>(587);
  const [quickSmtpUser, setQuickSmtpUser] = useState<string>('solarastra.in@gmail.com');
  const [quickSmtpPass, setQuickSmtpPass] = useState<string>('');
  const [showQuickPass, setShowQuickPass] = useState<boolean>(false);
  const [quickSmtpSecure, setQuickSmtpSecure] = useState<boolean>(false);
  const [isSavingQuickSmtp, setIsSavingQuickSmtp] = useState<boolean>(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState<boolean>(false);
  const [quickSmtpNotice, setQuickSmtpNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Custom in-app confirmation modal (replaces window.confirm for iframe sandbox safety)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    onConfirm: () => {}
  });

  // Active tab inside selected company view: 'roster_teams' | 'bulk_seeding' | 'sso_directory'
  const [activeSectionTab, setActiveSectionTab] = useState<'roster_teams' | 'bulk_seeding' | 'sso_directory'>('roster_teams');

  // Guardrail Modal State (Enforcing Company Admin before creating teams/members)
  const [showAdminRequiredGuardrailModal, setShowAdminRequiredGuardrailModal] = useState<boolean>(false);
  const [guardrailPendingAction, setGuardrailPendingAction] = useState<'create_team' | 'invite_member' | 'bulk_upload' | null>(null);

  // Bulk CSV Employee Seeding State
  const [showBulkUploadModal, setShowBulkUploadModal] = useState<boolean>(false);
  const [bulkCsvText, setBulkCsvText] = useState<string>(
`Full Name, Email, Role, Team, Model Tier, Monthly Token Quota, Monthly Budget ($)
Elena Rostova, elena.dev@testing123.com, Senior AI Developer, AI Core Lab, Frontier Tier 3, 25000000, 1000
David Kim, david.k@testing123.com, AI / ML Engineer, AI Core Lab, Frontier Tier 3, 20000000, 800
Sarah Jenkins, s.jenkins@testing123.com, Product Manager (AI), Product Innovation, General Tier 2, 10000000, 500
Michael Chang, m.chang@testing123.com, Prompt & QA Engineer, Validation Team, Fast Tier 1, 10000000, 400
Aisha Patel, aisha.p@testing123.com, Staff AI Researcher, Research & Deep Reasoning, Frontier Tier 3, 30000000, 1500`
  );
  const [bulkParsedMembers, setBulkParsedMembers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    teamName: string;
    tierCap: string;
    monthlyTokenQuota: number;
    monthlyBudgetUsd: number;
    status: 'valid' | 'invalid_email' | 'missing_fields' | 'duplicate';
    errorMessage?: string;
  }>>([]);
  const [bulkAutoCreateTeams, setBulkAutoCreateTeams] = useState<boolean>(true);
  const [bulkSendSmtpEmails, setBulkSendSmtpEmails] = useState<boolean>(true);
  const [isImportingBulk, setIsImportingBulk] = useState<boolean>(false);

  // Enterprise SSO & Domain Directory State
  const [ssoDomainInput, setSsoDomainInput] = useState<string>('');
  const [ssoAutoProvisionEnabled, setSsoAutoProvisionEnabled] = useState<boolean>(true);
  const [ssoDefaultTeamId, setSsoDefaultTeamId] = useState<string>('');
  const [ssoDefaultRole, setSsoDefaultRole] = useState<string>('Senior AI Developer');
  const [ssoDefaultTierCap, setSsoDefaultTierCap] = useState<string>('Frontier Tier 3');
  const [ssoDefaultMonthlyQuota, setSsoDefaultMonthlyQuota] = useState<number>(20_000_000);
  const [ssoAutoDispatchEmail, setSsoAutoDispatchEmail] = useState<boolean>(true);
  const [ssoTestEmail, setSsoTestEmail] = useState<string>('');
  const [ssoTestOutput, setSsoTestOutput] = useState<{ match: boolean; details: any } | null>(null);
  const [isSavingSso, setIsSavingSso] = useState<boolean>(false);

  // Fetch initial data from Firestore & SMTP status
  useEffect(() => {
    loadCloudData();
    checkSmtpStatus();
  }, []);

  const checkSmtpStatus = async () => {
    try {
      const res = await fetch(resolveApiUrl('/api/admin/smtp'));
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSmtpStatus(data.settings);
          setQuickSmtpHost(data.settings.host || 'smtp.gmail.com');
          setQuickSmtpPort(data.settings.port || 587);
          setQuickSmtpUser(data.settings.user || 'solarastra.in@gmail.com');
          setQuickSmtpSecure(data.settings.secure || false);
        }
      }
    } catch (e) {
      console.warn('Could not check SMTP status:', e);
    }
  };

  const loadCloudData = async () => {
    setIsLoading(true);
    try {
      const cloudComps = await loadCompaniesFromFirestore();
      if (cloudComps.length > 0) {
        setCompanies(cloudComps);
        setSelectedCompanyId(cloudComps[0].id);
      } else {
        // Seed default companies to Firestore
        for (const c of DEFAULT_COMPANIES) {
          await saveCompanyToFirestore(c);
        }
      }

      const cloudTeams = await loadTeamsFromFirestore();
      if (cloudTeams.length > 0) {
        setTeams(cloudTeams);
      } else {
        // Seed default teams to Firestore
        for (const t of DEFAULT_TEAMS) {
          await saveTeamToFirestore(t);
        }
      }
    } catch (err) {
      console.warn('Using local fallback for companies & teams');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0] || DEFAULT_COMPANIES[0];
  const companyTeams = teams.filter(t => t.companyId === selectedCompany.id);
  const hasNoAdmins = !selectedCompany.companyAdmins || selectedCompany.companyAdmins.length === 0;

  // Sync SSO state when selected company changes
  useEffect(() => {
    if (selectedCompany) {
      setSsoDomainInput(selectedCompany.ssoSettings?.ssoDomain || selectedCompany.domain || '');
      setSsoAutoProvisionEnabled(selectedCompany.ssoSettings?.enabled ?? true);
      setSsoDefaultTeamId(selectedCompany.ssoSettings?.defaultTeamId || (companyTeams[0]?.id || ''));
      setSsoDefaultRole(selectedCompany.ssoSettings?.defaultRole || 'Senior AI Developer');
      setSsoDefaultTierCap(selectedCompany.ssoSettings?.defaultTierCap || 'Frontier Tier 3');
      setSsoDefaultMonthlyQuota(selectedCompany.ssoSettings?.defaultMonthlyTokenQuota || 20_000_000);
      setSsoAutoDispatchEmail(selectedCompany.ssoSettings?.autoDispatchWelcomeEmail ?? true);
      setSsoTestOutput(null);
    }
  }, [selectedCompanyId, selectedCompany]);

  // Guardrail action openers
  const handleOpenCreateTeamGuardrail = () => {
    if (hasNoAdmins) {
      setGuardrailPendingAction('create_team');
      setShowAdminRequiredGuardrailModal(true);
    } else {
      setShowAddTeamModal(true);
    }
  };

  const handleOpenInviteMemberGuardrail = (team?: TeamFirestore) => {
    if (team) setActiveTeamForInvite(team);
    if (hasNoAdmins) {
      setGuardrailPendingAction('invite_member');
      setShowAdminRequiredGuardrailModal(true);
    } else {
      setShowInviteMemberModal(true);
    }
  };

  const handleOpenBulkUploadGuardrail = () => {
    if (hasNoAdmins) {
      setGuardrailPendingAction('bulk_upload');
      setShowAdminRequiredGuardrailModal(true);
    } else {
      setShowBulkUploadModal(true);
    }
  };

  // Promote Member to Corporate Admin
  const handlePromoteMemberToAdmin = async (mem: any, team: TeamFirestore) => {
    setConfirmDialog({
      isOpen: true,
      title: '👑 Promote to Corporate Administrator',
      description: `Promote ${mem.name} (${mem.email}) from team '${team.name}' to Corporate Administrator for '${selectedCompany.name}'? They will be granted delegated authority over departmental teams, BYOK credentials, budgets, and employee onboarding.`,
      confirmText: 'Promote to Corporate Admin',
      onConfirm: async () => {
        const newAdmin: CompanyAdminUser = {
          id: `admin_corp_${Date.now().toString(36)}`,
          name: mem.name,
          email: mem.email.toLowerCase(),
          role: 'corporate_admin',
          title: mem.role || 'Corporate Administrator',
          tierCap: mem.tierCap || 'Frontier Tier 3',
          monthlyTokenQuota: mem.monthlyTokenQuota || selectedCompany.monthlyTokenQuota || 50_000_000,
          monthlyTokensUsed: mem.monthlyTokensUsed || 0,
          privileges: DEFAULT_CORPORATE_PRIVILEGES,
          status: 'active',
          assignedBy: currentUser?.email || 'solarastra.in@gmail.com',
          assignedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        };

        const existingAdmins = selectedCompany.companyAdmins || [];
        const updatedAdmins = [...existingAdmins.filter(a => a.email.toLowerCase() !== mem.email.toLowerCase()), newAdmin];

        const updatedCompany: CompanyFirestore = {
          ...selectedCompany,
          companyAdmins: updatedAdmins,
          companyAdminEmail: updatedAdmins[0]?.email || mem.email,
          updatedAt: new Date().toISOString(),
        };

        setCompanies(companies.map(c => c.id === updatedCompany.id ? updatedCompany : c));
        await saveCompanyToFirestore(updatedCompany);

        await recordAuditLogToFirestore(
          'Promote to Corporate Admin',
          'governance',
          currentUser?.email || 'solarastra.in@gmail.com',
          `Promoted member '${mem.name}' (${mem.email}) to Corporate Administrator for '${selectedCompany.name}'.`
        );

        setNotice({
          type: 'success',
          text: `👑 Successfully promoted ${mem.name} (${mem.email}) to Corporate Administrator for ${selectedCompany.name}!`
        });
      }
    });
  };

  // Parse Bulk CSV
  const parseBulkCsv = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];

    const rows: typeof bulkParsedMembers = [];
    const seenEmails = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip header line
      if (i === 0 && (line.toLowerCase().includes('email') || line.toLowerCase().includes('name'))) {
        continue;
      }

      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 2) continue;

      const name = parts[0] || '';
      const email = (parts[1] || '').toLowerCase();
      const role = parts[2] || 'Senior AI Developer';
      const teamName = parts[3] || 'AI Core Lab';
      const tierCap = parts[4] || 'Frontier Tier 3';
      const tokenQuota = Number(parts[5]) || 20_000_000;
      const budget = Number(parts[6]) || 800;

      let status: 'valid' | 'invalid_email' | 'missing_fields' | 'duplicate' = 'valid';
      let errorMessage: string | undefined = undefined;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!name || !email) {
        status = 'missing_fields';
        errorMessage = 'Missing name or email';
      } else if (!emailRegex.test(email)) {
        status = 'invalid_email';
        errorMessage = 'Invalid email syntax';
      } else if (seenEmails.has(email)) {
        status = 'duplicate';
        errorMessage = 'Duplicate email in roster';
      } else {
        seenEmails.add(email);
      }

      rows.push({
        id: `bulk_${i}_${Date.now().toString(36)}`,
        name,
        email,
        role,
        teamName,
        tierCap,
        monthlyTokenQuota: tokenQuota,
        monthlyBudgetUsd: budget,
        status,
        errorMessage
      });
    }

    return rows;
  };

  // Execute Bulk Import
  const handleExecuteBulkImport = async () => {
    const validRows = bulkParsedMembers.filter(r => r.status === 'valid');
    if (validRows.length === 0) {
      setNotice({ type: 'error', text: 'No valid employee rows to import. Please check your CSV format.' });
      return;
    }

    setIsImportingBulk(true);
    try {
      let currentTeams = [...teams];
      const teamsToUpdate = new Map<string, TeamFirestore>();

      for (const row of validRows) {
        // Find or create team for this company
        let targetTeam = currentTeams.find(
          t => t.companyId === selectedCompany.id && t.name.toLowerCase() === row.teamName.toLowerCase()
        );

        if (!targetTeam) {
          if (bulkAutoCreateTeams) {
            const newTeamId = `team_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
            targetTeam = {
              id: newTeamId,
              companyId: selectedCompany.id,
              companyName: selectedCompany.name,
              name: row.teamName,
              leadEmail: row.email,
              tierCap: row.tierCap || 'Frontier Tier 3 (Reasoning)',
              monthlyTokenQuota: 50_000_000,
              monthlyTokensUsed: 0,
              monthlyBudgetUsd: 2500,
              allowedModels: selectedCompany.allowedModels || ['gemini-3.7-flash', 'claude-3-7-sonnet-20250219', 'gpt-4o'],
              members: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            currentTeams.push(targetTeam);
          } else {
            targetTeam = currentTeams.find(t => t.companyId === selectedCompany.id);
          }
        }

        if (targetTeam) {
          const newMember = {
            id: `mem_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
            name: row.name,
            email: row.email,
            role: row.role,
            tierCap: row.tierCap,
            monthlyTokenQuota: row.monthlyTokenQuota,
            monthlyTokensUsed: 0,
            joinedAt: new Date().toISOString(),
            status: 'active',
            emailStatus: bulkSendSmtpEmails ? 'sent' : 'not_sent',
          };

          const existingMembers = targetTeam.members || [];
          const filtered = existingMembers.filter(m => m.email.toLowerCase() !== row.email.toLowerCase());
          const updatedTeam: TeamFirestore = {
            ...targetTeam,
            members: [...filtered, newMember],
            updatedAt: new Date().toISOString(),
          };

          teamsToUpdate.set(targetTeam.id, updatedTeam);
          currentTeams = currentTeams.map(t => t.id === targetTeam!.id ? updatedTeam : t);
        }
      }

      // Persist all updated / created teams to Firestore
      for (const team of Array.from(teamsToUpdate.values())) {
        await saveTeamToFirestore(team);
      }

      setTeams(currentTeams);

      await recordAuditLogToFirestore(
        'Bulk Employee Seeding',
        'onboarding',
        currentUser?.email || 'solarastra.in@gmail.com',
        `Bulk seeded ${validRows.length} employees across ${teamsToUpdate.size} teams for company '${selectedCompany.name}'.`
      );

      // Dispatch background SMTP welcome emails if requested
      if (bulkSendSmtpEmails) {
        for (const row of validRows) {
          fetch(resolveApiUrl('/api/admin/smtp/send-test'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: row.email,
              subject: `🚀 [WhyOr Dispatch] Welcome to ${selectedCompany.name} AI Lab — Workspace Credentials & Token Quota`,
              templateType: 'member_invited',
              recipientName: row.name,
              teamName: row.teamName,
              companyName: selectedCompany.name,
              allocatedTokens: `${(row.monthlyTokenQuota / 1_000_000).toFixed(0)}M tokens / month`,
              budgetLimit: `$${row.monthlyBudgetUsd.toLocaleString()} / month`,
              assignedRole: row.role,
              tierCap: row.tierCap,
              sentBy: currentUser?.email || 'solarastra.in@gmail.com',
            }),
          }).catch(() => {});
        }
      }

      setShowBulkUploadModal(false);
      setNotice({
        type: 'success',
        text: `✓ Successfully seeded ${validRows.length} employees across ${teamsToUpdate.size} teams for ${selectedCompany.name}!`
      });
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: `Bulk import failed: ${err?.message || err}`
      });
    } finally {
      setIsImportingBulk(false);
    }
  };

  // Save SSO Settings
  const handleSaveSsoSettings = async () => {
    setIsSavingSso(true);
    try {
      const ssoSettings: CompanySsoSettings = {
        enabled: ssoAutoProvisionEnabled,
        ssoDomain: ssoDomainInput.trim() || selectedCompany.domain,
        defaultTeamId: ssoDefaultTeamId || companyTeams[0]?.id,
        defaultRole: ssoDefaultRole,
        defaultTierCap: ssoDefaultTierCap,
        defaultMonthlyTokenQuota: ssoDefaultMonthlyQuota,
        autoDispatchWelcomeEmail: ssoAutoDispatchEmail
      };

      const updatedCompany: CompanyFirestore = {
        ...selectedCompany,
        ssoSettings,
        updatedAt: new Date().toISOString()
      };

      setCompanies(companies.map(c => c.id === updatedCompany.id ? updatedCompany : c));
      await saveCompanyToFirestore(updatedCompany);

      fetch(resolveApiUrl(`/api/admin/companies/${selectedCompany.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssoDomain: ssoSettings.ssoDomain,
          domain: ssoSettings.ssoDomain
        })
      }).catch(() => {});

      await recordAuditLogToFirestore(
        'Update SSO & Directory Settings',
        'governance',
        currentUser?.email || 'solarastra.in@gmail.com',
        `Updated SSO auto-provisioning rules for '${selectedCompany.name}' (domain: ${ssoSettings.ssoDomain}, auto-provision: ${ssoSettings.enabled}).`
      );

      setNotice({
        type: 'success',
        text: `🔐 Enterprise SSO & Directory settings saved for ${selectedCompany.name}!`
      });
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: `Failed to save SSO settings: ${err?.message || err}`
      });
    } finally {
      setIsSavingSso(false);
    }
  };

  // Test SSO Match Simulator
  const handleTestSsoMatch = (email: string) => {
    if (!email || !email.includes('@')) {
      setSsoTestOutput({
        match: false,
        details: { reason: 'Please enter a valid email address with domain (e.g. dev1@testing123.com)' }
      });
      return;
    }

    const domain = email.split('@')[1]?.toLowerCase().trim();
    const configuredDomain = (ssoDomainInput || selectedCompany.ssoSettings?.ssoDomain || selectedCompany.domain || '').toLowerCase().trim();

    if (domain === configuredDomain) {
      setSsoTestOutput({
        match: true,
        details: {
          email,
          domain,
          company: selectedCompany.name,
          teamName: companyTeams.find(t => t.id === ssoDefaultTeamId)?.name || companyTeams[0]?.name || 'AI Core Lab',
          role: ssoDefaultRole,
          tierCap: ssoDefaultTierCap,
          quota: `${(ssoDefaultMonthlyQuota / 1_000_000).toFixed(0)}M tokens/month`,
          status: ssoAutoProvisionEnabled ? 'Auto-Provision Approved' : 'SSO Domain Matched (Auto-Provision Disabled)'
        }
      });
    } else {
      setSsoTestOutput({
        match: false,
        details: {
          email,
          domain,
          configuredDomain,
          reason: `Domain '@${domain}' does not match company SSO domain '@${configuredDomain}'.`
        }
      });
    }
  };

  // Model selection toggler for Company
  const toggleCompanyModel = (modelId: string) => {
    if (newCompanyModels.includes(modelId)) {
      if (newCompanyModels.length > 1) {
        setNewCompanyModels(newCompanyModels.filter(m => m !== modelId));
      }
    } else {
      setNewCompanyModels([...newCompanyModels, modelId]);
    }
  };

  // Model selection toggler for Team
  const toggleTeamModel = (modelId: string) => {
    if (newTeamModels.includes(modelId)) {
      if (newTeamModels.length > 1) {
        setNewTeamModels(newTeamModels.filter(m => m !== modelId));
      }
    } else {
      setNewTeamModels([...newTeamModels, modelId]);
    }
  };

  // Create Company Handler with Optimistic UI & Rollback on duplicate / error
  const handleOnboardCompanySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingCompany) return;

    if (!newCompanyName.trim() || newCompanyName.trim().length < 2) {
      setCompanyWizardStep(1);
      setNotice({
        type: 'error',
        text: 'Company Legal Name is required (minimum 2 characters).'
      });
      return;
    }

    if (!newCompanyDomain.trim() || newCompanyDomain.trim().length < 2) {
      setCompanyWizardStep(1);
      setNotice({
        type: 'error',
        text: 'Corporate Email Domain is required (e.g. acme.com).'
      });
      return;
    }

    // Strict Enforcement of Designated Corporate Admin
    const cleanAdminEmail = newCorpAdminEmail.trim().toLowerCase();
    const cleanAdminName = newCorpAdminName.trim();
    
    if (!cleanAdminEmail || !isValidEmail(cleanAdminEmail) || !cleanAdminName || cleanAdminName.length < 2) {
      setCompanyWizardStep(2);
      setHasAttemptedAdminStep(true);
      setAdminStepError('A designated Company Administrator with a valid work email and full name is strictly required.');
      setNotice({
        type: 'error',
        text: 'Enterprise Policy Block: Setup failed because no valid Company Administrator account is linked. Please provide a valid admin email to proceed.'
      });
      return;
    }

    const trimmedName = newCompanyName.trim();
    const trimmedDomain = newCompanyDomain.trim() || 'enterprise.ai';

    // Snapshot current state for rollback mechanism
    const previousCompanies = [...companies];
    const previousSelectedCompanyId = selectedCompanyId;

    setIsSubmittingCompany(true);
    const companyId = `comp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Build initial corporate admin user (MANDATORY for enterprise governance)
    const initialAdmins: CompanyAdminUser[] = [{
      id: `admin_corp_${Date.now().toString(36)}`,
      name: newCorpAdminName.trim() || `${trimmedName} Admin`,
      email: newCorpAdminEmail.trim().toLowerCase(),
      role: 'corporate_admin',
      title: newCorpAdminTitle.trim() || 'Director of AI Engineering',
      tierCap: 'Frontier Tier 3',
      monthlyTokenQuota: Number(newCompanyQuota),
      monthlyTokensUsed: 0,
      privileges: newCorpAdminPrivileges,
      status: 'active',
      assignedBy: currentUser?.email || 'solarastra.in@gmail.com',
      assignedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    }];

    const newCompany: CompanyFirestore = {
      id: companyId,
      name: trimmedName,
      domain: trimmedDomain,
      industry: newCompanyIndustry,
      tier: newCompanyTier,
      billingEmail: newCompanyBillingEmail.trim() || (currentUser?.email || 'solarastra.in@gmail.com'),
      monthlyTokenQuota: Number(newCompanyQuota),
      monthlyTokensUsed: 0,
      monthlyBudgetUsd: Number(newCompanyBudget),
      allowedModels: newCompanyModels,
      routingPriority: newCompanyRouting,
      smtpAlertsEnabled: newCompanySmtpAlerts,
      superAdminEmail: currentUser?.email || 'solarastra.in@gmail.com',
      companyAdminEmail: initialAdmins[0]?.email || newCompanyBillingEmail.trim(),
      companyAdmins: initialAdmins,
      ssoSettings: {
        enabled: true,
        ssoDomain: trimmedDomain,
        defaultRole: 'Senior AI Developer',
        defaultTierCap: 'Frontier Tier 3',
        defaultMonthlyTokenQuota: 20_000_000,
        autoDispatchWelcomeEmail: true
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Optimistically update client-side UI immediately
    setCompanies([newCompany, ...previousCompanies.filter(c => c.id !== companyId)]);
    setSelectedCompanyId(companyId);
    setWizardCompletedCompany(newCompany);
    setCompanyWizardStep(5);
    setNotice({
      type: 'info',
      text: `Provisioning enterprise tenant '${newCompany.name}' with Delegated Corporate Admin...`
    });

    try {
      // 2. Query Server API for verification / duplicate detection
      let serverConfirmedDuplicate = false;
      let serverErrorMsg = '';

      try {
        const serverRes = await fetch(resolveApiUrl('/api/admin/companies'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCompany.name,
            domain: newCompany.domain,
            ssoDomain: newCompany.domain,
            seededGmailAddresses: [newCompany.billingEmail, ...(initialAdmins.map(a => a.email))]
          })
        });

        if (serverRes.status === 409) {
          const errorData = await serverRes.json().catch(() => ({}));
          serverConfirmedDuplicate = true;
          serverErrorMsg = errorData.message || errorData.error || `Duplicate company '${newCompany.name}' already exists.`;
        } else if (!serverRes.ok && serverRes.status !== 404) {
          const errorData = await serverRes.json().catch(() => ({}));
          serverErrorMsg = errorData.message || errorData.error || `Server returned error ${serverRes.status}`;
        }
      } catch (networkErr: any) {
        // Fallback to Firestore validation if server route not reachable
        console.warn('Server validation notice:', networkErr?.message || networkErr);
      }

      if (serverConfirmedDuplicate) {
        throw new Error(`DUPLICATE_CONFIRMED: ${serverErrorMsg}`);
      }

      // 3. Persist to Firestore with duplicate validation check
      await saveCompanyToFirestore(newCompany, { checkDuplicates: true });

      // 4. Record Audit Log
      await recordAuditLogToFirestore(
        'Onboard Company',
        'onboarding',
        currentUser?.email || 'solarastra.in@gmail.com',
        `Onboarded company '${newCompany.name}' (${newCompany.domain}) with Corporate Admin '${initialAdmins[0]?.email || 'None'}' and ${newCompany.monthlyTokenQuota.toLocaleString()} token cap.`
      );

      // 5. If SMTP alerts or auto-dispatch enabled, dispatch detailed setup steps email to corporate admin
      if (newCompanySmtpAlerts || autoDispatchOnConfirm) {
        const companyVars = {
          '{{recipient_name}}': initialAdmins[0]?.name || newCompany.name + ' Administrator',
          '{{recipient_email}}': initialAdmins[0]?.email || newCompany.billingEmail,
          '{{company_name}}': newCompany.name,
          '{{allocated_tokens}}': `${newCompany.monthlyTokenQuota.toLocaleString()} tokens / month`,
          '{{budget_limit}}': `$${newCompany.monthlyBudgetUsd.toLocaleString()} / month`,
          '{{tenant_domain}}': newCompany.domain,
          '{{authorized_models}}': newCompany.allowedModels.join(', '),
          '{{routing_priority}}': newCompany.routingPriority === 'byok_first' ? 'BYOK Dedicated Priority' : 'Zero-Markup Flat-Rate Subscriptions',
          '{{custom_message}}': customSetupInstructions || `Enterprise workspace for ${newCompany.name} has been provisioned on WhyOr Dispatch AI with delegated Corporate Admin authority.`,
        };

        const targetEmail = initialAdmins[0]?.email || newCompany.billingEmail;
        fetch(resolveApiUrl('/api/admin/smtp/send-test'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetEmail,
            subject: `🏢 [WhyOr Enterprise] Setup Instructions: Your ${newCompany.name} AI Workspace is Ready`,
            templateType: 'company_onboarded',
            recipientName: initialAdmins[0]?.name || newCompany.name + ' Administrator',
            companyName: newCompany.name,
            allocatedTokens: `${newCompany.monthlyTokenQuota.toLocaleString()} tokens / month`,
            budgetLimit: `$${newCompany.monthlyBudgetUsd.toLocaleString()} / month`,
            tenantDomain: newCompany.domain,
            authorizedModels: newCompany.allowedModels.join(', '),
            routingPriority: newCompany.routingPriority === 'byok_first' ? 'BYOK Dedicated Priority' : 'Zero-Markup Flat-Rate Subscriptions',
            customMessage: customSetupInstructions || `Company ${newCompany.name} has been successfully provisioned on WhyOr Dispatch AI by SuperAdmin ${currentUser?.email || 'solarastra.in@gmail.com'}. Allocated quota: ${newCompany.monthlyTokenQuota.toLocaleString()} tokens/mo.`,
            sentBy: currentUser?.email || 'solarastra.in@gmail.com',
            variables: companyVars,
          }),
        }).then(() => {
          setWizardEmailDispatchStatus({
            sent: true,
            timestamp: new Date().toLocaleTimeString(),
            message: `Setup email sent to ${targetEmail}`,
          });
        }).catch((mailErr) => {
          console.warn('SMTP welcome email skipped/failed:', mailErr);
        });
      }

      // 6. Final success toast
      setNotice({
        type: 'success',
        text: `Enterprise tenant '${newCompany.name}' and Corporate Admin '${initialAdmins[0]?.email || 'default'}' successfully provisioned!`,
      });
    } catch (err: any) {
      // 7. ROLLBACK: Revert the visual addition immediately and display error toast
      setCompanies(previousCompanies);
      setSelectedCompanyId(previousSelectedCompanyId);
      setWizardCompletedCompany(null);
      setCompanyWizardStep(5);

      const isDuplicate =
        err?.message?.includes('DUPLICATE') ||
        err?.message?.toLowerCase().includes('duplicate') ||
        err?.message?.toLowerCase().includes('already exists');

      const userDisplayError = isDuplicate
        ? `Duplicate Customer Detected: ${err.message.replace(/^DUPLICATE(_CONFIRMED)?:?\s*/, '')}. Changes rolled back.`
        : `Customer Creation Failed: ${err.message}. Changes rolled back.`;

      setNotice({
        type: 'error',
        text: userDisplayError,
      });
    } finally {
      setIsSubmittingCompany(false);
    }
  };

  // Open Corporate Admin Modal (Create new or edit existing)
  const handleOpenCorpAdminModal = (adminToEdit?: CompanyAdminUser) => {
    if (adminToEdit) {
      setEditingCorpAdmin(adminToEdit);
      setCorpAdminName(adminToEdit.name);
      setCorpAdminEmail(adminToEdit.email);
      setCorpAdminTitle(adminToEdit.title || 'Director of AI Engineering');
      setCorpAdminTierCap(adminToEdit.tierCap || 'Frontier Tier 3');
      setCorpAdminQuota(adminToEdit.monthlyTokenQuota || 50_000_000);
      setCorpAdminPrivileges(adminToEdit.privileges || DEFAULT_CORPORATE_PRIVILEGES);
      setCorpAdminSendEmail(false);
    } else {
      setEditingCorpAdmin(null);
      setCorpAdminName('');
      setCorpAdminEmail('');
      setCorpAdminTitle('Director of AI Infrastructure');
      setCorpAdminTierCap('Frontier Tier 3');
      setCorpAdminQuota(50_000_000);
      setCorpAdminPrivileges(DEFAULT_CORPORATE_PRIVILEGES);
      setCorpAdminSendEmail(true);
    }
    setShowCorpAdminModal(true);
  };

  // Submit Corporate Admin
  const handleSaveCorporateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!corpAdminName.trim() || !corpAdminEmail.trim() || isSubmittingCorpAdmin) return;

    setIsSubmittingCorpAdmin(true);
    try {
      const existingAdmins = selectedCompany.companyAdmins || [];
      const adminId = editingCorpAdmin?.id || `admin_corp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      
      const adminObj: CompanyAdminUser = {
        id: adminId,
        name: corpAdminName.trim(),
        email: corpAdminEmail.trim().toLowerCase(),
        role: 'corporate_admin',
        title: corpAdminTitle.trim() || 'Corporate Administrator',
        tierCap: corpAdminTierCap,
        monthlyTokenQuota: Number(corpAdminQuota),
        monthlyTokensUsed: editingCorpAdmin?.monthlyTokensUsed || 0,
        privileges: corpAdminPrivileges,
        status: editingCorpAdmin?.status || 'active',
        assignedBy: currentUser?.email || 'solarastra.in@gmail.com',
        assignedAt: editingCorpAdmin?.assignedAt || new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      const updatedAdmins = editingCorpAdmin
        ? existingAdmins.map(a => a.id === editingCorpAdmin.id ? adminObj : a)
        : [...existingAdmins.filter(a => a.email !== adminObj.email), adminObj];

      const updatedCompany: CompanyFirestore = {
        ...selectedCompany,
        companyAdminEmail: updatedAdmins[0]?.email || adminObj.email,
        companyAdmins: updatedAdmins,
        updatedAt: new Date().toISOString(),
      };

      // 1. Update local state
      setCompanies(companies.map(c => c.id === updatedCompany.id ? updatedCompany : c));
      
      // 2. Persist to Firestore
      await saveCompanyToFirestore(updatedCompany);

      // 3. Record Audit log
      await recordAuditLogToFirestore(
        editingCorpAdmin ? 'Update Corporate Admin' : 'Provision Corporate Admin',
        'governance',
        currentUser?.email || 'solarastra.in@gmail.com',
        `${editingCorpAdmin ? 'Updated' : 'Provisioned'} Corporate Admin '${adminObj.name}' (${adminObj.email}) with delegated authority (Teams, BYOK, Budgets) for ${selectedCompany.name}.`
      );

      // 4. Send email if requested
      if (corpAdminSendEmail) {
        await handleSendCorporateAdminEmail(adminObj);
      }

      setNotice({
        type: 'success',
        text: `Corporate Admin '${adminObj.name}' (${adminObj.email}) ${editingCorpAdmin ? 'updated' : 'provisioned'} with delegated administrative authority.`,
      });

      setShowCorpAdminModal(false);
    } catch (err: any) {
      setNotice({ type: 'error', text: `Failed to save Corporate Admin: ${err.message}` });
    } finally {
      setIsSubmittingCorpAdmin(false);
    }
  };

  // Dispatch Corporate Admin Credentials / Welcome Email
  const handleSendCorporateAdminEmail = async (admin: CompanyAdminUser) => {
    setDispatchingCorpAdminEmail(admin.email);
    try {
      const quotaFormatted = (admin.monthlyTokenQuota || 50_000_000).toLocaleString() + ' tokens / month';
      const modelsList = selectedCompany.allowedModels?.length > 0
        ? selectedCompany.allowedModels.join(', ')
        : 'Gemini 3.7 Flash, Claude 3.7 Sonnet, GPT-4.5, DeepSeek R1';

      const privList = [];
      if (admin.privileges.canCreateTeams) privList.push('Create & Manage Teams');
      if (admin.privileges.canManageBYOK) privList.push('Enterprise BYOK & Provider Keys');
      if (admin.privileges.canManageBudgets) privList.push('Budget & Spend Control');
      if (admin.privileges.canInviteMembers) privList.push('Invite & Provision Engineers');
      if (admin.privileges.canConfigureRouting) privList.push('Autonomous Routing Policies');
      if (admin.privileges.canViewTelemetry) privList.push('Live Telemetry & Logs');

      const adminVars = {
        '{{recipient_name}}': admin.name,
        '{{recipient_email}}': admin.email,
        '{{company_name}}': selectedCompany.name,
        '{{role}}': `Corporate Administrator (${admin.title || 'Executive Lead'})`,
        '{{allocated_tokens}}': quotaFormatted,
        '{{authorized_models}}': modelsList,
        '{{tier_cap}}': admin.tierCap || 'Frontier Tier 3',
        '{{login_url}}': 'https://ais-dev-gcdyq3rgswqtgkxcjbfmqt-4552824319.us-west2.run.app',
        '{{timestamp}}': new Date().toLocaleString(),
        '{{custom_message}}': `You have been appointed as Corporate Administrator for ${selectedCompany.name} by Platform SuperAdmin (${currentUser?.email || 'solarastra.in@gmail.com'}). Delegated authority: ${privList.join(', ')}. You can now provision teams, configure BYOK keys, and allocate engineering quotas with $0.00 token markup.`,
      };

      const res = await fetch(resolveApiUrl('/api/admin/smtp/send-test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: admin.email,
          subject: `👑 [WhyOr Dispatch] Corporate Admin Credentials: ${selectedCompany.name} Delegated Authority`,
          templateType: 'onboarding_invite',
          recipientName: admin.name,
          companyName: selectedCompany.name,
          role: `Corporate Administrator - ${admin.title || 'Director of AI'}`,
          allocatedTokens: quotaFormatted,
          authorizedModels: modelsList,
          customMessage: `You have been appointed Corporate Administrator for ${selectedCompany.name}. Delegated privileges: ${privList.join(', ')}. Login at WhyOr Dispatch AI with your verified email (${admin.email}) to manage corporate teams, enterprise BYOK credentials, and developer quotas.`,
          sentBy: `SuperAdmin (${currentUser?.email || 'solarastra.in@gmail.com'})`,
          variables: adminVars,
        }),
      });

      const emailData = await res.json().catch(() => ({}));
      if (res.ok && emailData.success) {
        await logEmailToFirestore({
          to: admin.email,
          from: `WhyOr Dispatch AI Enterprise <${smtpStatus?.fromEmail || 'solarastra.in@gmail.com'}>`,
          subject: `[WhyOr Dispatch AI] Corporate Admin Credentials - ${admin.name}`,
          emailType: 'corporate_admin_invite',
          status: 'sent',
          messageId: emailData.messageId,
          sentBy: currentUser?.email || 'solarastra.in@gmail.com',
        });

        await recordAuditLogToFirestore(
          'Dispatch Corporate Admin Invite',
          'smtp',
          currentUser?.email || 'solarastra.in@gmail.com',
          `Dispatched Corporate Admin credential email to '${admin.name}' (${admin.email}) for ${selectedCompany.name}. Message-ID: ${emailData.messageId}`
        );

        setNotice({
          type: 'success',
          text: `Corporate Admin credentials & welcome email dispatched to ${admin.name} (${admin.email}) via SMTP (Message-ID: ${emailData.messageId}).`,
        });
      } else {
        const errorMsg = emailData.error || 'SMTP server delivery failed';
        setNotice({
          type: 'error',
          text: `Could not dispatch email to ${admin.email}: ${errorMsg}. Check your SMTP credentials in Settings.`,
        });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: `Email dispatch error: ${err.message}` });
    } finally {
      setDispatchingCorpAdminEmail(null);
    }
  };

  // Revoke Corporate Admin Handler
  const handleRevokeCorporateAdmin = (admin: CompanyAdminUser) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Revoke Corporate Administrator',
      description: `Are you sure you want to revoke Corporate Admin privileges for '${admin.name}' (${admin.email}) from ${selectedCompany.name}?`,
      confirmText: 'Revoke Privileges',
      onConfirm: async () => {
        try {
          const updatedAdmins = (selectedCompany.companyAdmins || []).filter(a => a.id !== admin.id);
          const updatedCompany: CompanyFirestore = {
            ...selectedCompany,
            companyAdminEmail: updatedAdmins[0]?.email || '',
            companyAdmins: updatedAdmins,
            updatedAt: new Date().toISOString(),
          };

          setCompanies(companies.map(c => c.id === updatedCompany.id ? updatedCompany : c));
          await saveCompanyToFirestore(updatedCompany);

          await recordAuditLogToFirestore(
            'Revoke Corporate Admin',
            'governance',
            currentUser?.email || 'solarastra.in@gmail.com',
            `Revoked Corporate Admin authority for '${admin.name}' (${admin.email}) from ${selectedCompany.name}.`
          );

          setNotice({
            type: 'info',
            text: `Corporate Admin privileges revoked for ${admin.name}.`,
          });
        } catch (err: any) {
          setNotice({ type: 'error', text: `Revocation failed: ${err.message}` });
        }
      }
    });
  };

  // Create Team Handler
  const handleAddTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const teamId = `team_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newTeam: TeamFirestore = {
      id: teamId,
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      name: newTeamName.trim(),
      leadEmail: newTeamLeadEmail.trim() || selectedCompany.billingEmail,
      tierCap: newTeamTierCap,
      monthlyTokenQuota: Number(newTeamQuota),
      monthlyTokensUsed: 0,
      monthlyBudgetUsd: Number(newTeamBudget),
      allowedModels: newTeamModels,
      members: [
        {
          id: `mem_lead_${Date.now().toString(36)}`,
          name: 'Team Lead',
          email: newTeamLeadEmail.trim() || selectedCompany.billingEmail,
          role: 'Team Lead / Admin',
          tierCap: newTeamTierCap,
          monthlyTokenQuota: Number(newTeamQuota),
          monthlyTokensUsed: 0,
          joinedAt: new Date().toISOString().split('T')[0],
          status: 'active',
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      setTeams([...teams, newTeam]);
      await saveTeamToFirestore(newTeam);

      await recordAuditLogToFirestore(
        'Create Team',
        'onboarding',
        currentUser?.email || 'solarastra.in@gmail.com',
        `Created team '${newTeam.name}' under company '${selectedCompany.name}' with ${newTeam.monthlyTokenQuota.toLocaleString()} token cap.`
      );

      setNotice({
        type: 'success',
        text: `Team '${newTeam.name}' provisioned under ${selectedCompany.name}.`,
      });

      setShowAddTeamModal(false);
      setNewTeamName('');
      setNewTeamLeadEmail('');
    } catch (err: any) {
      setNotice({ type: 'error', text: `Failed to create team: ${err.message}` });
    }
  };

  // Send Member Invite Email (Reusable for onboarding and resending)
  const handleSendMemberInviteEmail = async (member: any, team: TeamFirestore) => {
    setDispatchingMemberId(member.id);
    try {
      const quotaFormatted = (member.monthlyTokenQuota || 10_000_000).toLocaleString() + ' tokens / month';
      const modelsList = (team.allowedModels && team.allowedModels.length > 0)
        ? team.allowedModels.join(', ')
        : (selectedCompany.allowedModels && selectedCompany.allowedModels.length > 0)
        ? selectedCompany.allowedModels.join(', ')
        : 'Gemini 2.5 Pro, Claude 3.7 Sonnet, GPT-4.5, DeepSeek R1';

      const memberVars = {
        '{{recipient_name}}': member.name || member.email.split('@')[0],
        '{{recipient_email}}': member.email,
        '{{company_name}}': selectedCompany.name,
        '{{team_name}}': team.name,
        '{{role}}': member.role || 'Senior AI Developer',
        '{{allocated_tokens}}': quotaFormatted,
        '{{authorized_models}}': modelsList,
        '{{tier_cap}}': member.tierCap || 'Tier 3 (Reasoning & Frontier Models)',
        '{{login_url}}': 'https://ais-dev-gcdyq3rgswqtgkxcjbfmqt-4552824319.us-west2.run.app',
        '{{timestamp}}': new Date().toLocaleString(),
        '{{custom_message}}': `You have been invited to the ${team.name} team in ${selectedCompany.name}. Allocated quota: ${quotaFormatted}. Direct access to models with $0.00 token markup.`,
      };

      const res = await fetch(resolveApiUrl('/api/admin/smtp/send-test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: member.email,
          subject: `✨ [WhyOr Dispatch] Welcome ${member.name} to ${selectedCompany.name} - Model Credentials & Quota`,
          templateType: 'onboarding_invite',
          recipientName: member.name || member.email.split('@')[0],
          companyName: selectedCompany.name,
          teamName: team.name,
          role: member.role || 'Senior AI Developer',
          allocatedTokens: quotaFormatted,
          authorizedModels: modelsList,
          customMessage: `You have been granted access to the ${team.name} workspace under ${selectedCompany.name}. Your monthly allowance is ${quotaFormatted} with access up to ${member.tierCap}. Authenticate with your Google account (${member.email}) at WhyOr Dispatch AI to begin executing models with zero token markup.`,
          sentBy: `SuperAdmin (${currentUser?.email || 'solarastra.in@gmail.com'})`,
          variables: memberVars,
        }),
      });

      const emailData = await res.json();
      if (res.ok && emailData.success) {
        // Update member emailStatus to sent
        const updatedMembers = team.members.map((m: any) =>
          m.id === member.id
            ? { ...m, emailStatus: 'sent', emailMessageId: emailData.messageId, emailSentAt: new Date().toISOString() }
            : m
        );
        const updatedTeam = { ...team, members: updatedMembers, updatedAt: new Date().toISOString() };
        setTeams(teams.map(t => t.id === team.id ? updatedTeam : t));
        await saveTeamToFirestore(updatedTeam);

        await logEmailToFirestore({
          to: member.email,
          from: `WhyOr Dispatch AI Enterprise <${smtpStatus?.fromEmail || 'solarastra.in@gmail.com'}>`,
          subject: `[WhyOr Dispatch AI] Welcome ${member.name}`,
          emailType: 'onboarding_invite',
          status: 'sent',
          messageId: emailData.messageId,
          sentBy: currentUser?.email || 'solarastra.in@gmail.com',
        });

        await recordAuditLogToFirestore(
          'Dispatch Invite Email',
          'smtp',
          currentUser?.email || 'solarastra.in@gmail.com',
          `Dispatched live invitation email to '${member.name}' (${member.email}) for team '${team.name}'. Message-ID: ${emailData.messageId}`
        );

        setNotice({
          type: 'success',
          text: `Welcome invitation email dispatched to ${member.name} (${member.email}) via SMTP (Message-ID: ${emailData.messageId}).`,
        });
        return { success: true, messageId: emailData.messageId };
      } else {
        const errorMsg = emailData.error || 'SMTP server authentication required';
        const updatedMembers = team.members.map((m: any) =>
          m.id === member.id
            ? { ...m, emailStatus: 'pending_smtp', emailError: errorMsg }
            : m
        );
        const updatedTeam = { ...team, members: updatedMembers, updatedAt: new Date().toISOString() };
        setTeams(teams.map(t => t.id === team.id ? updatedTeam : t));
        await saveTeamToFirestore(updatedTeam);

        setNotice({
          type: 'error',
          text: `Could not send email to ${member.email}: ${errorMsg}. Please configure your Gmail App Password in SMTP Settings.`,
        });

        setTargetMemberForEmail({ member, team });
        setShowSmtpQuickConfigModal(true);
        return { success: false, error: errorMsg };
      }
    } catch (mailErr: any) {
      setNotice({
        type: 'error',
        text: `SMTP delivery failed: ${mailErr.message}. Please configure your SMTP server credentials.`,
      });
      setTargetMemberForEmail({ member, team });
      setShowSmtpQuickConfigModal(true);
      return { success: false, error: mailErr.message };
    } finally {
      setDispatchingMemberId(null);
    }
  };

  // Invite Team Member Handler (with real SMTP email dispatch)
  const handleInviteMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeamForInvite || !inviteName.trim() || !inviteEmail.trim()) return;

    setIsDispatchingEmail(true);

    const newMember = {
      id: `mem_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      tierCap: inviteTierCap,
      monthlyTokenQuota: Number(inviteQuota),
      monthlyTokensUsed: 0,
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'active',
      emailStatus: 'not_sent',
    };

    const updatedTeam: TeamFirestore = {
      ...activeTeamForInvite,
      members: [...activeTeamForInvite.members, newMember],
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Update state
      setTeams(teams.map(t => t.id === activeTeamForInvite.id ? updatedTeam : t));
      
      // 2. Persist to Firestore
      await saveTeamToFirestore(updatedTeam);

      // 3. Record Audit Log
      await recordAuditLogToFirestore(
        'Invite Team Member',
        'onboarding',
        currentUser?.email || 'solarastra.in@gmail.com',
        `Invited '${newMember.name}' (${newMember.email}) to team '${activeTeamForInvite.name}' with ${newMember.monthlyTokenQuota.toLocaleString()} tokens/mo.`
      );

      // 4. Dispatch Real Welcome Email via SMTP Server if enabled
      let emailStatusText = '';
      if (dispatchSmtpWelcomeEmail) {
        const result = await handleSendMemberInviteEmail(newMember, updatedTeam);
        if (result.success) {
          emailStatusText = ` • Welcome invitation dispatched via SMTP (${result.messageId})`;
        } else {
          emailStatusText = ` (⚠️ Live email requires SMTP password configuration)`;
        }
      } else {
        setNotice({
          type: 'success',
          text: `Member '${newMember.name}' onboarded to ${activeTeamForInvite.name}.`,
        });
      }

      setShowInviteMemberModal(false);
      setInviteName('');
      setInviteEmail('');
    } catch (err: any) {
      setNotice({ type: 'error', text: `Failed to invite member: ${err.message}` });
    } finally {
      setIsDispatchingEmail(false);
    }
  };

  // Test SMTP Connection Handler
  const handleTestSmtpConnection = async () => {
    setIsTestingSmtp(true);
    setQuickSmtpNotice(null);
    try {
      const res = await fetch(resolveApiUrl('/api/admin/smtp/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: quickSmtpHost.trim(),
          port: Number(quickSmtpPort),
          secure: quickSmtpSecure,
          user: quickSmtpUser.trim(),
          pass: quickSmtpPass.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuickSmtpNotice({
          type: 'success',
          text: `✅ Handshake Verified: ${data.message} (${data.latencyMs}ms)`,
        });
      } else {
        setQuickSmtpNotice({
          type: 'error',
          text: `Handshake Error: ${data.error || 'Failed to authenticate'}. ${data.recommendation || ''}`,
        });
      }
    } catch (err: any) {
      setQuickSmtpNotice({
        type: 'error',
        text: `Handshake Error: ${err.message}`,
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Save SMTP Settings & Dispatch Invite immediately
  const handleSaveAndDispatchSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQuickSmtp(true);
    setQuickSmtpNotice(null);

    const payload = {
      host: quickSmtpHost.trim(),
      port: Number(quickSmtpPort),
      secure: quickSmtpSecure,
      requireTls: true,
      user: quickSmtpUser.trim(),
      pass: quickSmtpPass.trim(),
      fromEmail: quickSmtpUser.trim(),
      fromName: 'WhyOr Dispatch AI Enterprise',
      replyTo: quickSmtpUser.trim(),
      isVerified: true,
    };

    try {
      // 1. Save to server memory vault
      const res = await fetch(resolveApiUrl('/api/admin/smtp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await res.json();

      // 2. Persist to Firestore
      await saveSmtpSettingsToFirestore({
        host: payload.host,
        port: payload.port,
        secure: payload.secure,
        requireTls: true,
        user: payload.user,
        passMasked: payload.pass ? '••••••••••••••••' : undefined,
        fromEmail: payload.fromEmail,
        fromName: payload.fromName,
        replyTo: payload.replyTo,
        isVerified: true,
        lastVerifiedAt: new Date().toISOString(),
      });

      // 3. Record Audit Log
      await recordAuditLogToFirestore(
        'Configure SMTP Credentials',
        'smtp',
        currentUser?.email || payload.user,
        `Configured SMTP credentials for '${payload.user}' on host ${payload.host}:${payload.port}.`
      );

      // Refresh SMTP state
      await checkSmtpStatus();

      // 4. If a target member was pending invite (e.g. nsns0021@gmail.com), dispatch it now!
      if (targetMemberForEmail) {
        const sendResult = await handleSendMemberInviteEmail(targetMemberForEmail.member, targetMemberForEmail.team);
        if (sendResult.success) {
          setShowSmtpQuickConfigModal(false);
          setTargetMemberForEmail(null);
          return;
        } else {
          setQuickSmtpNotice({
            type: 'error',
            text: `Credentials saved, but email delivery test returned: ${sendResult.error}`,
          });
        }
      } else {
        setNotice({
          type: 'success',
          text: 'SMTP credentials successfully saved and validated. Outbound email gateway is active.',
        });
        setShowSmtpQuickConfigModal(false);
      }
    } catch (err: any) {
      setQuickSmtpNotice({
        type: 'error',
        text: `Failed to save SMTP settings: ${err.message}`,
      });
    } finally {
      setIsSavingQuickSmtp(false);
    }
  };

  // Delete Company Handler
  const handleDeleteCompany = (companyId: string) => {
    if (companies.length <= 1) {
      setNotice({ type: 'error', text: 'Cannot delete the last onboarded company.' });
      return;
    }
    const targetComp = companies.find(c => c.id === companyId);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Company & Teams',
      description: `Are you sure you want to delete '${targetComp?.name || companyId}' and all associated team configurations from Firestore?`,
      confirmText: 'Delete Company',
      onConfirm: async () => {
        try {
          await deleteCompanyFromFirestore(companyId);
          fetch(`/api/admin/companies/${companyId}`, { method: 'DELETE' }).catch(() => {});
          const remaining = companies.filter(c => c.id !== companyId);
          setCompanies(remaining);
          if (selectedCompanyId === companyId) {
            setSelectedCompanyId(remaining[0]?.id || '');
          }
          setNotice({ type: 'info', text: 'Company removed from Firestore registry.' });
        } catch (err: any) {
          setNotice({ type: 'error', text: `Delete failed: ${err.message}` });
        }
      }
    });
  };

  // Delete Team Handler
  const handleDeleteTeam = (teamId: string) => {
    const targetTeam = teams.find(t => t.id === teamId);
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Team',
      description: `Are you sure you want to delete team '${targetTeam?.name || teamId}'?`,
      confirmText: 'Delete Team',
      onConfirm: async () => {
        try {
          await deleteTeamFromFirestore(teamId);
          setTeams(teams.filter(t => t.id !== teamId));
          setNotice({ type: 'info', text: 'Team removed from Firestore.' });
        } catch (err: any) {
          setNotice({ type: 'error', text: `Delete failed: ${err.message}` });
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* SuperAdmin Authority Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-indigo-950/60 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-display font-bold text-white tracking-tight">
                  SuperAdmin Multi-Tenant & Team Governance
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40 uppercase tracking-wider">
                  Master Authority
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Authenticated SuperAdmin: <strong className="text-purple-300 font-mono">solarastra.in@gmail.com</strong>. Provision corporate tenants, configure granular model access tiers, allocate monthly token budgets, and dispatch SMTP onboarding invites.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreateCompanyWizard}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>+ Create Company Wizard</span>
            </button>
            
            <button
              onClick={loadCloudData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition-colors"
              title="Sync with Firestore Cloud Database"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Onboarded Tenants</div>
            <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
              <span>{companies.length}</span>
              <span className="text-[10px] font-normal text-emerald-400">Active</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Configured Teams</div>
            <div className="text-xl font-bold font-mono text-indigo-300">
              {teams.length}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Global Token Allocation</div>
            <div className="text-xl font-bold font-mono text-purple-300">
              {(companies.reduce((acc, c) => acc + c.monthlyTokenQuota, 0) / 1_000_000).toFixed(0)}M
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">SMTP Welcome Relay</div>
            <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          notice.type === 'success' ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200' :
          notice.type === 'error' ? 'bg-rose-950/50 border-rose-500/40 text-rose-200' :
          'bg-indigo-950/50 border-indigo-500/40 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white text-sm font-bold">×</button>
        </div>
      )}

      {/* Company Selector Ribbon */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Select Enterprise Company
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {companies.length} Corporate Accounts Managed by SuperAdmin
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {companies.map((comp) => {
            const isSelected = comp.id === selectedCompany.id;
            const usagePercent = Math.min(100, Math.round((comp.monthlyTokensUsed / comp.monthlyTokenQuota) * 100));

            return (
              <div
                key={comp.id}
                onClick={() => setSelectedCompanyId(comp.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-900/90 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30'
                    : 'bg-slate-950/60 border-white/10 hover:border-white/20 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm tracking-tight">{comp.name}</h4>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-purple-300">
                      @{comp.domain} • <span className="uppercase text-slate-400">{comp.tier}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                    comp.status === 'active' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {comp.status}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">Token Quota:</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {(comp.monthlyTokensUsed / 1_000_000).toFixed(1)}M / {(comp.monthlyTokenQuota / 1_000_000).toFixed(0)}M
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        usagePercent > 80 ? 'bg-amber-500' : 'bg-purple-500'
                      }`} 
                      style={{ width: `${usagePercent}%` }} 
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                    <span>Budget: ${comp.monthlyBudgetUsd.toLocaleString()}/mo</span>
                    <span>{comp.allowedModels.length} Models Allowed</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Company Deep Dive & Team Governance */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
        {/* Zero-Admin Enterprise Governance Warning Banner */}
        {hasNoAdmins && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-purple-950/80 border-2 border-amber-500/60 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/50 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-amber-300">
                      Corporate Administrator Required (0 Appointed)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/30 text-amber-200 border border-amber-400/50 font-semibold">
                      Enterprise Policy
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    <strong className="text-white">{selectedCompany.name}</strong> currently has no Corporate Administrator. Under enterprise governance policy, SuperAdmin must appoint a Company Admin before departmental teams or subordinate users are created. The Company Admin will then seed employees through SSO, CSV upload, or manual invites.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCorpAdminModal()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
              >
                <Crown className="w-4 h-4" />
                <span>👑 Appoint Company Admin Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Company Header Info */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">
                {selectedCompany.name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {selectedCompany.industry}
              </span>
              {hasNoAdmins ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3 h-3" /> No Admin Appointed
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1 font-semibold">
                  <Crown className="w-3 h-3 text-amber-400" /> {selectedCompany.companyAdmins?.length} Admin(s)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Billing & Alert Email: <span className="text-slate-200 font-mono">{selectedCompany.billingEmail}</span> • Domain: <span className="text-purple-300 font-mono">@{selectedCompany.domain}</span> • Routing: <span className="text-purple-300 font-mono">{selectedCompany.routingPriority.replace('_', ' ')}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenBulkUploadGuardrail}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>📁 Bulk Seed Employees</span>
            </button>

            <button
              onClick={handleOpenCreateTeamGuardrail}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>+ Create New Team</span>
            </button>

            <button
              onClick={() => handleDeleteCompany(selectedCompany.id)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-colors"
              title="Delete Company"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Allowed Models Multi-Chip Catalog */}
        <div className="space-y-2">
          <div className="text-xs font-mono font-semibold text-slate-400 uppercase">
            Authorized Models for {selectedCompany.name}:
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCompany.allowedModels.map((mId) => {
              const modelMeta = AVAILABLE_MODELS.find(m => m.id === mId);
              return (
                <div 
                  key={mId}
                  className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-white/10 text-xs flex items-center gap-2 text-slate-200"
                >
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span className="font-mono text-[11px]">{modelMeta?.name || mId}</span>
                  <span className="text-[9px] font-mono text-purple-300 bg-purple-950/60 px-1 py-0.2 rounded">
                    {modelMeta?.provider || 'AI'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Corporate Administrators (Delegated Authority) Section */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-slate-900/90 to-indigo-950/30 border border-purple-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/30 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-sm">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    Corporate Administrators (Delegated Authority)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    {(selectedCompany.companyAdmins?.length || 0)} Appointed
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  SuperAdmin-delegated executives who can seed employees via SSO/CSV, create teams, provision BYOK keys, manage budgets, and configure policies.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCorpAdminModal()}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>+ Appoint Corporate Admin</span>
            </button>
          </div>

          {(!selectedCompany.companyAdmins || selectedCompany.companyAdmins.length === 0) ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-amber-500/40 text-center space-y-2">
              <p className="text-xs text-amber-200">
                No Corporate Admin has been assigned to <strong className="text-white">{selectedCompany.name}</strong> yet.
              </p>
              <button
                type="button"
                onClick={() => handleOpenCorpAdminModal()}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
              >
                Appoint Corporate Admin Now to Enable Team & Employee Seeding →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {selectedCompany.companyAdmins.map((admin) => {
                const isDispatchingThis = dispatchingCorpAdminEmail === admin.email;
                return (
                  <div
                    key={admin.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 hover:border-purple-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center text-purple-200 font-bold text-sm">
                        {admin.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CA'}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{admin.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {admin.title || 'Corporate Admin'}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            {admin.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          {admin.email} • Assigned by <span className="text-slate-300">{admin.assignedBy || 'SuperAdmin'}</span>
                        </p>
                        {/* Capability Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {admin.privileges.canCreateTeams && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/30 text-indigo-300">
                              ✓ Create Teams
                            </span>
                          )}
                          {admin.privileges.canManageBYOK && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/30 text-amber-300">
                              ✓ Enterprise BYOK
                            </span>
                          )}
                          {admin.privileges.canManageBudgets && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-300">
                              ✓ Budgets & Caps
                            </span>
                          )}
                          {admin.privileges.canInviteMembers && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-500/30 text-purple-300">
                              ✓ Invite & Seed Engineers
                            </span>
                          )}
                          {admin.privileges.canConfigureRouting && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                              ✓ Routing Policy
                            </span>
                          )}
                          {admin.privileges.canViewTelemetry && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-500/30 text-blue-300">
                              ✓ Live Telemetry
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        type="button"
                        disabled={isDispatchingThis}
                        onClick={() => handleSendCorporateAdminEmail(admin)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        title={`Send / Resend credentials email to ${admin.email}`}
                      >
                        {isDispatchingThis ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-purple-300" />
                            <span>Dispatching...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3 text-purple-300" />
                            <span>Send Credentials</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenCorpAdminModal(admin)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        title="Edit Corporate Admin Privileges"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRevokeCorporateAdmin(admin)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-colors cursor-pointer"
                        title="Revoke Corporate Admin Privileges"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation Tabs for Company Hub: Teams/Roster, Bulk CSV Seeding, SSO & Directory Sync */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveSectionTab('roster_teams')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSectionTab === 'roster_teams'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Departmental Teams & Roster ({companyTeams.length} Teams)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionTab('bulk_seeding')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSectionTab === 'bulk_seeding'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📁 Bulk Employee Seeding (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionTab('sso_directory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSectionTab === 'sso_directory'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>🔐 Enterprise SSO & Directory Sync</span>
            {selectedCompany.ssoSettings?.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUB-VIEW 1: TEAMS & MEMBERS ROSTER                                         */}
        {/* ========================================================================= */}
        {activeSectionTab === 'roster_teams' && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            {/* Outbound SMTP Mail Gateway Status Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                      Enterprise Outbound SMTP Mail Relay
                    </h5>
                    {smtpStatus?.hasPassword ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Live Ready
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Password Configuration Needed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Host: <span className="text-slate-300">{smtpStatus?.host || 'smtp.gmail.com'}:{smtpStatus?.port || 587}</span> • Sender: <span className="text-purple-300">{smtpStatus?.fromEmail || 'solarastra.in@gmail.com'}</span>
                    {!smtpStatus?.hasPassword && (
                      <span className="text-amber-300 ml-1.5">— Provide a 16-character Gmail App Password to dispatch live invitations.</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetMemberForEmail(null);
                    setShowSmtpQuickConfigModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Configure SMTP Credentials</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Department Teams & Member Access Controls ({companyTeams.length})</span>
              </h4>
              <span className="text-xs text-slate-400">
                Each team enforces isolated token quotas and model tier boundaries
              </span>
            </div>

            {companyTeams.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/40 border border-white/5 text-center space-y-3">
                <Users className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">No teams created for {selectedCompany.name} yet.</p>
                <button
                  onClick={handleOpenCreateTeamGuardrail}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Create First Team
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {companyTeams.map((team) => (
                  <div 
                    key={team.id}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4"
                  >
                    {/* Team Top Strip */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2.5">
                          <h5 className="text-sm font-bold text-white">{team.name}</h5>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                            {team.tierCap}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          Lead: <span className="text-slate-200">{team.leadEmail}</span> • Monthly Cap: <span className="text-indigo-300">{(team.monthlyTokenQuota / 1_000_000).toFixed(0)}M tokens</span> • Budget: <span className="text-emerald-400">${team.monthlyBudgetUsd}/mo</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenInviteMemberGuardrail(team)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium shadow transition-all cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Invite Member (SMTP)</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Members Table */}
                    <div className="overflow-x-auto border border-white/5 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-slate-400 font-mono text-[10px] uppercase border-b border-white/10">
                          <tr>
                            <th className="py-2.5 px-3">Member & Role</th>
                            <th className="py-2.5 px-3">Email Identity</th>
                            <th className="py-2.5 px-3">Model Tier Limit</th>
                            <th className="py-2.5 px-3">Monthly Token Usage</th>
                            <th className="py-2.5 px-3">Invite & Email Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {team.members.map((mem: any) => {
                            const memUsagePct = Math.min(100, Math.round(((mem.monthlyTokensUsed || 0) / (mem.monthlyTokenQuota || 1)) * 100));
                            const isDispatchingThis = dispatchingMemberId === mem.id;
                            const isCorpAdmin = selectedCompany.companyAdmins?.some(
                              a => a.email.toLowerCase() === mem.email.toLowerCase()
                            );

                            return (
                              <tr key={mem.id} className="hover:bg-white/[0.02]">
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="font-semibold text-slate-200">{mem.name}</div>
                                    {isCorpAdmin && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 font-semibold">
                                        <Crown className="w-2.5 h-2.5" /> Admin
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">{mem.role}</div>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-purple-300">
                                  {mem.email}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-white/10 text-slate-300">
                                    {mem.tierCap}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="space-y-1 w-28">
                                    <div className="flex justify-between text-[10px] font-mono">
                                      <span className="text-slate-300">{((mem.monthlyTokensUsed || 0) / 1_000_000).toFixed(1)}M</span>
                                      <span className="text-slate-500">/ {((mem.monthlyTokenQuota || 10_000_000) / 1_000_000).toFixed(0)}M</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-indigo-500 rounded-full" 
                                        style={{ width: `${memUsagePct}%` }} 
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  {mem.emailStatus === 'sent' ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                        Invite Dispatched
                                      </span>
                                      {mem.emailMessageId && (
                                        <div className="text-[8px] font-mono text-slate-500 truncate max-w-[140px]" title={mem.emailMessageId}>
                                          ID: {mem.emailMessageId}
                                        </div>
                                      )}
                                    </div>
                                  ) : mem.emailStatus === 'pending_smtp' || mem.emailStatus === 'failed' ? (
                                    <button
                                      onClick={() => {
                                        setTargetMemberForEmail({ member: mem, team });
                                        setShowSmtpQuickConfigModal(true);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                                      title="Click to configure SMTP credentials and dispatch email"
                                    >
                                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                      <span>SMTP Setup Required</span>
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-slate-800 text-slate-400 border border-white/10">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                      Not Dispatched
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {!isCorpAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => handlePromoteMemberToAdmin(mem, team)}
                                        className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                                        title={`Promote ${mem.name} to Corporate Administrator for ${selectedCompany.name}`}
                                      >
                                        <Crown className="w-3 h-3 text-amber-400" />
                                        <span>Promote</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      disabled={isDispatchingThis}
                                      onClick={() => handleSendMemberInviteEmail(mem, team)}
                                      className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                                      title={`Dispatch live invitation email to ${mem.email}`}
                                    >
                                      {isDispatchingThis ? (
                                        <>
                                          <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                                          <span>Sending...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Send className="w-3 h-3 text-purple-400" />
                                          <span>{mem.emailStatus === 'sent' ? 'Resend' : 'Send Invite'}</span>
                                        </>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConfirmDialog({
                                          isOpen: true,
                                          title: 'Remove Team Member',
                                          description: `Are you sure you want to remove member ${mem.name} (${mem.email}) from ${team.name}?`,
                                          confirmText: 'Remove Member',
                                          onConfirm: async () => {
                                            const updatedTeam = {
                                              ...team,
                                              members: team.members.filter((m: any) => m.id !== mem.id),
                                              updatedAt: new Date().toISOString(),
                                            };
                                            setTeams(teams.map(t => t.id === team.id ? updatedTeam : t));
                                            await saveTeamToFirestore(updatedTeam);
                                            setNotice({ type: 'info', text: `Removed ${mem.name} from ${team.name}.` });
                                          }
                                        });
                                      }}
                                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                      title="Remove Member"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-VIEW 2: BULK CSV EMPLOYEE SEEDING SUITE                              */}
        {/* ========================================================================= */}
        {activeSectionTab === 'bulk_seeding' && (
          <div className="space-y-5 pt-1 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-indigo-950/30 border border-purple-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Bulk Employee Seeding & Role / Quota Provisioning
                    </h4>
                    <p className="text-xs text-slate-400">
                      Upload or paste your company roster to batch-create engineers, assign departmental teams, set monthly token quotas, and dispatch SMTP credentials.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkCsvText(
`Full Name, Email, Role, Team, Model Tier, Monthly Token Quota, Monthly Budget ($)
Elena Rostova, elena.dev@${selectedCompany.domain}, Senior AI Developer, AI Core Lab, Frontier Tier 3, 25000000, 1000
David Kim, david.k@${selectedCompany.domain}, AI / ML Engineer, AI Core Lab, Frontier Tier 3, 20000000, 800
Sarah Jenkins, s.jenkins@${selectedCompany.domain}, Product Manager (AI), Product Innovation, General Tier 2, 10000000, 500
Michael Chang, m.chang@${selectedCompany.domain}, Prompt & QA Engineer, Validation Team, Fast Tier 1, 10000000, 400
Aisha Patel, aisha.p@${selectedCompany.domain}, Staff AI Researcher, Research & Deep Reasoning, Frontier Tier 3, 30000000, 1500`
                      );
                      const parsed = parseBulkCsv(
`Full Name, Email, Role, Team, Model Tier, Monthly Token Quota, Monthly Budget ($)
Elena Rostova, elena.dev@${selectedCompany.domain}, Senior AI Developer, AI Core Lab, Frontier Tier 3, 25000000, 1000
David Kim, david.k@${selectedCompany.domain}, AI / ML Engineer, AI Core Lab, Frontier Tier 3, 20000000, 800
Sarah Jenkins, s.jenkins@${selectedCompany.domain}, Product Manager (AI), Product Innovation, General Tier 2, 10000000, 500
Michael Chang, m.chang@${selectedCompany.domain}, Prompt & QA Engineer, Validation Team, Fast Tier 1, 10000000, 400
Aisha Patel, aisha.p@${selectedCompany.domain}, Staff AI Researcher, Research & Deep Reasoning, Frontier Tier 3, 30000000, 1500`
                      );
                      setBulkParsedMembers(parsed);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono border border-white/10 transition-all cursor-pointer"
                  >
                    Load Sample Roster
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(bulkCsvText);
                      const link = document.createElement("a");
                      link.setAttribute("href", csvContent);
                      link.setAttribute("download", `${selectedCompany.name.replace(/\s+/g, '_')}_employee_roster_template.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              {/* Textarea Input & Live Validation Preview */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Paste CSV Roster Data (Columns: Name, Email, Role, Team, Tier, Monthly Tokens, Monthly Budget USD)</span>
                  <span className="font-mono text-purple-300 text-[11px]">
                    {bulkParsedMembers.filter(r => r.status === 'valid').length} Valid Rows Ready
                  </span>
                </label>
                <textarea
                  rows={6}
                  value={bulkCsvText}
                  onChange={(e) => {
                    setBulkCsvText(e.target.value);
                    const parsed = parseBulkCsv(e.target.value);
                    setBulkParsedMembers(parsed);
                  }}
                  placeholder="Full Name, Email, Role, Team, Model Tier, Monthly Token Quota, Monthly Budget ($)"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkAutoCreateTeams}
                    onChange={(e) => setBulkAutoCreateTeams(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Auto-Create Missing Teams</div>
                    <div className="text-[10px] text-slate-400">If a team in the roster doesn't exist yet, automatically provision it.</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkSendSmtpEmails}
                    onChange={(e) => setBulkSendSmtpEmails(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Dispatch SMTP Welcome Emails</div>
                    <div className="text-[10px] text-slate-400">Send instant credentials & token allocation notice to each imported user.</div>
                  </div>
                </label>
              </div>

              {/* Parsed Table Preview */}
              {bulkParsedMembers.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                      Parsed Employee Seeding Roster ({bulkParsedMembers.length} Entries)
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-emerald-400 font-semibold">
                        ✓ {bulkParsedMembers.filter(r => r.status === 'valid').length} Valid
                      </span>
                      {bulkParsedMembers.some(r => r.status !== 'valid') && (
                        <span className="text-rose-400 font-semibold">
                          ⚠ {bulkParsedMembers.filter(r => r.status !== 'valid').length} Invalid
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-white/10 rounded-xl max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase sticky top-0 border-b border-white/10">
                        <tr>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Employee Name</th>
                          <th className="py-2 px-3">Email Address</th>
                          <th className="py-2 px-3">Role</th>
                          <th className="py-2 px-3">Assigned Team</th>
                          <th className="py-2 px-3">Tier Cap</th>
                          <th className="py-2 px-3">Monthly Token Quota</th>
                          <th className="py-2 px-3">Budget</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {bulkParsedMembers.map((row) => (
                          <tr key={row.id} className="hover:bg-white/[0.02]">
                            <td className="py-2 px-3">
                              {row.status === 'valid' ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Valid
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30" title={row.errorMessage}>
                                  {row.errorMessage || 'Error'}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-200">{row.name}</td>
                            <td className="py-2 px-3 font-mono text-purple-300">{row.email}</td>
                            <td className="py-2 px-3 text-slate-300">{row.role}</td>
                            <td className="py-2 px-3 font-medium text-indigo-300">{row.teamName}</td>
                            <td className="py-2 px-3 font-mono text-slate-400">{row.tierCap}</td>
                            <td className="py-2 px-3 font-mono text-slate-200">
                              {(row.monthlyTokenQuota / 1_000_000).toFixed(1)}M
                            </td>
                            <td className="py-2 px-3 font-mono text-emerald-400">${row.monthlyBudgetUsd}/mo</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-end pt-3">
                    <button
                      type="button"
                      disabled={isImportingBulk || bulkParsedMembers.filter(r => r.status === 'valid').length === 0}
                      onClick={handleExecuteBulkImport}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isImportingBulk ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Seeding Employees & Provisioning Teams...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Seed {bulkParsedMembers.filter(r => r.status === 'valid').length} Employees Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-VIEW 3: ENTERPRISE SSO & DIRECTORY AUTO-PROVISIONING                  */}
        {/* ========================================================================= */}
        {activeSectionTab === 'sso_directory' && (
          <div className="space-y-5 pt-1 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/30 via-slate-900 to-purple-950/30 border border-indigo-500/30 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Enterprise Single Sign-On (SSO) & Domain Directory Sync
                    </h4>
                    <p className="text-xs text-slate-400">
                      When employees authenticate with Google Workspace or corporate SAML matching the domain, automatically assign them to default teams with configured token quotas.
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-semibold ${
                  ssoAutoProvisionEnabled 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-slate-800 text-slate-400 border border-white/10'
                }`}>
                  {ssoAutoProvisionEnabled ? '● SSO Auto-Provisioning Active' : '○ SSO Provisioning Disabled'}
                </span>
              </div>

              {/* SSO Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Corporate Email Domain for SSO Matching *</label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-slate-400 font-mono">@</span>
                    <input
                      type="text"
                      value={ssoDomainInput}
                      onChange={(e) => setSsoDomainInput(e.target.value)}
                      placeholder="e.g. testing123.com"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Any user logging in with an email ending in @{ssoDomainInput || selectedCompany.domain} will be automatically assigned.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Default Team Assignment</label>
                  <select
                    value={ssoDefaultTeamId}
                    onChange={(e) => setSsoDefaultTeamId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {companyTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.tierCap})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">Target departmental team new SSO employees will join automatically.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Default Role</label>
                  <select
                    value={ssoDefaultRole}
                    onChange={(e) => setSsoDefaultRole(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Senior AI Developer">Senior AI Developer</option>
                    <option value="AI / ML Engineer">AI / ML Engineer</option>
                    <option value="Prompt & QA Engineer">Prompt & QA Engineer</option>
                    <option value="Research Scientist">Research Scientist</option>
                    <option value="Product Manager (AI)">Product Manager (AI)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Default Model Tier Access Limit</label>
                  <select
                    value={ssoDefaultTierCap}
                    onChange={(e) => setSsoDefaultTierCap(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Frontier Tier 3">Frontier Tier 3 (Reasoning & Deep Models)</option>
                    <option value="General Tier 2">General Tier 2 (Standard Production)</option>
                    <option value="Fast Tier 1">Fast Tier 1 (Economy)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Default Monthly Token Quota</label>
                  <input
                    type="number"
                    min="1000000"
                    step="1000000"
                    value={ssoDefaultMonthlyQuota}
                    onChange={(e) => setSsoDefaultMonthlyQuota(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Auto-Provisioning State</label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={ssoAutoProvisionEnabled}
                        onChange={(e) => setSsoAutoProvisionEnabled(e.target.checked)}
                        className="w-4 h-4 accent-indigo-500 rounded"
                      />
                      <span>Enable Just-In-Time (JIT) Auto-Provisioning</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={isSavingSso}
                  onClick={handleSaveSsoSettings}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingSso ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving SSO Settings...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save SSO Settings</span>
                    </>
                  )}
                </button>
              </div>

              {/* SSO Testing Simulator Sandbox */}
              <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h5 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    SSO Directory Match Simulator
                  </h5>
                </div>
                <p className="text-[11px] text-slate-400">
                  Simulate an employee login to test whether their corporate email address properly matches this tenant and check the exact role and token quota that will be provisioned.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <input
                    type="email"
                    value={ssoTestEmail}
                    onChange={(e) => setSsoTestEmail(e.target.value)}
                    placeholder={`e.g. engineer1@${ssoDomainInput || selectedCompany.domain}`}
                    className="w-full sm:flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestSsoMatch(ssoTestEmail)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap"
                  >
                    Test SSO Match
                  </button>
                </div>

                {ssoTestOutput && (
                  <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-1.5 ${
                    ssoTestOutput.match 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}>
                    {ssoTestOutput.match ? (
                      <div>
                        <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>SSO Match Succeeded — JIT Provisioning Approved</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-emerald-500/20 text-[11px] text-slate-300">
                          <div>Company: <strong className="text-white">{ssoTestOutput.details.company}</strong></div>
                          <div>Target Team: <strong className="text-indigo-300">{ssoTestOutput.details.teamName}</strong></div>
                          <div>Role Granted: <strong className="text-white">{ssoTestOutput.details.role}</strong></div>
                          <div>Tier Cap: <strong className="text-purple-300">{ssoTestOutput.details.tierCap}</strong></div>
                          <div>Monthly Quota: <strong className="text-emerald-300">{ssoTestOutput.details.quota}</strong></div>
                          <div>Routing Policy: <strong className="text-cyan-300">Subscription-First ($0.00 markup)</strong></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-rose-300">SSO Match Rejected</div>
                          <p className="text-[11px] text-rose-200/90 mt-0.5">{ssoTestOutput.details.reason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== CREATE COMPANY WIZARD (MULTI-STEP GOVERNANCE FLOW) ==================== */}
      {showOnboardCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl shadow-purple-950/40 space-y-5">
            
            {/* Wizard Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300 shadow-inner">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Company Onboarding Wizard
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-200 border border-purple-500/30">
                      Step {companyWizardStep} of 5
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Step-by-step corporate tenant onboarding with mandatory Company Admin governance
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowOnboardCompanyModal(false);
                  setWizardCompletedCompany(null);
                }}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-white/5 transition-colors"
                title="Close Wizard"
              >
                ✕
              </button>
            </div>

            {/* Stepper Navigation Bar (5 Steps) */}
            <div className="grid grid-cols-5 gap-1 p-1.5 bg-slate-950/80 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setCompanyWizardStep(1)}
                className={`py-2 px-1 rounded-lg text-center font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                  companyWizardStep === 1
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                    : isWizardStep1Valid
                    ? 'bg-slate-900 text-purple-300 hover:bg-slate-800'
                    : 'text-slate-400 hover:bg-slate-900/50'
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-black/30">
                  {isWizardStep1Valid && companyWizardStep > 1 ? '✓' : '1'}
                </span>
                <span className="truncate text-[10px] sm:text-xs">Company Name</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isWizardStep1Valid) {
                    setCompanyWizardStep(2);
                  } else {
                    setCompanyWizardStep(1);
                  }
                }}
                className={`py-2 px-1 rounded-lg text-center font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                  companyWizardStep === 2
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-semibold'
                    : isWizardStep2Valid
                    ? 'bg-slate-900 text-amber-300 hover:bg-slate-800'
                    : 'text-slate-400 hover:bg-slate-900/50'
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-black/30">
                  {isWizardStep2Valid && companyWizardStep > 2 ? '✓' : '2'}
                </span>
                <span className="truncate text-[10px] sm:text-xs flex items-center gap-0.5">
                  <span>Admin Email</span>
                  <Crown className="w-2.5 h-2.5 text-amber-300 shrink-0" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isWizardStep1Valid) {
                    setCompanyWizardStep(1);
                  } else if (!isWizardStep2Valid) {
                    setCompanyWizardStep(2);
                    setHasAttemptedAdminStep(true);
                    setAdminStepError('Company Administrator with a valid email is required before configuring budgets & models.');
                  } else {
                    setCompanyWizardStep(3);
                  }
                }}
                className={`py-2 px-1 rounded-lg text-center font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                  companyWizardStep === 3
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                    : isWizardStep3Valid
                    ? 'bg-slate-900 text-purple-300 hover:bg-slate-800'
                    : 'text-slate-400 hover:bg-slate-900/50'
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-black/30">
                  {isWizardStep3Valid && companyWizardStep > 3 ? '✓' : '3'}
                </span>
                <span className="truncate text-[10px] sm:text-xs">Budgets & Models</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isWizardStep1Valid) {
                    setCompanyWizardStep(1);
                  } else if (!isWizardStep2Valid) {
                    setCompanyWizardStep(2);
                    setHasAttemptedAdminStep(true);
                  } else {
                    setCompanyWizardStep(4);
                  }
                }}
                className={`py-2 px-1 rounded-lg text-center font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                  companyWizardStep === 4
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-semibold'
                    : 'bg-slate-900 text-cyan-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-black/30">
                  {companyWizardStep > 4 ? '✓' : '4'}
                </span>
                <span className="truncate text-[10px] sm:text-xs flex items-center gap-0.5">
                  <span>Setup Email</span>
                  <Mail className="w-2.5 h-2.5 text-cyan-300 shrink-0" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isWizardStep1Valid) {
                    setCompanyWizardStep(1);
                  } else if (!isWizardStep2Valid) {
                    setCompanyWizardStep(2);
                    setHasAttemptedAdminStep(true);
                    setAdminStepError('Company Administrator with a valid email is required before Setup Confirmation.');
                  } else {
                    setCompanyWizardStep(5);
                  }
                }}
                className={`py-2 px-1 rounded-lg text-center font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                  companyWizardStep === 5
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900/50'
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-black/30">
                  {wizardCompletedCompany ? '✓' : '5'}
                </span>
                <span className="truncate text-[10px] sm:text-xs">Confirm Setup</span>
              </button>
            </div>

            {/* Wizard Progress Bar */}
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-amber-400 via-cyan-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${(companyWizardStep / 5) * 100}%` }}
              />
            </div>

            {/* ================= STEP 1: TENANT PROFILE ================= */}
            {companyWizardStep === 1 && (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-purple-200/90 leading-relaxed">
                    Enter the legal organization identity and corporate email domain. The domain will be used for automated directory SSO matching and security policy routing.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium flex items-center justify-between">
                      <span>Company Legal Name *</span>
                      {newCompanyName.trim().length >= 2 && <span className="text-emerald-400 text-[10px]">✓ Valid</span>}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SolarAstra Energy Systems"
                      value={newCompanyName}
                      onChange={(e) => {
                        setNewCompanyName(e.target.value);
                        // Auto-suggest domain if empty
                        if (!newCompanyDomain && e.target.value.length > 2) {
                          const suggested = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
                          setNewCompanyDomain(suggested);
                        }
                      }}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white font-sans focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium flex items-center justify-between">
                      <span>Corporate Email Domain *</span>
                      {newCompanyDomain.trim().length >= 2 && <span className="text-emerald-400 text-[10px]">✓ Valid</span>}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. solarastra.in"
                      value={newCompanyDomain}
                      onChange={(e) => setNewCompanyDomain(e.target.value.toLowerCase().trim())}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium">Industry Vertical</label>
                    <input
                      type="text"
                      placeholder="e.g. CleanTech, Healthcare, FinTech"
                      value={newCompanyIndustry}
                      onChange={(e) => setNewCompanyIndustry(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium">Enterprise Tier</label>
                    <select
                      value={newCompanyTier}
                      onChange={(e) => setNewCompanyTier(e.target.value as any)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="enterprise">Enterprise Platinum (Unlimited / Multi-Model)</option>
                      <option value="growth">Growth Scale (Priority Routing)</option>
                      <option value="startup">Startup Seed (BYOK & Subscriptions)</option>
                      <option value="gov_defense">Government / Sovereign Defense (Air-Gapped)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium flex items-center justify-between">
                    <span>Primary Billing Email</span>
                    {newCompanyBillingEmail && isValidEmail(newCompanyBillingEmail) && (
                      <span className="text-emerald-400 text-[10px]">✓ Valid Format</span>
                    )}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="billing@solarastra.in"
                    value={newCompanyBillingEmail}
                    onChange={(e) => setNewCompanyBillingEmail(e.target.value.trim())}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Step 1 Footer Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowOnboardCompanyModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!isWizardStep1Valid}
                    onClick={() => {
                      if (isWizardStep1Valid) {
                        setCompanyWizardStep(2);
                      }
                    }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold transition-all cursor-pointer ${
                      isWizardStep1Valid
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span>Next: Designated Company Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 2: DESIGNATED COMPANY ADMINISTRATOR (CRITICAL GOVERNANCE) ================= */}
            {companyWizardStep === 2 && (
              <div className="space-y-4 text-xs animate-fadeIn">
                
                {/* Mandatory Governance Requirement Banner */}
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-2 shadow-lg shadow-amber-950/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300">
                        <Crown className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                        Designate Company Administrator (Mandatory Policy)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/40 font-semibold">
                      Required for Tenant Creation
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-100/90 leading-relaxed">
                    SuperAdmin is required to provide a designated <strong>Company Admin</strong> account during initial setup. Once provisioned, this admin will have delegated authority to seed employees via SSO/CSV, configure department teams, and manage key limits. Tenant creation will fail without a valid linked administrator.
                  </p>
                </div>

                {/* Validation Status Indicator */}
                {(() => {
                  const cleanAdminEmail = newCorpAdminEmail.trim().toLowerCase();
                  const cleanAdminName = newCorpAdminName.trim();
                  const emailValid = isValidEmail(cleanAdminEmail);
                  const isDomainMatch = cleanAdminEmail.endsWith(`@${newCompanyDomain.trim().toLowerCase()}`);

                  if (!cleanAdminEmail || !emailValid || !cleanAdminName) {
                    return (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-2.5 text-rose-200">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-rose-300 text-xs">Company Admin Account Incomplete</div>
                          <div className="text-[11px] text-rose-200/90 mt-0.5">
                            {!cleanAdminName && <span>• Admin Full Name is required.<br /></span>}
                            {!cleanAdminEmail && <span>• Admin Work Email is required.<br /></span>}
                            {cleanAdminEmail && !emailValid && <span>• Admin Work Email must be a valid email format (e.g. admin@domain.com).<br /></span>}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-start gap-2.5 text-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-bold text-emerald-300 text-xs flex items-center gap-2">
                          <span>Verified Company Admin Linked</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px]">
                            {isDomainMatch ? 'Corporate Domain Match' : 'Managed Domain'}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-200/90 font-mono">
                          {cleanAdminName} &lt;{cleanAdminEmail}&gt;
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Form Inputs for Designated Admin */}
                <div className="space-y-3 p-3.5 bg-slate-950 rounded-xl border border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-slate-200 text-xs font-medium flex items-center justify-between">
                        <span>Corporate Admin Full Name *</span>
                        {newCorpAdminName.trim().length >= 2 && <span className="text-emerald-400 text-[10px]">✓</span>}
                      </label>
                      <input
                        type="text"
                        required
                        value={newCorpAdminName}
                        onChange={(e) => {
                          setNewCorpAdminName(e.target.value);
                          setAdminStepError(null);
                        }}
                        placeholder="e.g. Elena Rostova"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-200 text-xs font-medium flex items-center justify-between">
                        <span>Corporate Admin Work Email *</span>
                        {newCorpAdminEmail && isValidEmail(newCorpAdminEmail) && (
                          <span className="text-emerald-400 text-[10px]">✓ Valid</span>
                        )}
                      </label>
                      <input
                        type="email"
                        required
                        value={newCorpAdminEmail}
                        onChange={(e) => {
                          setNewCorpAdminEmail(e.target.value.trim());
                          setAdminStepError(null);
                        }}
                        placeholder={`e.g. admin@${newCompanyDomain || 'company.com'}`}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 text-xs font-medium">Executive Title / Role</label>
                    <input
                      type="text"
                      value={newCorpAdminTitle}
                      onChange={(e) => setNewCorpAdminTitle(e.target.value)}
                      placeholder="e.g. Director of AI Engineering & Infrastructure"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  {/* Delegated Authority Matrix */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="text-[10px] text-slate-400 font-mono uppercase mb-2 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Delegated Corporate Admin Privileges:</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={newCorpAdminPrivileges.canCreateTeams}
                          onChange={(e) => setNewCorpAdminPrivileges({ ...newCorpAdminPrivileges, canCreateTeams: e.target.checked })}
                          className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                        />
                        <span>Create Teams</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={newCorpAdminPrivileges.canManageBYOK}
                          onChange={(e) => setNewCorpAdminPrivileges({ ...newCorpAdminPrivileges, canManageBYOK: e.target.checked })}
                          className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                        />
                        <span>Enterprise BYOK</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={newCorpAdminPrivileges.canManageBudgets}
                          onChange={(e) => setNewCorpAdminPrivileges({ ...newCorpAdminPrivileges, canManageBudgets: e.target.checked })}
                          className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                        />
                        <span>Budgets & Caps</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={newCorpAdminPrivileges.canInviteMembers}
                          onChange={(e) => setNewCorpAdminPrivileges({ ...newCorpAdminPrivileges, canInviteMembers: e.target.checked })}
                          className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                        />
                        <span>Invite Members</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={newCorpAdminPrivileges.canConfigureRouting}
                          onChange={(e) => setNewCorpAdminPrivileges({ ...newCorpAdminPrivileges, canConfigureRouting: e.target.checked })}
                          className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                        />
                        <span>Model Routing</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={newCorpAdminPrivileges.canViewTelemetry}
                          onChange={(e) => setNewCorpAdminPrivileges({ ...newCorpAdminPrivileges, canViewTelemetry: e.target.checked })}
                          className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                        />
                        <span>Live Telemetry</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Step 2 Footer Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setCompanyWizardStep(1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isWizardStep2Valid) {
                        setCompanyWizardStep(3);
                        setAdminStepError(null);
                      } else {
                        setHasAttemptedAdminStep(true);
                        setAdminStepError('Enterprise Policy Block: You must provide a valid Company Administrator email and name to proceed.');
                      }
                    }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold transition-all cursor-pointer ${
                      isWizardStep2Valid
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-600/30'
                        : 'bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-500/40'
                    }`}
                  >
                    {isWizardStep2Valid ? (
                      <>
                        <span>Next: AI Quotas & Models</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-300" />
                        <span>Valid Admin Required to Proceed</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: QUOTAS & MODELS ================= */}
            {companyWizardStep === 3 && (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium flex items-center justify-between">
                      <span>Monthly Token Quota</span>
                      <span className="text-purple-300 font-mono">{(newCompanyQuota / 1_000_000).toFixed(0)}M tokens</span>
                    </label>
                    <input
                      type="number"
                      min="1000000"
                      step="1000000"
                      value={newCompanyQuota}
                      onChange={(e) => setNewCompanyQuota(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex gap-2 pt-1">
                      {[10_000_000, 50_000_000, 100_000_000, 250_000_000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setNewCompanyQuota(preset)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                            newCompanyQuota === preset
                              ? 'bg-purple-600/40 border-purple-400 text-purple-200'
                              : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          {preset / 1_000_000}M
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium flex items-center justify-between">
                      <span>Monthly Spend Cap (USD)</span>
                      <span className="text-emerald-300 font-mono">${newCompanyBudget.toLocaleString()}</span>
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={newCompanyBudget}
                      onChange={(e) => setNewCompanyBudget(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex gap-2 pt-1">
                      {[500, 1500, 3000, 10000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setNewCompanyBudget(preset)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                            newCompanyBudget === preset
                              ? 'bg-emerald-600/40 border-emerald-400 text-emerald-200'
                              : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          ${preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Model Routing Priority Strategy</label>
                  <select
                    value={newCompanyRouting}
                    onChange={(e) => setNewCompanyRouting(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="subscription_first">Subscription-First (Route to flat-rate plans first, zero markup)</option>
                    <option value="byok_first">Enterprise BYOK Keys First (Direct API credentials)</option>
                    <option value="balanced">Balanced Cost-Performance Optimization</option>
                  </select>
                </div>

                {/* Model Catalog Multi-Select */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="text-slate-300 font-medium flex items-center justify-between">
                    <span>Allowlisted AI Models ({newCompanyModels.length} Selected)</span>
                    <span className="text-[10px] text-purple-300 font-mono">Tenant Model Sandbox</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-white/5">
                    {AVAILABLE_MODELS.map((model) => {
                      const isChecked = newCompanyModels.includes(model.id);

                      return (
                        <div
                          key={model.id}
                          onClick={() => toggleCompanyModel(model.id)}
                          className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-purple-950/40 border-purple-500/60 text-white'
                              : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isChecked ? 'bg-purple-600 border-purple-400 text-white' : 'border-slate-600'
                            }`}>
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <div>
                              <div className="font-semibold text-[11px] leading-tight">{model.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{model.tier} • {model.provider}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SMTP Alert Checkbox */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-white/10">
                  <input
                    type="checkbox"
                    id="smtpAlerts"
                    checked={newCompanySmtpAlerts}
                    onChange={(e) => setNewCompanySmtpAlerts(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                  <label htmlFor="smtpAlerts" className="text-slate-300 text-xs cursor-pointer">
                    <strong>Enable Automated SMTP Alerts</strong>: Send automated threshold alerts and welcome notification to the designated Company Admin.
                  </label>
                </div>

                {/* Step 3 Footer Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setCompanyWizardStep(2)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={!isWizardStep3Valid}
                    onClick={() => setCompanyWizardStep(4)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white font-semibold transition-all cursor-pointer ${
                      isWizardStep3Valid
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span>Next: Send Setup Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 4: SEND EMAIL NOTIFICATION TO COMPANY ADMIN ================= */}
            {companyWizardStep === 4 && (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-cyan-200">Step 4: Send Email Notification with Detailed Setup Steps</div>
                    <p className="text-[11px] text-cyan-200/90 leading-relaxed mt-0.5">
                      Preview and dispatch step-by-step onboarding instructions directly to designated Company Administrator (<span className="font-mono text-white">{newCorpAdminEmail}</span>).
                    </p>
                  </div>
                </div>

                {/* Email Recipient & Subject Header Card */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="text-[11px] text-slate-400 font-mono">
                      To: <span className="text-white font-semibold">{newCorpAdminName}</span> &lt;<span className="text-cyan-300">{newCorpAdminEmail}</span>&gt;
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px]">
                      Designated Admin
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    <span className="text-slate-400">Subject:</span> 🏢 [WhyOr Enterprise] Setup Instructions: Your {newCompanyName || 'Company'} AI Workspace is Ready
                  </div>
                </div>

                {/* Detailed 5-Step Instructions Included in Email Preview */}
                <div className="p-3.5 bg-slate-950/90 rounded-xl border border-cyan-500/30 space-y-2.5">
                  <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Included Step-by-Step Company Admin Setup Guide</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                      <div>
                        <div className="font-semibold text-white">Authenticate via Enterprise Google SSO / Magic Link</div>
                        <div className="text-slate-400 text-[10px]">Log into the workspace using your designated corporate email ({newCorpAdminEmail}).</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                      <div>
                        <div className="font-semibold text-white">Connect Enterprise BYOK API Keys</div>
                        <div className="text-slate-400 text-[10px]">Add company OpenAI, Anthropic, Gemini, or DeepSeek credentials with zero platform markup.</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                      <div>
                        <div className="font-semibold text-white">Initialize Department Workspaces & Teams</div>
                        <div className="text-slate-400 text-[10px]">Create sub-teams (Engineering, Data Science, Product) with designated Team Leads.</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                      <div>
                        <div className="font-semibold text-white">Invite Developers & Assign Quotas</div>
                        <div className="text-slate-400 text-[10px]">Bulk import team members with model tier caps and individual monthly token allowances.</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-white/5 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">5</span>
                      <div>
                        <div className="font-semibold text-white">Configure Autonomous Routing & Guardrails</div>
                        <div className="text-slate-400 text-[10px]">Enforce monthly token quota ({(newCompanyQuota / 1_000_000).toFixed(0)}M tokens) and ${newCompanyBudget} spend caps.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Notes from Super Admin */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-medium">Custom Super Admin Onboarding Message</label>
                  <textarea
                    rows={2}
                    value={customSetupInstructions}
                    onChange={(e) => setCustomSetupInstructions(e.target.value)}
                    placeholder="Enter custom onboarding notes or SLA terms..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Live Email Test Action & Status */}
                <div className="p-3 bg-slate-950 rounded-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoDispatchConfirm"
                      checked={autoDispatchOnConfirm}
                      onChange={(e) => setAutoDispatchOnConfirm(e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                    <label htmlFor="autoDispatchConfirm" className="text-slate-300 text-xs cursor-pointer">
                      <strong>Auto-send upon final setup confirmation</strong>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendWizardSetupEmail}
                    disabled={isSendingWizardEmail}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingWizardEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending via SMTP...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Test Email Now</span>
                      </>
                    )}
                  </button>
                </div>

                {wizardEmailDispatchStatus && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    wizardEmailDispatchStatus.sent
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}>
                    {wizardEmailDispatchStatus.sent ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="truncate">
                      {wizardEmailDispatchStatus.message || wizardEmailDispatchStatus.error}
                      {wizardEmailDispatchStatus.latencyMs && ` (${wizardEmailDispatchStatus.latencyMs}ms)`}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setCompanyWizardStep(3)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompanyWizardStep(5)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                  >
                    <span>Next: Confirm Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 5: CONFIRM SETUP ================= */}
            {companyWizardStep === 5 && (
              <div className="space-y-4 text-xs animate-fadeIn">
                {wizardCompletedCompany ? (
                  /* Success Confirmation View */
                  <div className="space-y-4 text-center py-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 mx-auto shadow-xl shadow-emerald-500/20">
                      <CheckCircle className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-white">
                        Enterprise Company Setup Confirmed!
                      </h4>
                      <p className="text-xs text-emerald-300">
                        {wizardCompletedCompany.name} is fully provisioned in Firestore with designated Company Admin governance.
                      </p>
                    </div>

                    {/* Summary Credentials Card */}
                    <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 text-left space-y-2 text-[11px]">
                      <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/10">
                        <div>
                          <span className="text-slate-400">Company ID:</span>
                          <div className="font-mono text-white font-bold">{wizardCompletedCompany.id}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Domain:</span>
                          <div className="font-mono text-cyan-300">{wizardCompletedCompany.domain}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/10">
                        <div>
                          <span className="text-slate-400">Company Administrator:</span>
                          <div className="text-amber-300 font-semibold">{wizardCompletedCompany.companyAdmins?.[0]?.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{wizardCompletedCompany.companyAdmins?.[0]?.email}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Allocated Quota:</span>
                          <div className="text-white font-mono">{(wizardCompletedCompany.monthlyTokenQuota / 1_000_000).toFixed(0)}M tokens / mo</div>
                          <div className="text-emerald-400 font-mono">${wizardCompletedCompany.monthlyBudgetUsd} / mo cap</div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Setup email with step-by-step instructions dispatched to {wizardCompletedCompany.companyAdmins?.[0]?.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowOnboardCompanyModal(false);
                          setWizardCompletedCompany(null);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                      >
                        Done & View Workspace
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowOnboardCompanyModal(false);
                          setWizardCompletedCompany(null);
                          setShowAddTeamModal(true);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
                      >
                        Create Department Team
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Pre-Submission Review & Confirmation Matrix */
                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                        <strong>Step 5: Confirm Setup & Provision</strong>. Review all tenant parameters below. Clicking <strong>Confirm Setup & Provision</strong> will atomically initialize the tenant in Firestore and dispatch the setup guide to the Company Admin.
                      </p>
                    </div>

                    {/* Summary Bento Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Tenant Profile Card */}
                      <div className="p-3.5 bg-slate-950 rounded-xl border border-white/10 space-y-2">
                        <div className="flex items-center gap-2 text-purple-300 font-bold border-b border-white/10 pb-1.5">
                          <Building2 className="w-4 h-4" />
                          <span>1. Organization Profile</span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div className="text-white font-bold text-sm">{newCompanyName}</div>
                          <div className="text-slate-400 font-mono">Domain: <span className="text-white">{newCompanyDomain}</span></div>
                          <div className="text-slate-400">Industry: <span className="text-white">{newCompanyIndustry}</span></div>
                          <div className="text-slate-400">Tier: <span className="text-purple-300 capitalize">{newCompanyTier.replace('_', ' ')}</span></div>
                          <div className="text-slate-400 font-mono">Billing: <span className="text-slate-300">{newCompanyBillingEmail}</span></div>
                        </div>
                      </div>

                      {/* Designated Company Admin Card */}
                      <div className="p-3.5 bg-slate-950 rounded-xl border border-amber-500/40 space-y-2">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                          <div className="flex items-center gap-2 text-amber-300 font-bold">
                            <Crown className="w-4 h-4" />
                            <span>2. Company Admin</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px]">
                            Linked
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div className="text-white font-bold text-sm">{newCorpAdminName}</div>
                          <div className="text-amber-200/90 font-mono">{newCorpAdminEmail}</div>
                          <div className="text-slate-400">Title: <span className="text-white">{newCorpAdminTitle}</span></div>
                          <div className="pt-1 text-[10px] text-slate-400 flex flex-wrap gap-1">
                            {newCorpAdminPrivileges.canCreateTeams && <span className="px-1 bg-white/5 rounded">Teams</span>}
                            {newCorpAdminPrivileges.canManageBYOK && <span className="px-1 bg-white/5 rounded">BYOK</span>}
                            {newCorpAdminPrivileges.canManageBudgets && <span className="px-1 bg-white/5 rounded">Budgets</span>}
                            {newCorpAdminPrivileges.canInviteMembers && <span className="px-1 bg-white/5 rounded">Invites</span>}
                            {newCorpAdminPrivileges.canConfigureRouting && <span className="px-1 bg-white/5 rounded">Routing</span>}
                            {newCorpAdminPrivileges.canViewTelemetry && <span className="px-1 bg-white/5 rounded">Telemetry</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Quotas & Allowlisted Models Summary */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold border-b border-white/10 pb-1.5">
                        <Cpu className="w-4 h-4" />
                        <span>3. AI Resource Quotas & Allowlisted Catalog</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <div className="text-slate-400 text-[10px]">Monthly Quota</div>
                          <div className="font-mono font-bold text-white">{(newCompanyQuota / 1_000_000).toFixed(0)}M tokens</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">Monthly Spend Cap</div>
                          <div className="font-mono font-bold text-emerald-400">${newCompanyBudget}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">Routing Strategy</div>
                          <div className="text-indigo-300 capitalize">{newCompanyRouting.replace('_', ' ')}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">Email Dispatch</div>
                          <div className="text-cyan-300">
                            {autoDispatchOnConfirm ? 'Automatic on Confirm' : 'Manual'}
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5">
                        {newCompanyModels.map(m => (
                          <span key={m} className="px-2 py-0.5 rounded-md bg-purple-950/40 border border-purple-500/30 text-purple-300 font-mono text-[10px]">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Final Submission Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setCompanyWizardStep(4)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back: Email Setup</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOnboardCompanySubmit()}
                        disabled={isSubmittingCompany || !isWizardStep1Valid || !isWizardStep2Valid}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingCompany ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Provisioning & Dispatching Setup...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Confirm Setup & Provision Company</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ==================== MODAL 2: ADD NEW TEAM ==================== */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Create Department Team
                  </h3>
                  <p className="text-xs text-slate-400">
                    Under <strong className="text-slate-200">{selectedCompany.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTeamModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTeamSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Research Lab, Backend Core, Data Science"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Team Lead Email *</label>
                <input
                  type="email"
                  required
                  placeholder="team-lead@solarastra.in"
                  value={newTeamLeadEmail}
                  onChange={(e) => setNewTeamLeadEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Max Model Tier</label>
                  <select
                    value={newTeamTierCap}
                    onChange={(e) => setNewTeamTierCap(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Frontier Tier 3 (Reasoning)">Tier 3: Reasoning Frontier (Gemini Pro, Claude 3.7, o3)</option>
                    <option value="General Tier 2 (Production)">Tier 2: General Production (GPT-4o, Mistral)</option>
                    <option value="Fast Tier 1 (Economy)">Tier 1: Fast Economy (Flash, Haiku, Llama 3.3)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Monthly Token Cap</label>
                  <input
                    type="number"
                    min="1000000"
                    step="1000000"
                    value={newTeamQuota}
                    onChange={(e) => setNewTeamQuota(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all cursor-pointer"
                >
                  Create Team in Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: INVITE TEAM MEMBER WITH REAL SMTP DISPATCH ==================== */}
      {showInviteMemberModal && activeTeamForInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Invite Member to {activeTeamForInvite.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dispatches credentials & quota notice via SMTP server
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteMemberModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteMemberSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Mehta"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Member Email Identity *</label>
                <input
                  type="email"
                  required
                  placeholder="arjun@solarastra.in"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Senior AI Developer">Senior AI Developer</option>
                    <option value="Research Scientist">Research Scientist</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Security Auditor">Security Auditor</option>
                    <option value="Team Admin">Team Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Model Tier Cap</label>
                  <select
                    value={inviteTierCap}
                    onChange={(e) => setInviteTierCap(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Frontier Tier 3">Frontier Tier 3 (Reasoning)</option>
                    <option value="General Tier 2">General Tier 2 (Production)</option>
                    <option value="Fast Tier 1">Fast Tier 1 (Economy)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Monthly Token Quota</label>
                <input
                  type="number"
                  min="500000"
                  step="500000"
                  value={inviteQuota}
                  onChange={(e) => setInviteQuota(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* SMTP Dispatch Toggle */}
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="smtpInviteCheck"
                  checked={dispatchSmtpWelcomeEmail}
                  onChange={(e) => setDispatchSmtpWelcomeEmail(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-purple-500 rounded cursor-pointer"
                />
                <label htmlFor="smtpInviteCheck" className="text-purple-200 text-xs cursor-pointer">
                  <strong>Dispatch Instant Onboarding Welcome Email via SMTP Server</strong>
                  <div className="text-[10px] text-purple-300/80 mt-0.5">
                    Sends real welcome email to <code>{inviteEmail || 'member'}</code> with workspace parameters, allowed model tiers, and Google login link.
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowInviteMemberModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatchingEmail}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  {isDispatchingEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Invite via SMTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Onboard Member</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CUSTOM IN-APP CONFIRMATION MODAL (SANDBOX SAFE) ==================== */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-400">Action requires confirmation</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-white/5 font-mono">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const fn = confirmDialog.onConfirm;
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  await fn();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: QUICK SMTP CONFIGURATION & DISPATCH ==================== */}
      {showSmtpQuickConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Configure Outbound SMTP Gateway
                  </h3>
                  <p className="text-xs text-slate-400">
                    Authenticate the email server to dispatch live onboarding invites
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSmtpQuickConfigModal(false);
                  setTargetMemberForEmail(null);
                }}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {targetMemberForEmail && (
              <div className="p-3.5 rounded-xl bg-purple-950/50 border border-purple-500/30 space-y-1">
                <div className="flex items-center gap-2 text-purple-200 font-semibold">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span>Pending Invitation Dispatch:</span>
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  Recipient: <strong className="text-white">{targetMemberForEmail.member.name}</strong> ({targetMemberForEmail.member.email}) • Team: <strong className="text-purple-300">{targetMemberForEmail.team.name}</strong>
                </div>
                <div className="text-[11px] text-purple-300/80">
                  Once your SMTP credentials are saved, WhyOr Dispatch AI will automatically dispatch the invitation email immediately.
                </div>
              </div>
            )}

            {/* Quick Gmail Guide */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Gmail App Password Setup (Required for Google Mail)
                </span>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 underline"
                >
                  <span>Open Google App Passwords</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Because Google accounts use 2-Step Verification, standard account passwords cannot be used for SMTP. 
                Generate a 16-character App Password at <strong className="text-white">myaccount.google.com/apppasswords</strong> (Name it &quot;WhyOr Dispatch AI&quot;) and paste it below.
              </p>
            </div>

            {quickSmtpNotice && (
              <div className={`p-3 rounded-xl flex items-center gap-2 border text-xs ${
                quickSmtpNotice.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' :
                quickSmtpNotice.type === 'error' ? 'bg-rose-950/60 border-rose-500/40 text-rose-200' :
                'bg-indigo-950/60 border-indigo-500/40 text-indigo-200'
              }`}>
                {quickSmtpNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span className="leading-snug">{quickSmtpNotice.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveAndDispatchSmtp} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-slate-300 font-medium">SMTP Server Host *</label>
                  <input
                    type="text"
                    required
                    value={quickSmtpHost}
                    onChange={(e) => setQuickSmtpHost(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Port *</label>
                  <input
                    type="number"
                    required
                    value={quickSmtpPort}
                    onChange={(e) => setQuickSmtpPort(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Sender Email Address (Username) *</label>
                <input
                  type="email"
                  required
                  value={quickSmtpUser}
                  onChange={(e) => setQuickSmtpUser(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  placeholder="solarastra.in@gmail.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">16-Character App Password *</label>
                  <span className="text-[10px] text-slate-400 font-mono">e.g. &quot;abcd efgh ijkl mnop&quot;</span>
                </div>
                <div className="relative">
                  <input
                    type={showQuickPass ? 'text' : 'password'}
                    required
                    value={quickSmtpPass}
                    onChange={(e) => setQuickSmtpPass(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500 pr-10"
                    placeholder="•••• •••• •••• ••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuickPass(!showQuickPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showQuickPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-slate-200">SSL/TLS Security Mode</div>
                  <div className="text-[10px] text-slate-400">
                    Use port 587 with STARTTLS (recommended) or port 465 with Direct SSL.
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quickSmtpSecure}
                    onChange={(e) => setQuickSmtpSecure(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-slate-300">Direct SSL (465)</span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={isTestingSmtp || !quickSmtpPass}
                  onClick={handleTestSmtpConnection}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-400 ${isTestingSmtp ? 'animate-spin' : ''}`} />
                  <span>{isTestingSmtp ? 'Testing Handshake...' : 'Test Connection'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSmtpQuickConfigModal(false);
                      setTargetMemberForEmail(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingQuickSmtp || !quickSmtpPass}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingQuickSmtp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving & Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{targetMemberForEmail ? `Save & Send to ${targetMemberForEmail.member.email}` : 'Save Credentials'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: PROVISION / EDIT CORPORATE ADMIN ==================== */}
      {showCorpAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingCorpAdmin ? 'Edit Corporate Administrator' : 'Appoint Corporate Administrator'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Company: <strong className="text-slate-200">{selectedCompany.name}</strong> • Delegated SuperAdmin Authority
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCorpAdminModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
              <strong>Corporate Admin Authority:</strong> This administrator can log in to manage department teams, enterprise BYOK credentials, model routing, token budgets, and engineer onboarding for <strong>{selectedCompany.name}</strong>.
            </div>

            <form onSubmit={handleSaveCorporateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium text-xs">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={corpAdminName}
                    onChange={(e) => setCorpAdminName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium text-xs">Work Email Address *</label>
                  <input
                    type="email"
                    required
                    value={corpAdminEmail}
                    onChange={(e) => setCorpAdminEmail(e.target.value)}
                    placeholder="elena.rostova@solarastra.in"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium text-xs">Executive Title / Role</label>
                  <input
                    type="text"
                    value={corpAdminTitle}
                    onChange={(e) => setCorpAdminTitle(e.target.value)}
                    placeholder="Director of AI Engineering"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium text-xs">Tier Access Cap</label>
                  <select
                    value={corpAdminTierCap}
                    onChange={(e) => setCorpAdminTierCap(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Frontier Tier 3">Frontier Tier 3 (Full Reasoning & Flagships)</option>
                    <option value="General Tier 2">General Tier 2 (Standard Enterprise)</option>
                    <option value="Fast Tier 1">Fast Tier 1 (High-Throughput)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium text-xs">Monthly Token Quota Allocation</label>
                  <span className="text-[11px] font-mono text-purple-300 font-bold">
                    {(corpAdminQuota / 1_000_000).toFixed(0)}M tokens/mo
                  </span>
                </div>
                <input
                  type="range"
                  min={5_000_000}
                  max={selectedCompany.monthlyTokenQuota || 100_000_000}
                  step={5_000_000}
                  value={corpAdminQuota}
                  onChange={(e) => setCorpAdminQuota(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Delegated Privileges Checkboxes */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 space-y-2.5">
                <div className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Delegated Administrative Privileges
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-white/5 cursor-pointer text-slate-200 hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={corpAdminPrivileges.canCreateTeams}
                      onChange={(e) => setCorpAdminPrivileges({ ...corpAdminPrivileges, canCreateTeams: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <div>
                      <div className="font-semibold text-[11px]">Create & Manage Teams</div>
                      <div className="text-[9px] text-slate-400">Add departmental sub-teams & assign leads</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-white/5 cursor-pointer text-slate-200 hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={corpAdminPrivileges.canManageBYOK}
                      onChange={(e) => setCorpAdminPrivileges({ ...corpAdminPrivileges, canManageBYOK: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <div>
                      <div className="font-semibold text-[11px]">Enterprise BYOK Keys</div>
                      <div className="text-[9px] text-slate-400">Configure provider keys (OpenAI, Anthropic, Gemini)</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-white/5 cursor-pointer text-slate-200 hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={corpAdminPrivileges.canManageBudgets}
                      onChange={(e) => setCorpAdminPrivileges({ ...corpAdminPrivileges, canManageBudgets: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <div>
                      <div className="font-semibold text-[11px]">Spend & Budget Caps</div>
                      <div className="text-[9px] text-slate-400">Allocate quotas & enforce spend thresholds</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-white/5 cursor-pointer text-slate-200 hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={corpAdminPrivileges.canInviteMembers}
                      onChange={(e) => setCorpAdminPrivileges({ ...corpAdminPrivileges, canInviteMembers: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <div>
                      <div className="font-semibold text-[11px]">Invite & Provision Engineers</div>
                      <div className="text-[9px] text-slate-400">Send credential invites and manage roles</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-white/5 cursor-pointer text-slate-200 hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={corpAdminPrivileges.canConfigureRouting}
                      onChange={(e) => setCorpAdminPrivileges({ ...corpAdminPrivileges, canConfigureRouting: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <div>
                      <div className="font-semibold text-[11px]">Autonomous Routing</div>
                      <div className="text-[9px] text-slate-400">Configure BYOK vs flat-rate subscription policies</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-white/5 cursor-pointer text-slate-200 hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={corpAdminPrivileges.canViewTelemetry}
                      onChange={(e) => setCorpAdminPrivileges({ ...corpAdminPrivileges, canViewTelemetry: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <div>
                      <div className="font-semibold text-[11px]">Live Telemetry & Logs</div>
                      <div className="text-[9px] text-slate-400">View real-time token metrics and audit trails</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Email dispatch toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-white/10">
                <input
                  type="checkbox"
                  id="corpAdminEmailToggle"
                  checked={corpAdminSendEmail}
                  onChange={(e) => setCorpAdminSendEmail(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <label htmlFor="corpAdminEmailToggle" className="text-slate-300 text-xs cursor-pointer">
                  <strong>Dispatch Live Onboarding Email</strong>: Send immediate credential setup email with interpolated company & privilege parameters.
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCorpAdminModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCorpAdmin}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCorpAdmin ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Corporate Admin...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-3.5 h-3.5" />
                      <span>{editingCorpAdmin ? 'Update Privileges' : 'Appoint Corporate Admin'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADMIN REQUIRED ENTERPRISE GUARDRAIL ==================== */}
      {showAdminRequiredGuardrailModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Company Administrator Required
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/40 font-semibold">
                    Policy Block
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Tenant: <strong className="text-white">{selectedCompany.name}</strong> (@{selectedCompany.domain})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/20 text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                <strong className="text-amber-300">Enterprise CUJ Guardrail:</strong> You cannot create teams or invite individual employees for <strong>{selectedCompany.name}</strong> until a <strong>Company Administrator</strong> has been designated.
              </p>
              <p className="text-[11px] text-slate-400">
                SuperAdmin onboards companies and creates their initial Company Admin. That Company Admin then holds delegated authority to seed employees via SSO, bulk CSV upload, or manual invites, as well as configure departmental teams and model budgets.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAdminRequiredGuardrailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdminRequiredGuardrailModal(false);
                  handleOpenCorpAdminModal();
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>👑 Appoint Company Admin Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: BULK CSV SEEDING MODAL DIALOG ==================== */}
      {showBulkUploadModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Bulk Employee CSV Seeding: {selectedCompany.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Import employee roster, map roles, provision departmental teams, and allocate monthly token quotas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkUploadModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">
                    CSV Roster Input (Format: Full Name, Email, Role, Team, Model Tier, Monthly Tokens, Monthly Budget)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkCsvText(
`Full Name, Email, Role, Team, Model Tier, Monthly Token Quota, Monthly Budget ($)
Elena Rostova, elena.dev@${selectedCompany.domain}, Senior AI Developer, AI Core Lab, Frontier Tier 3, 25000000, 1000
David Kim, david.k@${selectedCompany.domain}, AI / ML Engineer, AI Core Lab, Frontier Tier 3, 20000000, 800
Sarah Jenkins, s.jenkins@${selectedCompany.domain}, Product Manager (AI), Product Innovation, General Tier 2, 10000000, 500
Michael Chang, m.chang@${selectedCompany.domain}, Prompt & QA Engineer, Validation Team, Fast Tier 1, 10000000, 400
Aisha Patel, aisha.p@${selectedCompany.domain}, Staff AI Researcher, Research & Deep Reasoning, Frontier Tier 3, 30000000, 1500`
                      );
                      const parsed = parseBulkCsv(
`Full Name, Email, Role, Team, Model Tier, Monthly Token Quota, Monthly Budget ($)
Elena Rostova, elena.dev@${selectedCompany.domain}, Senior AI Developer, AI Core Lab, Frontier Tier 3, 25000000, 1000
David Kim, david.k@${selectedCompany.domain}, AI / ML Engineer, AI Core Lab, Frontier Tier 3, 20000000, 800
Sarah Jenkins, s.jenkins@${selectedCompany.domain}, Product Manager (AI), Product Innovation, General Tier 2, 10000000, 500
Michael Chang, m.chang@${selectedCompany.domain}, Prompt & QA Engineer, Validation Team, Fast Tier 1, 10000000, 400
Aisha Patel, aisha.p@${selectedCompany.domain}, Staff AI Researcher, Research & Deep Reasoning, Frontier Tier 3, 30000000, 1500`
                      );
                      setBulkParsedMembers(parsed);
                    }}
                    className="text-purple-300 hover:text-purple-200 font-mono text-[11px] underline cursor-pointer"
                  >
                    Load Sample Roster
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={bulkCsvText}
                  onChange={(e) => {
                    setBulkCsvText(e.target.value);
                    const parsed = parseBulkCsv(e.target.value);
                    setBulkParsedMembers(parsed);
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                  placeholder="Full Name, Email, Role, Team, Model Tier, Monthly Token Quota, Monthly Budget ($)"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkAutoCreateTeams}
                    onChange={(e) => setBulkAutoCreateTeams(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  <div>
                    <div className="font-semibold text-white">Auto-Create Missing Teams</div>
                    <div className="text-[10px] text-slate-400">Creates any team names in CSV that do not exist yet</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkSendSmtpEmails}
                    onChange={(e) => setBulkSendSmtpEmails(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                  <div>
                    <div className="font-semibold text-white">Dispatch SMTP Welcome Emails</div>
                    <div className="text-[10px] text-slate-400">Dispatches real credentials notice to each imported engineer</div>
                  </div>
                </label>
              </div>

              {/* Preview Table */}
              {bulkParsedMembers.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300">
                      Parsed {bulkParsedMembers.length} Rows • <strong className="text-emerald-400">{bulkParsedMembers.filter(r => r.status === 'valid').length} Valid</strong>
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-white/10 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase sticky top-0 border-b border-white/10">
                        <tr>
                          <th className="py-2 px-2.5">Name</th>
                          <th className="py-2 px-2.5">Email</th>
                          <th className="py-2 px-2.5">Role</th>
                          <th className="py-2 px-2.5">Team</th>
                          <th className="py-2 px-2.5">Tier</th>
                          <th className="py-2 px-2.5">Tokens/Mo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {bulkParsedMembers.map((row) => (
                          <tr key={row.id}>
                            <td className="py-1.5 px-2.5 text-slate-200 font-medium">{row.name}</td>
                            <td className="py-1.5 px-2.5 font-mono text-purple-300">{row.email}</td>
                            <td className="py-1.5 px-2.5 text-slate-400">{row.role}</td>
                            <td className="py-1.5 px-2.5 text-indigo-300">{row.teamName}</td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-400">{row.tierCap}</td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-200">{(row.monthlyTokenQuota / 1_000_000).toFixed(0)}M</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowBulkUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isImportingBulk || bulkParsedMembers.filter(r => r.status === 'valid').length === 0}
                  onClick={async () => {
                    await handleExecuteBulkImport();
                    setShowBulkUploadModal(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isImportingBulk ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import & Seed {bulkParsedMembers.filter(r => r.status === 'valid').length} Members</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
