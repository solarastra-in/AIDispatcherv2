import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  deleteDoc,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom Database ID and Auto Long-Polling (resilient in sandboxed preview iframe)
const targetDbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let firestoreInstance;
try {
  firestoreInstance = targetDbId
    ? initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      }, targetDbId)
    : initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      });
} catch {
  firestoreInstance = targetDbId ? getFirestore(app, targetDbId) : getFirestore(app);
}

export const db = firestoreInstance;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

// Helper for friendly Firebase Auth error messages
export function formatFirebaseAuthError(error: any): string | null {
  const code = error?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return null; // User intentionally cancelled/closed the popup
  }
  if (code === 'auth/popup-blocked') {
    return 'The sign-in popup was blocked by your browser. Please allow popups for this site or open in a new tab.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection issue during authentication. Please check your internet connection.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with the same email address using a different sign-in method.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized for Google Sign-In. Please authorize this origin in the Firebase Console.';
  }
  return error?.message || 'Authentication could not be completed. Please try again.';
}

// Real Google Sign-In with Popup
export async function signInWithGoogle(): Promise<{ user: User; idToken: string }> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    
    // Persist user profile to Firestore with baseline 'user' role
    await saveUserProfile(user, 'user');

    return { user, idToken };
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      console.info('Google Sign-In popup closed by user.');
    } else if (code === 'auth/popup-blocked') {
      console.warn('Google Sign-In popup was blocked by browser.');
    } else {
      console.warn('Google Sign-In notice:', error?.message || error);
    }
    throw error;
  }
}

// Sign Out
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// Auth State Change Listener
export function onAuthChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// User Profile Firestore Sync
export async function saveUserProfile(user: User, role: string) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const resolvedRole = user.email === 'solarastra.in@gmail.com' ? 'super_admin' : (role || 'user');
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Admin',
      photoURL: user.photoURL || '',
      role: resolvedRole,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err: any) {
    console.warn('saveUserProfile notice:', err.message);
  }
}

// ==================== LOCAL STORAGE CACHE & FALLBACK HELPERS ====================
function safeStorageGet<T>(key: string, defaultVal: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return defaultVal;
    const item = window.localStorage.getItem(key);
    if (!item) return defaultVal;
    return JSON.parse(item) as T;
  } catch {
    return defaultVal;
  }
}

function safeStorageSet<T>(key: string, val: T): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(val));
    }
  } catch {
    // Ignore quota or private mode errors
  }
}

// ==================== FIRESTORE PERSISTENCE HELPERS ====================
 
// 1. Credentials Persistence
export async function saveCredentialToFirestore(provider: string, data: any) {
  const merged = {
    ...data,
    provider,
    updatedAt: new Date().toISOString(),
  };
  safeStorageSet(`whyor_cred_${provider}`, merged);
  try {
    const credRef = doc(db, 'credentials', provider);
    await setDoc(credRef, merged, { merge: true });
  } catch (err: any) {
    console.warn('Firestore credential write notice (cached locally):', err.message);
  }
}

export async function loadAllCredentialsFromFirestore(): Promise<Record<string, any>> {
  const result: Record<string, any> = {};
  try {
    const snap = await getDocs(collection(db, 'credentials'));
    snap.forEach((docSnap) => {
      result[docSnap.id] = docSnap.data();
    });
  } catch (err: any) {
    console.warn('Firestore credentials load notice (using cache):', err.message);
  }

  // Merge with local storage cache
  const defaultProviders = ['google', 'anthropic', 'openai', 'deepseek', 'groq', 'mistral', 'xai'];
  for (const prov of defaultProviders) {
    const cached = safeStorageGet<any>(`whyor_cred_${prov}`, null);
    if (cached && !result[prov]) {
      result[prov] = cached;
    }
  }
  return result;
}

// 2. SMTP Settings Persistence (Admin Console)
export interface SmtpConfigFirestore {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  requireTls: boolean;
  user: string;
  passMasked?: string;
  passRaw?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  pool?: boolean;
  maxConnections?: number;
  rateLimit?: number;
  connectionTimeout?: number;
  socketTimeout?: number;
  greetingTimeout?: number;
  authMethod?: string;
  preset?: string;
  isVerified: boolean;
  lastVerifiedAt?: string;
  lastTestedAt?: string;
  lastTestRecipient?: string;
  lastTestStatus?: 'success' | 'failed';
  updatedAt?: string;
  updatedBy?: string;
}

export async function saveSmtpSettingsToFirestore(settings: Partial<SmtpConfigFirestore>) {
  const merged = { ...settings, id: 'global_smtp', updatedAt: new Date().toISOString() };
  const smtpRef = doc(db, 'smtp_settings', 'global_smtp');
  await setDoc(smtpRef, merged, { merge: true });
}

