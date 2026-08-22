import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  MailCheck,
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  Database, 
  Lock, 
  Key, 
  Globe, 
  Sparkles, 
  Zap, 
  Cpu, 
  UserCheck, 
  LogOut, 
  LogIn, 
  FileText, 
  Activity, 
  ExternalLink,
  Sliders,
  Radio,
  Check,
  Clock,
  Eye,
  EyeOff,
  Building2,
  Users,
  UserPlus,
  Layers,
  Palette,
  FileCode2
} from 'lucide-react';
import { 
  auth, 
  signInWithGoogle, 
  signOutUser, 
  onAuthChanged, 
  saveSmtpSettingsToFirestore, 
  loadSmtpSettingsFromFirestore,
  logEmailToFirestore,
  loadEmailLogsFromFirestore,
  recordAuditLogToFirestore,
  loadAuditLogsFromFirestore,
  formatFirebaseAuthError,
  SmtpConfigFirestore
} from '../lib/firebase';
import { User } from 'firebase/auth';
import { CompanyTeamOnboarding } from './CompanyTeamOnboarding';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import SelfHostAnalysisPanel from './SelfHostAnalysisPanel';
import { AdminAnalyticsDashboard } from './admin/AdminAnalyticsDashboard';
import { AdminKeysAndBudgetsPortal } from './admin/AdminKeysAndBudgetsPortal';
import { AdminSubscriptionsTrialsPortal } from './admin/AdminSubscriptionsTrialsPortal';
import { AdminContactInquiriesPortal } from './admin/AdminContactInquiriesPortal';
import { AdminCustomersPortal } from './admin/AdminCustomersPortal';
import { AdminPrivilegesPortal } from './admin/AdminPrivilegesPortal';
import { AdminPlatformConfigPortal } from './admin/AdminPlatformConfigPortal';
import { BarChart3, KeyRound } from 'lucide-react';