export async function loadSmtpSettingsFromFirestore(): Promise<SmtpConfigFirestore | null> {
  const docSnap = await getDoc(doc(db, 'smtp_settings', 'global_smtp'));
  return docSnap.exists() ? (docSnap.data() as SmtpConfigFirestore) : null;
}

// 2b. Email Templates Persistence (HTML & Text Customization for Billing/System Notifications)
export interface EmailTemplateConfig {
  id: string;
  name: string;
  category: 'billing' | 'system' | 'security' | 'onboarding' | 'verification';
  subject: string;
  htmlBody: string;
  textBody?: string;
  description: string;
  variables: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export async function saveEmailTemplateToFirestore(template: EmailTemplateConfig) {
  const templateRef = doc(db, 'email_templates', template.id);
  await setDoc(templateRef, { ...template, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function saveAllEmailTemplatesToFirestore(templates: Record<string, EmailTemplateConfig>) {
  await Promise.all(Object.values(templates).map((template) => saveEmailTemplateToFirestore(template)));
}

export async function loadEmailTemplatesFromFirestore(): Promise<Record<string, EmailTemplateConfig> | null> {
  const snap = await getDocs(collection(db, 'email_templates'));
  if (snap.empty) return null;
  const result: Record<string, EmailTemplateConfig> = {};
  snap.forEach((docSnap) => { result[docSnap.id] = docSnap.data() as EmailTemplateConfig; });
  return result;
}

// 3. Email Logs
export async function logEmailToFirestore(log: {
  to: string;
  from: string;
  subject: string;
  emailType: string;
  status: 'sent' | 'failed';
  messageId?: string;
  errorMessage?: string;
  sentBy?: string;
}) {
  const logId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullLog = { ...log, id: logId, sentAt: new Date().toISOString() };
  const logRef = doc(db, 'email_logs', logId);
  await setDoc(logRef, fullLog);
}

export async function loadEmailLogsFromFirestore(limitCount: number = 50): Promise<any[]> {
  const q = query(collection(db, 'email_logs'), orderBy('sentAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  const logs: any[] = [];
  snap.forEach((d) => logs.push(d.data()));
  return logs;
}

// 4. Dispatch Ledger & Context Ledger Persistence
export async function saveDispatchRecordToFirestore(entry: any) {
  const ledgerId = entry.taskId || entry.id || `dispatch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullEntry = { ...entry, id: ledgerId, timestamp: entry.timestamp || new Date().toISOString() };
  const ledgerRef = doc(db, 'dispatch_ledger', ledgerId);
  await setDoc(ledgerRef, fullEntry, { merge: true });
}

export async function saveLedgerEntryToFirestore(entry: any) {
  return saveDispatchRecordToFirestore(entry);
}

export async function loadDispatchLedgerFromFirestore(limitCount: number = 100): Promise<any[]> {
  const q = query(collection(db, 'dispatch_ledger'), orderBy('timestamp', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  const entries: any[] = [];
  snap.forEach((d) => entries.push(d.data()));
  return entries;
}

export async function loadLedgerFromFirestore(limitCount: number = 100): Promise<any[]> {
  return loadDispatchLedgerFromFirestore(limitCount);
}

// 5. Context Sessions Persistence (With Firestore as Default, or Transient Local only when toggled)
export async function saveContextSessionToFirestore(
  sessionIdOrObj: string | { id: string; [key: string]: any },
  sessionData?: any
) {
  let id = typeof sessionIdOrObj === 'string' ? sessionIdOrObj : sessionIdOrObj.id;
  let data = typeof sessionIdOrObj === 'string' ? (sessionData || {}) : sessionIdOrObj;

  // Only persist to Firestore if persistenceMode is firestore_cloud (DEFAULT)
  if (data.persistenceMode === 'local_transient') {
    return;
  }

  const sessionRef = doc(db, 'context_sessions', id || `ctx_${Date.now()}`);
  await setDoc(sessionRef, {
    ...data,
    id: id || `ctx_${Date.now()}`,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function loadContextSessionsFromFirestore(): Promise<any[]> {
  const q = query(collection(db, 'context_sessions'), orderBy('updatedAt', 'desc'), limit(50));
  const snap = await getDocs(q);
  const sessions: any[] = [];
  snap.forEach((d) => sessions.push(d.data()));
  return sessions;
}

// 6. Audit Logs
export async function recordAuditLogToFirestore(action: string, category: string, actor: string, details: string) {
  const idToken = await auth.currentUser?.getIdToken();
  const res = await fetch('/api/admin/audit-logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ eventType: action, actorEmail: actor, details: { category, details } }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to record audit log (${res.status})`);
  }
}

export async function loadAuditLogsFromFirestore(limitCount: number = 50): Promise<any[]> {
  const idToken = await auth.currentUser?.getIdToken();
  const res = await fetch(`/api/admin/audit-logs?limit=${limitCount}`, {
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load audit logs (${res.status})`);
  }
  const data = await res.json();
  return data.logs || [];
}

// 7. Companies & Enterprise Onboarding Persistence
export interface CorporateAdminPrivileges {
  // Team Creation & Hierarchy Controls
  canCreateTeams: boolean;
  maxTeamsAllowed?: number; // e.g. 5, 10, or undefined for unlimited
  canAssignTeamLeads?: boolean;
  canDeleteTeams?: boolean;
  canSetTeamBudgets?: boolean;
  allowedTeamTiers?: ('low' | 'mid' | 'high' | 'frontier' | 'deep_reasoning')[];

  // BYOK Management Controls
  canManageBYOK: boolean;
  canAddProviderKeys?: boolean;
  canDeleteProviderKeys?: boolean;
  canToggleSubscriptionFallback?: boolean;
  canEnforceTeamKeyInheritance?: boolean;
  allowedBYOKProviders?: string[]; // e.g. ['google', 'openai', 'anthropic', 'deepseek', 'groq', 'mistral']

  // Budget, Member & Platform Policies
  canManageBudgets: boolean;
  maxBudgetAllocatedUsd?: number;
  canInviteMembers: boolean;
  canConfigureRouting: boolean;
  canViewTelemetry: boolean;
  canManageSmtpAlerts?: boolean;
  canManageCompanyProfile?: boolean;
}

export interface CompanyAdminUser {
  id: string;
  name: string;
  email: string;
  role: 'company_admin' | 'corporate_admin';
  title?: string;
  tierCap?: string;
  monthlyTokenQuota?: number;
  monthlyTokensUsed?: number;
  privileges: CorporateAdminPrivileges;
  assignedAt: string;
  assignedBy?: string;
  status: 'active' | 'invited' | 'suspended';
  lastActiveAt?: string;
}

export interface CompanySsoSettings {
  enabled: boolean;
  ssoDomain: string;
  defaultTeamId?: string;
  defaultRole: string;
  defaultTierCap: string;
  defaultMonthlyTokenQuota: number;
  autoDispatchWelcomeEmail: boolean;
}

export interface CompanyFirestore {
  id: string;
  name: string;
  domain: string;
  industry: string;
  tier: 'enterprise' | 'growth' | 'startup' | 'gov_defense';
  billingEmail: string;
  monthlyTokenQuota: number;
  monthlyTokensUsed: number;
  monthlyBudgetUsd: number;
  allowedModels: string[];
  routingPriority: 'subscription_first' | 'byok_first' | 'balanced' | 'latency_optimized';
  smtpAlertsEnabled: boolean;
  superAdminEmail: string;
  companyAdminEmail?: string;
  companyAdmins?: CompanyAdminUser[];
  ssoSettings?: CompanySsoSettings;
  status: 'active' | 'paused' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export async function saveCompanyToFirestore(
  company: CompanyFirestore,
  options?: { checkDuplicates?: boolean }
): Promise<void> {
  const compName = (company.name || '').trim().toLowerCase();
  const compDomain = (company.domain || '').trim().toLowerCase();

  // If duplicate checking is requested, verify against Firestore and cached documents
  if (options?.checkDuplicates) {
    try {
      const snap = await getDocs(collection(db, 'companies'));
      let conflictFound = false;
      let conflictName = '';
      snap.forEach((d) => {
        const data = d.data() as CompanyFirestore;
        if (d.id !== company.id) {
          const dName = (data.name || '').trim().toLowerCase();
          const dDomain = (data.domain || '').trim().toLowerCase();
          if ((compName && dName === compName) || (compDomain && dDomain && dDomain === compDomain)) {
            conflictFound = true;
            conflictName = data.name;
          }
        }
      });

      if (conflictFound) {
        throw new Error(`DUPLICATE_COMPANY: Customer '${conflictName || company.name}' or domain '${company.domain}' already exists in registry.`);
      }
    } catch (checkErr: any) {
      if (checkErr.message?.startsWith('DUPLICATE_COMPANY')) {
        throw checkErr;
      }
      // Non-blocking network check fallback
      console.warn('Duplicate check warning:', checkErr?.message || checkErr);
    }
  }

  const updated = { ...company, updatedAt: new Date().toISOString() };
  const compRef = doc(db, 'companies', company.id);
  await setDoc(compRef, updated, { merge: true });
}

export async function loadCompaniesFromFirestore(): Promise<CompanyFirestore[]> {
  const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'), limit(50));
  const snap = await getDocs(q);
  const comps: CompanyFirestore[] = [];
  snap.forEach((d) => comps.push(d.data() as CompanyFirestore));
  return comps;
}

export async function deleteCompanyFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, 'companies', id));
}

// 8. Teams & Granular Access Controls Persistence
export interface TeamFirestore {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  leadEmail: string;
  tierCap: string;
  monthlyTokenQuota: number;
  monthlyTokensUsed: number;
  monthlyBudgetUsd: number;
  allowedModels: string[];
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    tierCap: string;
    monthlyTokenQuota: number;
    monthlyTokensUsed: number;
    joinedAt: string;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export async function saveTeamToFirestore(team: TeamFirestore): Promise<void> {
  const updated = { ...team, updatedAt: new Date().toISOString() };
  const teamRef = doc(db, 'teams', team.id);
  await setDoc(teamRef, updated, { merge: true });
}

export async function loadTeamsFromFirestore(companyId?: string): Promise<TeamFirestore[]> {
  const q = query(collection(db, 'teams'), orderBy('createdAt', 'desc'), limit(50));
  const snap = await getDocs(q);
  const teams: TeamFirestore[] = [];
  snap.forEach((d) => {
    const data = d.data() as TeamFirestore;
    if (!companyId || data.companyId === companyId) teams.push(data);
  });
  return teams;
}

export async function deleteTeamFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, 'teams', id));
}

// ==================== 9. USER 7-DAY TRIAL & SUBSCRIPTION TRACKING ====================
export interface UserTrialInfo {
  uid: string;
  email: string;
  displayName: string;
  plan: 'free_trial' | 'pro' | 'enterprise';
  planType?: string;
  isPaidPlan?: boolean;
  signupDate: string;
  trialStartDate: string;
  trialEndDate: string;
  trialStartedAt?: string;
  trialExpiresAt?: string;
  trialDaysTotal: number;
  daysRemaining: number;
  isTrialActive: boolean;
  isExpired: boolean;
  emailVerified?: boolean;
  hasConfiguredByok: boolean;
  isByokConfigured?: boolean;
  dailyTokensUsed: number;
  dailyTokenLimit: number;
  totalTokensProcessed: number;
  totalDispatches: number;
  updatedAt: string;
}

export async function saveUserTrialToFirestore(trial: Partial<UserTrialInfo> & { uid: string; email: string }): Promise<UserTrialInfo> {
  let now = new Date();

  let signupDate = trial.signupDate || trial.trialStartedAt || now.toISOString();
  let trialStartDate = trial.trialStartDate || trial.trialStartedAt || now.toISOString();
  
  // Calculate trial end (7 days from start)
  let startDateObj = new Date(trialStartDate);
  let endDateObj = new Date(startDateObj.getTime() + 7 * 24 * 60 * 60 * 1000);
  let trialEndDate = trial.trialEndDate || trial.trialExpiresAt || endDateObj.toISOString();
  
  let msRemaining = new Date(trialEndDate).getTime() - now.getTime();
  let daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  let isTrialActive = trial.isTrialActive ?? (daysRemaining > 0);
  let isExpired = daysRemaining <= 0 && (trial.plan === 'free_trial' || !trial.plan);

  const fullData: UserTrialInfo = {
    uid: trial.uid,
    email: trial.email,
    displayName: trial.displayName || trial.email.split('@')[0] || 'User',
    plan: trial.plan || (trial.isPaidPlan ? 'pro' : 'free_trial'),
    planType: trial.planType || (trial.isPaidPlan ? 'pro' : 'free_trial'),
    isPaidPlan: trial.isPaidPlan ?? (trial.plan === 'pro' || trial.plan === 'enterprise'),
    signupDate,
    trialStartDate,
    trialEndDate,
    trialStartedAt: signupDate,
    trialExpiresAt: trialEndDate,
    trialDaysTotal: 7,
    daysRemaining,
    isTrialActive,
    isExpired,
    hasConfiguredByok: trial.hasConfiguredByok ?? trial.isByokConfigured ?? false,
    isByokConfigured: trial.hasConfiguredByok ?? trial.isByokConfigured ?? false,
    dailyTokensUsed: trial.dailyTokensUsed ?? 0,
    dailyTokenLimit: trial.dailyTokenLimit ?? 100000,
    totalTokensProcessed: trial.totalTokensProcessed ?? 0,
    totalDispatches: trial.totalDispatches ?? 0,
    updatedAt: now.toISOString(),
  };

  const userDocRef = doc(db, 'user_trials', trial.uid);
  await setDoc(userDocRef, fullData, { merge: true });
  return fullData;
}

export async function getUserTrialFromFirestore(uid: string, email?: string): Promise<UserTrialInfo | null> {
  const userDocRef = doc(db, 'user_trials', uid);
  const snap = await getDoc(userDocRef);
  if (snap.exists()) {
    const data = snap.data() as UserTrialInfo;
    const now = new Date();
    const trialEndDate = data.trialEndDate || data.trialExpiresAt || new Date().toISOString();
    const msRemaining = new Date(trialEndDate).getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    return {
      ...data,
      daysRemaining,
      trialExpiresAt: trialEndDate,
      trialStartedAt: data.trialStartDate || data.signupDate,
      isTrialActive: daysRemaining > 0,
      isExpired: daysRemaining <= 0 && data.plan === 'free_trial',
      isPaidPlan: data.isPaidPlan || data.plan === 'pro' || data.plan === 'enterprise',
      isByokConfigured: data.hasConfiguredByok || data.isByokConfigured,
    };
  }
  if (email) {
    // Auto-initialize 7-day free trial on first retrieval
    return await saveUserTrialToFirestore({ uid, email });
  }
  return null;
}

export async function loadAllUserTrialsFromFirestore(): Promise<UserTrialInfo[]> {
  const q = query(collection(db, 'user_trials'), orderBy('signupDate', 'desc'), limit(100));
  const snap = await getDocs(q);
  const trials: UserTrialInfo[] = [];
  snap.forEach((d) => {
    const data = d.data() as UserTrialInfo;
    const now = new Date();
    const trialEndDate = data.trialEndDate || data.trialExpiresAt || new Date().toISOString();
    const msRemaining = new Date(trialEndDate).getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    trials.push({
      ...data,
      daysRemaining,
      trialExpiresAt: trialEndDate,
      trialStartedAt: data.trialStartDate || data.signupDate,
      isTrialActive: daysRemaining > 0,
      isExpired: daysRemaining <= 0 && data.plan === 'free_trial',
      isPaidPlan: data.isPaidPlan || data.plan === 'pro' || data.plan === 'enterprise',
      isByokConfigured: data.hasConfiguredByok || data.isByokConfigured,
    });
  });
  return trials;
}

// ==================== 10. CONTACT US INQUIRIES ====================
export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  topic: 'enterprise_quote' | 'custom_onprem' | 'sla_security' | 'byok_integration' | 'billing_api' | 'general';
  message: string;
  status: 'new' | 'in_review' | 'contacted' | 'resolved' | 'closed';
  createdAt: string;
}

export async function saveContactInquiryToFirestore(inquiry: Omit<ContactInquiry, 'id' | 'createdAt' | 'status'>): Promise<ContactInquiry> {
  const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullInquiry: ContactInquiry = {
    ...inquiry,
    id,
    status: 'new',
    createdAt: new Date().toISOString(),
  };

  // Primary write to Firestore
  await setDoc(doc(db, 'contact_inquiries', id), fullInquiry);

  // Best-effort audit log
  try {
    await recordAuditLogToFirestore('CONTACT_INQUIRY_RECEIVED', 'support', inquiry.email, `Inquiry: ${inquiry.topic} from ${inquiry.name}`);
  } catch (auditErr: any) {
    console.warn('Notice: Could not record audit log for contact inquiry (expected for anonymous submitters):', auditErr?.message || auditErr);
  }

  return fullInquiry;
}

export async function updateContactInquiryStatusInFirestore(id: string, status: ContactInquiry['status']): Promise<void> {
  const docRef = doc(db, 'contact_inquiries', id);
  await setDoc(docRef, { status, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function loadContactInquiriesFromFirestore(): Promise<ContactInquiry[]> {
  const q = query(collection(db, 'contact_inquiries'), orderBy('createdAt', 'desc'), limit(50));
  const snap = await getDocs(q);
  const inquiries: ContactInquiry[] = [];
  snap.forEach((d) => inquiries.push(d.data() as ContactInquiry));
  return inquiries;
}

// ==================== 11. ADMIN AI ENGINE KEYS & BUDGET CONFIGURATION ====================
export interface AdminKeyConfig {
  id: string;
  provider: string; // 'gemini' | 'claude' | 'openai' | 'deepseek' | 'groq' | 'mistral' | 'xai'
  providerName: string;
  providerDisplayName: string;
  modelFamily: string;
  envVarName: string;
  apiKey?: string;
  keyMasked: string;
  keyRaw?: string;
  baseUrl?: string;
  organizationId?: string;
  projectId?: string;
  authMethod?: 'api_key' | 'subscription' | 'session_token' | 'local_proxy';
  hasSubscription?: boolean;
  subscriptionTier?: string; // 'ChatGPT Plus' | 'ChatGPT Pro' | 'Claude Pro' | 'Claude Team' | 'Google One AI Premium' | 'DeepSeek Pro' | 'Groq Cloud' | 'Mistral Platform' | 'xAI Grok'
  subscriptionEmail?: string;
  sessionTokenMasked?: string;
  localProxyUrl?: string;
  lastVerifiedAt?: string;
  latencyMs?: number;
  detectedModels?: string[];
  isActive: boolean;
  status: 'active' | 'unconfigured' | 'warning' | 'budget_exceeded' | 'day_limit_exceeded' | 'invalid';
  monthlyBudgetCents: number; // in USD dollars
  monthlyBudgetLimit: number;
  currentMonthlySpendUsd: number;
  currentSpend: number;
  dailyUsageLimitUsd: number;
  dailyUsageLimit: number;
  todaySpendUsd: number;
  todaySpend: number;
  isBudgetOver: boolean;
  isDayUsageOver: boolean;
  alertEmailSent: boolean;
  lastUpdated: string;
  notes?: string;
}

const DEFAULT_ADMIN_KEYS: AdminKeyConfig[] = [
  {
    id: 'key_gemini',
    provider: 'google',
    providerName: 'Google Gemini 3.7 Flash & 3.1 Pro/Lite',
    providerDisplayName: 'Google Gemini',
    modelFamily: 'gemini',
    envVarName: 'GEMINI_API_KEY',
    apiKey: '',
    keyMasked: '',
    hasSubscription: false,
    authMethod: 'api_key',
    isActive: false,
    status: 'unconfigured',
    monthlyBudgetCents: 500,
    monthlyBudgetLimit: 500,
    currentMonthlySpendUsd: 0,
    currentSpend: 0,
    dailyUsageLimitUsd: 50,
    dailyUsageLimit: 50,
    todaySpendUsd: 0,
    todaySpend: 0,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
    notes: 'Google Gemini direct API key or Google One AI Premium subscription.',
  },
  {
    id: 'key_claude',
    provider: 'anthropic',
    providerName: 'Anthropic Claude 3.7 Sonnet & 3.5 Haiku',
    providerDisplayName: 'Anthropic Claude',
    modelFamily: 'claude',
    envVarName: 'ANTHROPIC_API_KEY',
    apiKey: '',
    keyMasked: '',
    hasSubscription: false,
    authMethod: 'api_key',
    isActive: false,
    status: 'unconfigured',
    monthlyBudgetCents: 800,
    monthlyBudgetLimit: 800,
    currentMonthlySpendUsd: 0,
    currentSpend: 0,
    dailyUsageLimitUsd: 60,
    dailyUsageLimit: 60,
    todaySpendUsd: 0,
    todaySpend: 0,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
    notes: 'Direct Anthropic API key or Claude Pro/Team subscription connection.',
  },
  {
    id: 'key_openai',
    provider: 'openai',
    providerName: 'OpenAI GPT-4.5 Orion, GPT-4o & o3-mini',
    providerDisplayName: 'OpenAI',
    modelFamily: 'openai',
    envVarName: 'OPENAI_API_KEY',
    apiKey: '',
    keyMasked: '',
    hasSubscription: false,
    authMethod: 'api_key',
    isActive: false,
    status: 'unconfigured',
    monthlyBudgetCents: 600,
    monthlyBudgetLimit: 600,
    currentMonthlySpendUsd: 0,
    currentSpend: 0,
    dailyUsageLimitUsd: 40,
    dailyUsageLimit: 40,
    todaySpendUsd: 0,
    todaySpend: 0,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
    notes: 'Direct OpenAI API key or ChatGPT Plus/Pro/Team subscription connection.',
  },
  {
    id: 'key_deepseek',
    provider: 'deepseek',
    providerName: 'DeepSeek R1 & V3',
    providerDisplayName: 'DeepSeek',
    modelFamily: 'deepseek',
    envVarName: 'DEEPSEEK_API_KEY',
    apiKey: '',
    keyMasked: '',
    baseUrl: 'https://api.deepseek.com',
    hasSubscription: false,
    authMethod: 'api_key',
    isActive: false,
    status: 'unconfigured',
    monthlyBudgetCents: 300,
    monthlyBudgetLimit: 300,
    currentMonthlySpendUsd: 0,
    currentSpend: 0,
    dailyUsageLimitUsd: 25,
    dailyUsageLimit: 25,
    todaySpendUsd: 0,
    todaySpend: 0,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
    notes: 'Direct DeepSeek API key or DeepSeek Pro connection.',
  },
  {
    id: 'key_groq',
    provider: 'groq',
    providerName: 'Groq Llama-3.3 70B (LPUs)',
    providerDisplayName: 'Groq',
    modelFamily: 'groq',
    envVarName: 'GROQ_API_KEY',
    apiKey: '',
    keyMasked: '',
    baseUrl: 'https://api.groq.com/openai/v1',
    hasSubscription: false,
    authMethod: 'api_key',
    isActive: false,
    status: 'unconfigured',
    monthlyBudgetCents: 200,
    monthlyBudgetLimit: 200,
    currentMonthlySpendUsd: 0,
    currentSpend: 0,
    dailyUsageLimitUsd: 20,
    dailyUsageLimit: 20,
    todaySpendUsd: 0,
    todaySpend: 0,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
    notes: 'High-speed Groq LPU inference for sub-100ms processing.',
  },
  {
    id: 'key_mistral',
    provider: 'mistral',
    providerName: 'Mistral Large 2 & Codestral',
    providerDisplayName: 'Mistral',
    modelFamily: 'mistral',
    envVarName: 'MISTRAL_API_KEY',
    apiKey: '',
    keyMasked: '',
    baseUrl: 'https://api.mistral.ai/v1',
    hasSubscription: false,
    authMethod: 'api_key',
    isActive: false,
    status: 'unconfigured',
    monthlyBudgetCents: 250,
    monthlyBudgetLimit: 250,
    currentMonthlySpendUsd: 0,
    currentSpend: 0,
    dailyUsageLimitUsd: 20,
    dailyUsageLimit: 20,
    todaySpendUsd: 0,
    todaySpend: 0,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
    notes: 'Mistral AI Platform API key connection.',
  },
  {
    id: 'key_xai',
    provider: 'xai',
    providerName: 'xAI Grok 3 & Grok 2',
    providerDisplayName: 'xAI Grok',
    modelFamily: 'grok',
    envVarName: 'XAI_API_KEY',
    apiKey: '',
    keyMasked: '',
    baseUrl: 'https://api.x.ai/v1',
    hasSubscription: false,
    authMethod: 'api_key',
    isActive: false,
    status: 'unconfigured',
    monthlyBudgetCents: 350,
    monthlyBudgetLimit: 350,
    currentMonthlySpendUsd: 0,
    currentSpend: 0,
    dailyUsageLimitUsd: 30,
    dailyUsageLimit: 30,
    todaySpendUsd: 0,
    todaySpend: 0,
    isBudgetOver: false,
    isDayUsageOver: false,
    alertEmailSent: false,
    lastUpdated: new Date().toISOString(),
    notes: 'Direct xAI Grok API key or SuperGrok subscription connection.',
  }
];

export async function saveAdminKeyConfigToFirestore(config: AdminKeyConfig): Promise<void> {
  const monthlyLimit = config.monthlyBudgetLimit ?? config.monthlyBudgetCents ?? 500;
  const currentSpend = config.currentSpend ?? config.currentMonthlySpendUsd ?? 0;
  const dailyLimit = config.dailyUsageLimit ?? config.dailyUsageLimitUsd ?? 50;
  const todaySpend = config.todaySpend ?? config.todaySpendUsd ?? 0;

  // Recompute budget and day usage flags
  const isBudgetOver = monthlyLimit > 0 && currentSpend >= monthlyLimit;
  const isDayUsageOver = dailyLimit > 0 && todaySpend >= dailyLimit;
  
  const hasKey = Boolean(config.apiKey && config.apiKey.trim().length > 0);
  const hasSub = Boolean(config.hasSubscription && (config.subscriptionTier || config.sessionTokenMasked || config.subscriptionEmail));
  const isConfigured = hasKey || hasSub;

  let status = config.status;
  let isActive = Boolean(config.isActive);
  if (!isConfigured) {
    status = 'unconfigured';
    isActive = false;
  } else if (isBudgetOver) {
    status = 'budget_exceeded';
  } else if (isDayUsageOver) {
    status = 'day_limit_exceeded';
  } else if (isActive) {
    status = 'active';
  } else {
    status = 'unconfigured';
  }

  const payload: AdminKeyConfig = {
    ...config,
    apiKey: config.apiKey?.trim() || '',
    hasSubscription: hasSub,
    isActive,
    monthlyBudgetCents: monthlyLimit,
    monthlyBudgetLimit: monthlyLimit,
    currentMonthlySpendUsd: currentSpend,
    currentSpend: currentSpend,
    dailyUsageLimitUsd: dailyLimit,
    dailyUsageLimit: dailyLimit,
    todaySpendUsd: todaySpend,
    todaySpend: todaySpend,
    isBudgetOver,
    isDayUsageOver,
    status,
    lastUpdated: new Date().toISOString(),
  };

  safeStorageSet(`whyor_adminkey_${config.id}`, payload);
  try {
    const docRef = doc(db, 'admin_ai_keys', config.id);
    await setDoc(docRef, payload, { merge: true });
  } catch (err: any) {
    console.warn('Firestore admin key write notice (cached locally):', err.message);
  }
}

export async function loadAdminKeyConfigsFromFirestore(): Promise<AdminKeyConfig[]> {
  try {
    const snap = await getDocs(collection(db, 'admin_ai_keys'));
    if (!snap.empty) {
      const configs: AdminKeyConfig[] = [];
      snap.forEach((d) => {
        const data = d.data() as AdminKeyConfig;
        const monthlyLimit = data.monthlyBudgetLimit ?? data.monthlyBudgetCents ?? 500;
        const currentSpend = data.currentSpend ?? data.currentMonthlySpendUsd ?? 0;
        const dailyLimit = data.dailyUsageLimit ?? data.dailyUsageLimitUsd ?? 50;
        const todaySpend = data.todaySpend ?? data.todaySpendUsd ?? 0;

        const isBudgetOver = monthlyLimit > 0 && currentSpend >= monthlyLimit;
        const isDayUsageOver = dailyLimit > 0 && todaySpend >= dailyLimit;
        
        const hasKey = Boolean(data.apiKey && data.apiKey.trim().length > 0);
        const hasSub = Boolean(data.hasSubscription && (data.subscriptionTier || data.sessionTokenMasked || data.subscriptionEmail));
        const isConfigured = hasKey || hasSub;

        let status = data.status;
        let isActive = Boolean(data.isActive);
        if (!isConfigured) {
          status = 'unconfigured';
          isActive = false;
        } else if (isBudgetOver) {
          status = 'budget_exceeded';
        } else if (isDayUsageOver) {
          status = 'day_limit_exceeded';
        } else {
          status = 'active';
          isActive = true;
        }

        configs.push({
          ...data,
          apiKey: data.apiKey?.trim() || '',
          hasSubscription: hasSub,
          isActive,
          status,
          providerName: data.providerName || data.providerDisplayName || data.provider,
          modelFamily: data.modelFamily || data.provider,
          monthlyBudgetLimit: monthlyLimit,
          monthlyBudgetCents: monthlyLimit,
          currentSpend: currentSpend,
          currentMonthlySpendUsd: currentSpend,
          dailyUsageLimit: dailyLimit,
          dailyUsageLimitUsd: dailyLimit,
          todaySpend: todaySpend,
          todaySpendUsd: todaySpend,
          isBudgetOver,
          isDayUsageOver,
        });
      });
      
      // Ensure all default providers exist if missing from Firestore
      const loadedMap = new Map(configs.map(c => [c.id, c]));
      for (const def of DEFAULT_ADMIN_KEYS) {
        if (!loadedMap.has(def.id)) {
          const cached = safeStorageGet<AdminKeyConfig | null>(`whyor_adminkey_${def.id}`, null);
          configs.push(cached || { ...def, status: 'unconfigured', isActive: false, apiKey: '', hasSubscription: false });
        }
      }

      return configs;
    }
  } catch (err: any) {
    console.warn('Firestore admin keys load notice (using cache):', err.message);
  }

  const mergedConfigs = DEFAULT_ADMIN_KEYS.map((def) => {
    const cached = safeStorageGet<AdminKeyConfig | null>(`whyor_adminkey_${def.id}`, null);
    return cached || def;
  });
  return mergedConfigs;
}

export async function savePaymentInvoiceToFirestore(invoice: any): Promise<void> {
  const docRef = doc(db, 'billing_invoices', invoice.id);
  await setDoc(docRef, invoice, { merge: true });
}

export async function loadPaymentInvoicesFromFirestore(): Promise<any[]> {
  const q = query(collection(db, 'billing_invoices'), orderBy('createdAt', 'desc'), limit(50));
  const snap = await getDocs(q);
  const invoices: any[] = [];
  snap.forEach((d) => invoices.push(d.data()));
  return invoices;
}