interface AdminConsoleProps {
  onNavigateTab: (tab: string) => void;
  persistenceMode: 'firestore_cloud' | 'local_transient';
  onTogglePersistenceMode: (mode: 'firestore_cloud' | 'local_transient') => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  onNavigateTab,
  persistenceMode,
  onTogglePersistenceMode,
}) => {
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'customers' | 'onboarding' | 'admin_privileges' | 'ai_keys' | 'smtp' | 'templates' | 'platform_config' | 'subscriptions' | 'inquiries' | 'auth' | 'firestore' | 'context_policy' | 'self_host' | 'audit'
  >('analytics');
  
  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // SMTP Settings State
  const [smtpHost, setSmtpHost] = useState<string>('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpSecure, setSmtpSecure] = useState<boolean>(false);
  const [smtpRequireTls, setSmtpRequireTls] = useState<boolean>(true);
  const [smtpUser, setSmtpUser] = useState<string>('solarastra.in@gmail.com');
  const [smtpPass, setSmtpPass] = useState<string>('');
  const [smtpFromEmail, setSmtpFromEmail] = useState<string>('solarastra.in@gmail.com');
  const [smtpFromName, setSmtpFromName] = useState<string>('WhyOr Dispatch AI Enterprise');
  const [smtpReplyTo, setSmtpReplyTo] = useState<string>('solarastra.in@gmail.com');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [hasStoredPassword, setHasStoredPassword] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null);

  // Test Email State
  const [testRecipient, setTestRecipient] = useState<string>('solarastra.in@gmail.com');
  const [testSubject, setTestSubject] = useState<string>('[WhyOr Dispatch AI] Live SMTP Test Verification');
  const [testTemplate, setTestTemplate] = useState<string>('test_verification');
  const [testCustomMessage, setTestCustomMessage] = useState<string>('WhyOr Dispatch AI Enterprise SMTP handshaking & email relay verified successfully.');
  
  // Status & Logs
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [isSendingTrial, setIsSendingTrial] = useState<boolean>(false);
  const [trialValidationResult, setTrialValidationResult] = useState<{
    success: boolean;
    recipient: string;
    durationMs?: number;
    messageId?: string;
    error?: string;
    verifiedAt?: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [firestoreStats, setFirestoreStats] = useState({
    credentials: 7,
    smtpConfig: 1,
    emailLogs: 12,
    dispatchLedger: 84,
    contextSessions: 18,
    status: 'Connected & Live'
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthChanged((user) => {
      setCurrentUser(user);
      if (user?.email) {
        setTestRecipient(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch initial SMTP settings & logs from server & Firestore
  useEffect(() => {
    fetchSmtpSettings();
    fetchEmailLogs();
    fetchAuditLogs();
  }, []);

  const fetchSmtpSettings = async () => {
    try {
      // First try Firestore
      const cloudSmtp = await loadSmtpSettingsFromFirestore();
      if (cloudSmtp) {
        setSmtpHost(cloudSmtp.host || 'smtp.gmail.com');
        setSmtpPort(cloudSmtp.port || 587);
        setSmtpSecure(!!cloudSmtp.secure);
        setSmtpRequireTls(cloudSmtp.requireTls ?? true);
        setSmtpUser(cloudSmtp.user || 'solarastra.in@gmail.com');
        setSmtpFromEmail(cloudSmtp.fromEmail || 'solarastra.in@gmail.com');
        setSmtpFromName(cloudSmtp.fromName || 'WhyOr Dispatch AI Enterprise');
        setSmtpReplyTo(cloudSmtp.replyTo || 'solarastra.in@gmail.com');
        setIsVerified(!!cloudSmtp.isVerified);
        setLastVerifiedAt(cloudSmtp.lastVerifiedAt || null);
        if (cloudSmtp.passMasked) {
          setHasStoredPassword(true);
        }
      }

      // Also sync from server endpoint
      const res = await fetch('/api/admin/smtp');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.settings) {
          const s = data.settings;
          if (!cloudSmtp) {
            setSmtpHost(s.host || 'smtp.gmail.com');
            setSmtpPort(s.port || 587);
            setSmtpSecure(s.secure || false);
            setSmtpRequireTls(s.requireTls ?? true);
            setSmtpUser(s.user || 'solarastra.in@gmail.com');
            setSmtpFromEmail(s.fromEmail || 'solarastra.in@gmail.com');
            setSmtpFromName(s.fromName || 'WhyOr Dispatch AI Enterprise');
            setSmtpReplyTo(s.replyTo || 'solarastra.in@gmail.com');
          }
          setIsVerified(s.isVerified);
          setLastVerifiedAt(s.lastVerifiedAt);
          setHasStoredPassword(s.hasPassword);
        }
      }
    } catch (err) {
      console.warn('Using local fallback for SMTP settings');
    }
  };

  const fetchEmailLogs = async () => {
    try {
      const res = await fetch('/api/admin/smtp/logs');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setEmailLogs(data.logs);
          return;
        }
      }
      const cloudLogs = await loadEmailLogsFromFirestore(25);
      if (cloudLogs.length > 0) setEmailLogs(cloudLogs);
    } catch (err) {
      const cloudLogs = await loadEmailLogsFromFirestore(25);
      if (cloudLogs.length > 0) setEmailLogs(cloudLogs);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const cloudAudits = await loadAuditLogsFromFirestore(50);
      setAuditLogs(cloudAudits);
    } catch (err) {
      console.warn('Error loading audit logs');
      setAuditLogs([]);
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthNotice(null);
    try {
      const { user } = await signInWithGoogle();
      setCurrentUser(user);
      setTestRecipient(user.email || 'solarastra.in@gmail.com');
      setAuthNotice(`Authenticated successfully as ${user.displayName || user.email} (SuperAdmin). Profile synced to Firestore.`);
      await recordAuditLogToFirestore('Google Login', 'security', user.email || 'Admin', 'Logged into Admin Console via Google OAuth');
    } catch (err: any) {
      const friendlyMsg = formatFirebaseAuthError(err);
      if (friendlyMsg) {
        setAuthNotice(`Google Sign-In: ${friendlyMsg}`);
      } else {
        setAuthNotice(null);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Sign-Out Handler
  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setAuthNotice('Signed out from Google Auth session.');
  };

  // Quick Preset Handlers
  const applyPreset = (preset: 'gmail' | 'sendgrid' | 'mailgun' | 'ses') => {
    if (preset === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort(587);
      setSmtpSecure(false);
      setSmtpRequireTls(true);
      setSmtpFromEmail(currentUser?.email || 'solarastra.in@gmail.com');
      setSmtpUser(currentUser?.email || 'solarastra.in@gmail.com');
    } else if (preset === 'sendgrid') {
      setSmtpHost('smtp.sendgrid.net');
      setSmtpPort(587);
      setSmtpSecure(false);
      setSmtpRequireTls(true);
      setSmtpUser('apikey');
      setSmtpFromEmail('alerts@whyor.in');
    } else if (preset === 'mailgun') {
      setSmtpHost('smtp.mailgun.org');
      setSmtpPort(587);
      setSmtpSecure(false);
      setSmtpRequireTls(true);
      setSmtpUser('postmaster@sandbox.mailgun.org');
      setSmtpFromEmail('postmaster@sandbox.mailgun.org');
    } else if (preset === 'ses') {
      setSmtpHost('email-smtp.us-east-1.amazonaws.com');
      setSmtpPort(587);
      setSmtpSecure(false);
      setSmtpRequireTls(true);
      setSmtpFromEmail('system@whyor.in');
    }
    setStatusMessage({ type: 'info', text: `Applied ${preset.toUpperCase()} server preset. Enter your credentials and verify connection.` });
  };

  // Save SMTP Settings Handler
  const handleSaveSmtp = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    const payload = {
      host: smtpHost.trim(),
      port: Number(smtpPort),
      secure: smtpSecure,
      requireTls: smtpRequireTls,
      user: smtpUser.trim(),
      pass: smtpPass.trim() || (hasStoredPassword ? '••••••••••••••••' : ''),
      fromEmail: smtpFromEmail.trim(),
      fromName: smtpFromName.trim(),
      replyTo: smtpReplyTo.trim(),
      isVerified,
      lastVerifiedAt: lastVerifiedAt || undefined,
    };

    try {
      // 1. Save to Server
      const res = await fetch('/api/admin/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      // 2. Persist to Firestore Cloud Database
      await saveSmtpSettingsToFirestore({
        host: payload.host,
        port: payload.port,
        secure: payload.secure,
        requireTls: payload.requireTls,
        user: payload.user,
        passMasked: payload.pass ? '••••••••••••••••' : undefined,
        fromEmail: payload.fromEmail,
        fromName: payload.fromName,
        replyTo: payload.replyTo,
        isVerified,
        lastVerifiedAt: lastVerifiedAt || undefined,
      });

      // 3. Audit log
      await recordAuditLogToFirestore(
        'Update SMTP Config',
        'smtp',
        currentUser?.email || smtpUser || 'Admin',
        `Updated SMTP host to ${payload.host}:${payload.port} for sender ${payload.fromEmail}`
      );

      setHasStoredPassword(true);
      setStatusMessage({ type: 'success', text: 'SMTP server settings saved to Firestore and Server Vault.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to save SMTP settings: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  // Safe JSON API fetch utility to prevent JSON parse crashes on HTML error responses
  const safeFetchJson = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const data = await res.json();
        return { ok: res.ok, status: res.status, data };
      } catch (err: any) {
        // Fall through to text
      }
    }
    const rawText = await res.text().catch(() => '');
    const cleanSnippet = rawText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
    return {
      ok: false,
      status: res.status,
      data: {
        success: false,
        error: cleanSnippet || `HTTP ${res.status} ${res.statusText || 'Server Error'}`,
        recommendation: res.status === 504 || res.status === 502
          ? 'The mail server took too long to respond. Try switching to Port 465 (SSL) or verify your App Password.'
          : 'Please check your SMTP host, port, and authentication credentials.',
      },
    };
  };

  // Verify Handshake Handler
  const handleVerifySmtp = async () => {
    setIsVerifying(true);
    setStatusMessage(null);

    try {
      const { ok, data } = await safeFetchJson('/api/admin/smtp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost.trim(),
          port: Number(smtpPort),
          secure: smtpSecure,
          requireTls: smtpRequireTls,
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
        }),
      });

      if (ok && data?.success) {
        setIsVerified(true);
        setLastVerifiedAt(data.verifiedAt || new Date().toISOString());
        setStatusMessage({
          type: 'success',
          text: `SMTP Handshake Verified: ${data.message || 'Host responded with 250 TLS confirmation'} (${data.latencyMs}ms)`,
        });

        // Save verification state to Firestore
        await saveSmtpSettingsToFirestore({
          isVerified: true,
          lastVerifiedAt: data.verifiedAt || new Date().toISOString(),
        });

        await recordAuditLogToFirestore(
          'SMTP Handshake Verified',
          'smtp',
          currentUser?.email || smtpUser || 'Admin',
          `Verified TLS socket handshake to ${smtpHost}:${smtpPort} in ${data.latencyMs}ms`
        );
      } else {
        setIsVerified(false);
        setStatusMessage({
          type: 'error',
          text: `Verification Failed: ${data?.error || 'Connection refused or credentials rejected'}. ${data?.recommendation || ''}`,
        });
      }
    } catch (err: any) {
      setIsVerified(false);
      setStatusMessage({ type: 'error', text: `SMTP Verification Error: ${err.message}` });
    } finally {
      setIsVerifying(false);
    }
  };

  // Send Trial Email to SuperAdmin (Validate SMTP before saving to Firestore)
  const handleSendTrialEmailToSuperAdmin = async () => {
    const superAdminEmail = currentUser?.email || 'solarastra.in@gmail.com';
    setIsSendingTrial(true);
    setStatusMessage(null);
    setTrialValidationResult(null);

    if (!smtpHost.trim()) {
      setStatusMessage({ type: 'error', text: 'Please specify an SMTP Host (e.g. smtp.gmail.com) before sending a trial email.' });
      setIsSendingTrial(false);
      return;
    }

    if (!smtpUser.trim()) {
      setStatusMessage({ type: 'error', text: 'Please specify the SMTP Username (e.g. your Gmail address).' });
      setIsSendingTrial(false);
      return;
    }

    try {
      const payload = {
        to: superAdminEmail,
        subject: `[WhyOr Dispatch AI] SuperAdmin SMTP Validation Trial Email (${new Date().toLocaleTimeString()})`,
        templateType: 'test_verification',
        customMessage: `Real-time trial verification email to validate SMTP server host (${smtpHost.trim()}:${smtpPort}) for SuperAdmin (${superAdminEmail}) prior to saving to Firestore.`,
        sentBy: `SuperAdmin (${superAdminEmail})`,
        host: smtpHost.trim(),
        port: Number(smtpPort),
        secure: smtpSecure,
        requireTls: smtpRequireTls,
        user: smtpUser.trim(),
        pass: smtpPass.trim() || (hasStoredPassword ? '••••••••••••••••' : ''),
        fromEmail: smtpFromEmail.trim() || superAdminEmail,
        fromName: smtpFromName.trim() || 'WhyOr Dispatch AI Enterprise',
        replyTo: smtpReplyTo.trim() || superAdminEmail,
      };

      const { ok, data } = await safeFetchJson('/api/admin/smtp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (ok && data?.success) {
        setIsVerified(true);
        const verifiedTime = new Date().toISOString();
        setLastVerifiedAt(verifiedTime);
        setTrialValidationResult({
          success: true,
          recipient: superAdminEmail,
          durationMs: data.durationMs,
          messageId: data.messageId,
          verifiedAt: verifiedTime,
        });

        setStatusMessage({
          type: 'success',
          text: `Trial email delivered to SuperAdmin (${superAdminEmail}) in ${data.durationMs}ms (Message-ID: ${data.messageId}). SMTP configuration is validated! You can now safely save it to Firestore.`,
        });

        if (data.log) {
          await logEmailToFirestore({
            to: superAdminEmail,
            from: `${smtpFromName || 'WhyOr Dispatch AI Enterprise'} <${smtpFromEmail || superAdminEmail}>`,
            subject: payload.subject,
            emailType: 'test_verification',
            status: 'sent',
            messageId: data.messageId,
            sentBy: superAdminEmail,
          });
        }

        await recordAuditLogToFirestore(
          'SuperAdmin Trial Email Validated',
          'smtp',
          superAdminEmail,
          `Dispatched pre-save trial email to ${superAdminEmail} via ${smtpHost}:${smtpPort} (Latency: ${data.durationMs}ms)`
        );

        fetchEmailLogs();
      } else {
        setIsVerified(false);
        const errMsg = data?.error || 'Connection failed or credentials rejected';
        const recMsg = data?.recommendation || 'Please verify host, port, username, and password/App Password.';
        setTrialValidationResult({
          success: false,
          recipient: superAdminEmail,
          error: `${errMsg}${recMsg ? ` — ${recMsg}` : ''}`,
        });
        setStatusMessage({
          type: 'error',
          text: `Trial Email Failed: ${errMsg}. ${recMsg}`,
        });
      }
    } catch (err: any) {
      setIsVerified(false);
      setTrialValidationResult({
        success: false,
        recipient: superAdminEmail,
        error: err.message,
      });
      setStatusMessage({ type: 'error', text: `Trial Email Error: ${err.message}` });
    } finally {
      setIsSendingTrial(false);
    }
  };

  // Send Test Email Handler
  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    setStatusMessage(null);

    try {
      const { ok, data } = await safeFetchJson('/api/admin/smtp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testRecipient.trim(),
          subject: testSubject.trim(),
          templateType: testTemplate,
          customMessage: testCustomMessage.trim(),
          sentBy: currentUser?.email || 'Admin Superuser',
          host: smtpHost.trim(),
          port: Number(smtpPort),
          secure: smtpSecure,
          requireTls: smtpRequireTls,
          user: smtpUser.trim(),
          pass: smtpPass.trim() || (hasStoredPassword ? '••••••••••••••••' : ''),
          fromEmail: smtpFromEmail.trim(),
          fromName: smtpFromName.trim(),
          replyTo: smtpReplyTo.trim(),
        }),
      });

      if (ok && data?.success) {
        setStatusMessage({
          type: 'success',
          text: `Email dispatched to ${testRecipient}! Message-ID: ${data.messageId} (${data.durationMs}ms)`,
        });

        // Log to Firestore
        if (data.log) {
          await logEmailToFirestore({
            to: testRecipient,
            from: `${smtpFromName} <${smtpFromEmail}>`,
            subject: testSubject,
            emailType: testTemplate,
            status: 'sent',
            messageId: data.messageId,
            sentBy: currentUser?.email || 'Admin',
          });
        }

        await recordAuditLogToFirestore(
          'Sent Test Email',
          'smtp',
          currentUser?.email || 'Admin',
          `Dispatched test email to ${testRecipient} with Message-ID ${data.messageId}`
        );

        fetchEmailLogs();
      } else {
        setStatusMessage({
          type: 'error',
          text: `Failed to send email: ${data?.error || 'Unknown error'}. ${data?.recommendation || ''}`,
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to send test email: ${err.message}` });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-display font-bold text-white tracking-tight">
                  Admin Console & Governance
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 uppercase tracking-wider">
                  Enterprise Master
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                SMTP Email Service Dispatch • Firebase Google Auth • Firestore Persistence Engine • Security Audit Trail
              </p>
            </div>
          </div>

          {/* Google Auth Status Card */}
          <div className="flex items-center gap-3 bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'Admin'} 
                    className="w-8 h-8 rounded-full border border-purple-400/50"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300 font-bold text-xs">
                    {currentUser.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>{currentUser.displayName || 'Google SuperAdmin'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[10px] font-mono text-purple-300">
                    {currentUser.email}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
                  title="Sign Out Google Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md transition-all cursor-pointer"
              >
                {isAuthLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Persistence Status Pill */}
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Persistence Engine:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono font-medium text-[11px]">
              <Database className="w-3 h-3 text-emerald-400" />
              Firebase Firestore Active (Cloud)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Context Persistence Mode:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-medium border ${
              persistenceMode === 'firestore_cloud'
                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-400/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-400/30'
            }`}>
              {persistenceMode === 'firestore_cloud' ? 'Firestore Cloud (Default)' : 'Local Scratchpad Only (Transient)'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-orange-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'customers'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-400" />
          <span>Onboarded Customers</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            Tenant Hub
          </span>
        </button>

        <button
          onClick={() => setActiveTab('onboarding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'onboarding'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-400" />
          <span>Onboard Companies & Teams</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/30 uppercase">
            Wizard
          </span>
        </button>

        <button
          onClick={() => setActiveTab('admin_privileges')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'admin_privileges'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-pink-400" />
          <span>Admins & Privileges</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-pink-500/20 text-pink-300 border border-pink-400/30 uppercase">
            RBAC
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ai_keys')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ai_keys'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>AI Engine Keys & Budgets (BYOK)</span>
        </button>

        <button
          onClick={() => setActiveTab('smtp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'smtp'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>SMTP Email Settings</span>
          {isVerified && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <FileCode2 className="w-4 h-4 text-indigo-400" />
          <span>Email & Alert Templates</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            HTML/Text
          </span>
        </button>

        <button
          onClick={() => setActiveTab('platform_config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'platform_config'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Portal Global Config</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase">
            Policies
          </span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Subscriptions & 7-Day Trials</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'inquiries'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Contact Us Inquiries</span>
        </button>

        <button
          onClick={() => setActiveTab('auth')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'auth'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Google Auth & Access Control</span>
        </button>

        <button
          onClick={() => setActiveTab('firestore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'firestore'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Firestore Storage Health</span>
        </button>

        <button
          onClick={() => setActiveTab('context_policy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'context_policy'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Context Storage Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('self_host')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'self_host'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-orange-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Cpu className="w-4 h-4 text-amber-400" />
          <span>Self-Host Viability (GPU ROI)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase">
            ROI Analytics
          </span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* Status Notice Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs animate-fadeIn ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300' 
            : statusMessage.type === 'error'
            ? 'bg-rose-950/50 border-rose-800/60 text-rose-300'
            : 'bg-indigo-950/50 border-indigo-800/60 text-indigo-300'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-200 text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ==================== TAB: ANALYTICS DASHBOARD ==================== */}
      {activeTab === 'analytics' && (
        <AdminAnalyticsDashboard onNavigateTab={setActiveTab} />
      )}

      {/* ==================== TAB: ONBOARDED CUSTOMERS ==================== */}
      {activeTab === 'customers' && (
        <AdminCustomersPortal onNavigateTab={setActiveTab} />
      )}

      {/* ==================== TAB: ADMINS & PRIVILEGES (RBAC) ==================== */}
      {activeTab === 'admin_privileges' && (
        <AdminPrivilegesPortal />
      )}

      {/* ==================== TAB: PORTAL GLOBAL CONFIG ==================== */}
      {activeTab === 'platform_config' && (
        <AdminPlatformConfigPortal />
      )}

      {/* ==================== TAB: AI KEYS & BUDGETS PORTAL ==================== */}
      {activeTab === 'ai_keys' && (
        <AdminKeysAndBudgetsPortal onNotifyStatus={(msg) => setStatusMessage(msg)} />
      )}

      {/* ==================== TAB: SUBSCRIPTIONS & 7-DAY TRIALS ==================== */}
      {activeTab === 'subscriptions' && (
        <AdminSubscriptionsTrialsPortal onNotifyStatus={(msg) => setStatusMessage(msg)} />
      )}

      {/* ==================== TAB: CONTACT US INQUIRIES ==================== */}
      {activeTab === 'inquiries' && (
        <AdminContactInquiriesPortal onNotifyStatus={(msg) => setStatusMessage(msg)} />
      )}

      {/* ==================== TAB 1: SMTP EMAIL SETTINGS ==================== */}
      {activeTab === 'smtp' && (
        <div className="space-y-6">
          {/* Email Template Quick Switch Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-900/60 border border-indigo-500/20 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Customizable Alert & Notification Templates</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Live HTML / Plaintext Editor
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  SuperAdmin can customize HTML bodies, variables, and brand typography for billing alerts, failover notices, and trial validations.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('templates')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all shrink-0 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Open Template Editor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main SMTP Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    SMTP Email Server Configuration
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure outbound email credentials for dispatch alerts, ledger audits, and quota threshold notifications.
                  </p>
                </div>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/30 text-xs font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Handshake Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-400/30 text-xs font-mono">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    Pending Verification
                  </span>
                )}
              </div>

              {/* Server Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Quick Provider Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('gmail')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 hover:border-indigo-500/40 text-xs text-slate-200 text-left transition-all cursor-pointer flex flex-col gap-0.5"
                  >
                    <span className="font-semibold text-indigo-300">Google / Gmail</span>
                    <span className="text-[10px] text-slate-400">smtp.gmail.com:587</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('sendgrid')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 hover:border-indigo-500/40 text-xs text-slate-200 text-left transition-all cursor-pointer flex flex-col gap-0.5"
                  >
                    <span className="font-semibold text-indigo-300">SendGrid</span>
                    <span className="text-[10px] text-slate-400">smtp.sendgrid.net</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('mailgun')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 hover:border-indigo-500/40 text-xs text-slate-200 text-left transition-all cursor-pointer flex flex-col gap-0.5"
                  >
                    <span className="font-semibold text-indigo-300">Mailgun</span>
                    <span className="text-[10px] text-slate-400">smtp.mailgun.org</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('ses')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 hover:border-indigo-500/40 text-xs text-slate-200 text-left transition-all cursor-pointer flex flex-col gap-0.5"
                  >
                    <span className="font-semibold text-indigo-300">Amazon SES</span>
                    <span className="text-[10px] text-slate-400">email-smtp.us-east-1</span>
                  </button>
                </div>
              </div>

              {/* Host & Port */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    SMTP Host Address
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="e.g. smtp.gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Encryption Options */}
              <div className="flex flex-wrap items-center gap-6 p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>SSL / TLS Direct (Port 465)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={smtpRequireTls}
                    onChange={(e) => setSmtpRequireTls(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>STARTTLS Mandatory (Port 587)</span>
                </label>
              </div>

              {/* Auth Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Username / Account Email
                  </label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="e.g. solarastra.in@gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Password / App Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder={hasStoredPassword ? '••••••••••••••••' : 'Enter SMTP password or 16-char App Password'}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    For Gmail, use a 16-character <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Google App Password</a> with 2FA enabled.
                  </p>
                </div>
              </div>

              {/* Sender Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    From Email Address
                  </label>
                  <input
                    type="email"
                    value={smtpFromEmail}
                    onChange={(e) => setSmtpFromEmail(e.target.value)}
                    placeholder="solarastra.in@gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={smtpFromName}
                    onChange={(e) => setSmtpFromName(e.target.value)}
                    placeholder="WhyOr Dispatch AI"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Reply-To Address
                  </label>
                  <input
                    type="email"
                    value={smtpReplyTo}
                    onChange={(e) => setSmtpReplyTo(e.target.value)}
                    placeholder="solarastra.in@gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pre-Save Trial Validation Status Box */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MailCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        SuperAdmin Pre-Save Trial Validation
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Dispatch a trial email to <span className="font-mono text-purple-300 font-semibold">{currentUser?.email || 'solarastra.in@gmail.com'}</span> to validate uncommitted SMTP settings before persisting to Firestore.
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono shrink-0 uppercase font-semibold border ${
                    isVerified
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    {isVerified ? 'Validated & Ready' : 'Pending Pre-Save Test'}
                  </span>
                </div>

                {trialValidationResult && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                    trialValidationResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                  }`}>
                    {trialValidationResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="font-semibold text-xs flex items-center justify-between gap-2">
                        <span>
                          {trialValidationResult.success
                            ? `Trial Email Delivered to ${trialValidationResult.recipient} (${trialValidationResult.durationMs}ms)`
                            : `Trial Email Delivery Failed to ${trialValidationResult.recipient}`}
                        </span>
                        {trialValidationResult.success && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            Ready to Save
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 leading-relaxed break-words">
                        {trialValidationResult.success
                          ? `Message-ID: ${trialValidationResult.messageId} • Host socket handshake confirmed on ${smtpHost}:${smtpPort}`
                          : trialValidationResult.error}
                      </div>
                      {!trialValidationResult.success && trialValidationResult.error?.includes('BadCredentials') && (
                        <div className="text-[11px] bg-rose-900/30 border border-rose-500/20 rounded-lg p-2 mt-2 text-rose-300">
                          <strong>💡 Gmail Tip:</strong> Use a 16-character App Password from{' '}
                          <a
                            href="https://myaccount.google.com/apppasswords"
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-indigo-300 hover:text-indigo-200 font-semibold"
                          >
                            myaccount.google.com/apppasswords
                          </a>{' '}
                          instead of your account password.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    id="btn-verify-smtp-handshake"
                    onClick={handleVerifySmtp}
                    disabled={isVerifying || isSendingTrial}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{isVerifying ? 'Testing Socket...' : 'Verify Handshake'}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-send-trial-email"
                    onClick={handleSendTrialEmailToSuperAdmin}
                    disabled={isSendingTrial || isVerifying || isSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSendingTrial ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isSendingTrial ? 'Sending Trial Email...' : `Send Trial Email to ${currentUser?.email || 'solarastra.in@gmail.com'}`}</span>
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-save-smtp-firestore"
                  onClick={handleSaveSmtp}
                  disabled={isSaving || isSendingTrial}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-lg transition-all cursor-pointer disabled:opacity-50 ${
                    isVerified
                      ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 ring-1 ring-emerald-400/40'
                      : 'bg-indigo-600/90 hover:bg-indigo-500 shadow-indigo-600/20'
                  }`}
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Configuration to Firestore</span>
                </button>
              </div>
            </div>
          </div>

          {/* Test Email Dispatcher & Live Log */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Dispatch Tool */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-400" />
                    Live Test Email Dispatcher
                  </h3>
                  <p className="text-xs text-slate-400">
                    Send a real-time test notification to verify end-to-end deliverability.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTestRecipient(currentUser?.email || 'solarastra.in@gmail.com')}
                  className="text-[10px] text-purple-300 hover:text-purple-200 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 px-2 py-1 rounded-lg font-mono transition-colors"
                >
                  Fill SuperAdmin
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="solarastra.in@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notification Template
                </label>
                <select
                  value={testTemplate}
                  onChange={(e) => {
                    setTestTemplate(e.target.value);
                    if (e.target.value === 'test_verification') {
                      setTestSubject('[WhyOr Dispatch AI] Live SMTP Test Verification');
                    } else if (e.target.value === 'quota_alert') {
                      setTestSubject('⚠️ [WhyOr Quota Alert] Provider Monthly Budget Threshold Reached');
                    } else if (e.target.value === 'failover_alert') {
                      setTestSubject('🚨 [WhyOr Dispatch] Autonomous Routing Failover Triggered');
                    } else {
                      setTestSubject('🔒 [WhyOr Audit] Company Security Vault Update Notification');
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="test_verification">Standard SMTP Handshake Test</option>
                  <option value="quota_alert">Monthly Spend Quota Alert Template</option>
                  <option value="failover_alert">Autonomous Dispatch Failover Event</option>
                  <option value="security_audit">Company Security Vault Audit Report</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Dispatch Message
                </label>
                <textarea
                  rows={2}
                  value={testCustomMessage}
                  onChange={(e) => setTestCustomMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSendingTest ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isSendingTest ? 'Dispatched via SMTP...' : 'Send Live Test Email'}</span>
              </button>
            </div>

            {/* Email Dispatch History Log */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Outbound Dispatch Logs ({emailLogs.length})
                </h4>
                <button
                  onClick={fetchEmailLogs}
                  className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded transition-colors"
                  title="Refresh Email Logs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {emailLogs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 font-mono">
                    No emails dispatched yet. Click "Send Live Test Email" above.
                  </div>
                ) : (
                  emailLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5 flex items-start justify-between gap-3 text-[11px]"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-semibold text-slate-200 truncate">
                          {log.subject}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                          <span>To: {log.to}</span>
                          <span>•</span>
                          <span>{new Date(log.sentAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono shrink-0 uppercase font-semibold ${
                        log.status === 'sent'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ==================== TAB 2: EMAIL & ALERT TEMPLATES EDITOR ==================== */}
      {activeTab === 'templates' && (
        <EmailTemplateEditor
          currentUserEmail={currentUser?.email || 'solarastra.in@gmail.com'}
          smtpConfig={{
            host: smtpHost,
            port: smtpPort,
            user: smtpUser,
            fromEmail: smtpFromEmail,
            fromName: smtpFromName,
            isVerified: isVerified,
          }}
        />
      )}

      {/* ==================== TAB 3: SUPERADMIN COMPANY & TEAM ONBOARDING ==================== */}
      {activeTab === 'onboarding' && (
        <CompanyTeamOnboarding 
          currentUser={currentUser} 
          onNavigateTab={onNavigateTab} 
        />
      )}

      {/* ==================== TAB 3: GOOGLE AUTH & ACCESS CONTROL ==================== */}
      {activeTab === 'auth' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  Google Authentication & Identity Management
                </h3>
                <p className="text-xs text-slate-400">
                  Firebase Authentication with Google Identity Services for enterprise SSO and flat-rate Google One AI subscription binding.
                </p>
              </div>

              {currentUser ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-medium transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Google Session</span>
                </button>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isAuthLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  {isAuthLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>Sign In with Google Account</span>
                </button>
              )}
            </div>

            {authNotice && (
              <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-xs text-purple-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{authNotice}</span>
              </div>
            )}

            {/* Active User Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Master Enterprise Admin
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      'S'
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">
                      {currentUser?.displayName || 'Solar Astra Master Admin'}
                    </div>
                    <div className="text-xs font-mono text-purple-300">
                      {currentUser?.email || 'solarastra.in@gmail.com'}
                    </div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      SuperAdmin • Full Platform & Routing Authority
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Authentication & Identity Binding
                </h4>
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Auth Identity Provider:</span>
                    <span className="font-mono text-[11px] text-slate-200">
                      {currentUser ? 'Google Firebase Authentication' : 'Local Administrator Session'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Account Status:</span>
                    <span className={currentUser ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                      {currentUser ? `Verified SuperAdmin (${currentUser.email})` : 'Unauthenticated (Sign In with Google above)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Session Security:</span>
                    <span className="text-cyan-300 font-mono">
                      {currentUser ? `UID: ${currentUser.uid.slice(0, 12)}...` : 'Standard Sandbox Guard'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: FIRESTORE CLOUD DATABASE ==================== */}
      {activeTab === 'firestore' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Firestore Cloud Database Architecture
                </h3>
                <p className="text-xs text-slate-400">
                  Persistent multi-region cloud database storing company credentials, SMTP server records, dispatch ledger, and audit history.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/30 text-xs font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Firestore Connected
              </span>
            </div>

            {/* Collection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-purple-500/30 space-y-1">
                <div className="text-[11px] font-mono text-purple-400">Collection</div>
                <div className="font-bold text-white text-sm font-mono">/companies</div>
                <div className="text-xs text-slate-300">Corporate tenants, billing quotas & allowed model matrices</div>
                <div className="pt-2 text-[10px] text-purple-400 font-mono">SuperAdmin Managed</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/30 space-y-1">
                <div className="text-[11px] font-mono text-indigo-400">Collection</div>
                <div className="font-bold text-white text-sm font-mono">/teams</div>
                <div className="text-xs text-slate-300">Department workspaces, lead policies & member access tokens</div>
                <div className="pt-2 text-[10px] text-indigo-400 font-mono">Granular Tiers Active</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Collection</div>
                <div className="font-bold text-white text-sm font-mono">/credentials</div>
                <div className="text-xs text-slate-300">Company provider keys & OAuth subscription sessions</div>
                <div className="pt-2 text-[10px] text-emerald-400 font-mono">Enterprise Vault Storage</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Collection</div>
                <div className="font-bold text-white text-sm font-mono">/smtp_settings</div>
                <div className="text-xs text-slate-300">Admin email server config & handshake certificates</div>
                <div className="pt-2 text-[10px] text-emerald-400 font-mono">Managed ({smtpHost}:{smtpPort})</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Collection</div>
                <div className="font-bold text-white text-sm font-mono">/email_logs</div>
                <div className="text-xs text-slate-300">Outbound email dispatch delivery receipts & Message IDs</div>
                <div className="pt-2 text-[10px] text-indigo-400 font-mono">{emailLogs.length} Records Persisted</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Collection</div>
                <div className="font-bold text-white text-sm font-mono">/dispatch_ledger</div>
                <div className="text-xs text-slate-300">Autonomous multi-model routing ledger & token savings</div>
                <div className="pt-2 text-[10px] text-emerald-400 font-mono">Cloud Sync Realtime</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Collection</div>
                <div className="font-bold text-white text-sm font-mono">/context_sessions</div>
                <div className="text-xs text-slate-300">Context AST graphs & cryptographic ledger chains</div>
                <div className="pt-2 text-[10px] text-purple-400 font-mono">Persisted when toggle is Firestore</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Collection</div>
                <div className="font-bold text-white text-sm font-mono">/audit_logs</div>
                <div className="text-xs text-slate-300">Administrative and security compliance audit trails</div>
                <div className="pt-2 text-[10px] text-cyan-400 font-mono">{auditLogs.length} Records Logged</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: CONTEXT STORAGE POLICY ==================== */}
      {activeTab === 'context_policy' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Context Storage & Persistence Toggle
              </h3>
              <p className="text-xs text-slate-400">
                Control whether memory graphs, token compression payloads, and AST context blocks persist to Firestore Cloud or remain in transient local memory.
              </p>
            </div>

            {/* Toggle Switch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Firestore Cloud (Default) */}
              <div 
                onClick={() => onTogglePersistenceMode('firestore_cloud')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  persistenceMode === 'firestore_cloud'
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-950/40 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        Firestore Cloud Persistence
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                        [DEFAULT / RECOMMENDED]
                      </span>
                    </div>
                  </div>
                  {persistenceMode === 'firestore_cloud' && (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-4 leading-relaxed">
                  All dispatched prompts, memory tokens, structured context blocks, and cryptographic hash chains are continuously persisted to Firestore collection <code className="text-indigo-300 bg-indigo-950/60 px-1 py-0.5 rounded">/context_sessions</code>. Accessible across browser sessions and multi-developer teams.
                </p>
              </div>

              {/* Option 2: Local Transient */}
              <div 
                onClick={() => onTogglePersistenceMode('local_transient')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  persistenceMode === 'local_transient'
                    ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950/40 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-400/50 flex items-center justify-center text-amber-300">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        Local Transient Scratchpad Only
                      </h4>
                      <span className="text-[10px] font-mono text-amber-400 font-semibold">
                        [Ephemeral / Zero Cloud Writes]
                      </span>
                    </div>
                  </div>
                  {persistenceMode === 'local_transient' && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-4 leading-relaxed">
                  Context sessions and memory blocks are kept exclusively in transient browser session memory. Zero context data is written to Firestore. Ideal for highly sensitive temporary scratchpad debugging.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: SELF-HOST VIABILITY & GPU ROI ==================== */}
      {activeTab === 'self_host' && (
        <div className="space-y-6">
          <SelfHostAnalysisPanel companyId="company_default" />
        </div>
      )}

      {/* ==================== TAB 6: AUDIT LOGS ==================== */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Security & Administrative Audit Ledger
                </h3>
                <p className="text-xs text-slate-400">
                  Cryptographically stamped audit records of logins, SMTP dispatches, credential changes, and system modifications.
                </p>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-white/10 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Audit Log</span>
              </button>
            </div>

            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-white/5 rounded-xl text-slate-400 text-xs font-mono">
                  No audit trail records found in Firestore. New administrative and security events will stream here in real-time.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id || Math.random().toString()}
                    className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{log.action}</span>
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                          {log.category}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{log.details}</p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Actor: <span className="text-slate-300">{log.actor}</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
