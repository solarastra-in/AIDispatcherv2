import { logEmailToFirestore, recordAuditLogToFirestore, CompanyFirestore, TeamFirestore, CompanyAdminUser } from '../lib/firebase';
import { DEFAULT_EMAIL_TEMPLATES, interpolateTemplate } from '../lib/defaultTemplates';
import { resolveApiUrl } from '../lib/firebaseClient';

export interface EmailNotificationRequest {
  to: string | string[];
  subject?: string;
  templateType: string;
  recipientName?: string;
  companyName?: string;
  teamName?: string;
  role?: string;
  allocatedTokens?: string;
  budgetLimit?: string;
  tenantDomain?: string;
  authorizedModels?: string;
  routingPriority?: string;
  variables?: Record<string, string | number | boolean>;
  customMessage?: string;
  sentBy?: string;
  htmlBody?: string;
  textBody?: string;
  retryCount?: number;
  skipFirestoreLog?: boolean;
}

export interface EmailDispatchResult {
  success: boolean;
  recipient: string;
  messageId?: string;
  error?: string;
  attempts: number;
  durationMs?: number;
  templateType: string;
  timestamp: string;
  deliveredDirectly?: boolean;
  log?: any;
}

export interface BatchEmailDispatchResult {
  success: boolean;
  total: number;
  sentCount: number;
  failedCount: number;
  results: EmailDispatchResult[];
}

type EmailEventListener = (result: EmailDispatchResult) => void;
const emailEventListeners = new Set<EmailEventListener>();

export function subscribeToEmailEvents(listener: EmailEventListener): () => void {
  emailEventListeners.add(listener);
  return () => {
    emailEventListeners.delete(listener);
  };
}

function notifyListeners(result: EmailDispatchResult) {
  emailEventListeners.forEach((listener) => {
    try {
      listener(result);
    } catch (e) {
      console.warn('Error in email event listener:', e);
    }
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Dispatches an email notification with automatic exponential backoff retry
 * and immutable Firestore audit trail logging to prevent silent failures.
 */
export async function sendEmailNotification(
  request: EmailNotificationRequest
): Promise<EmailDispatchResult> {
  const maxRetries = typeof request.retryCount === 'number' ? request.retryCount : 3;
  const recipients = Array.isArray(request.to) ? request.to : [request.to];
  const primaryRecipient = recipients[0]?.trim() || '';

  if (!primaryRecipient || !primaryRecipient.includes('@')) {
    const failureResult: EmailDispatchResult = {
      success: false,
      recipient: primaryRecipient || 'unspecified',
      error: 'Invalid or missing recipient email address.',
      attempts: 0,
      templateType: request.templateType,
      timestamp: new Date().toISOString(),
    };

    if (!request.skipFirestoreLog) {
      await logEmailToFirestore({
        to: primaryRecipient || 'unspecified',
        from: 'WhyOr Dispatch AI Enterprise <solarastra.in@gmail.com>',
        subject: request.subject || `[WhyOr Dispatch] ${request.templateType}`,
        emailType: request.templateType,
        status: 'failed',
        errorMessage: failureResult.error,
        sentBy: request.sentBy || 'System Notification Service',
      }).catch((e) => console.warn('Firestore email log notice:', e));
    }

    notifyListeners(failureResult);
    return failureResult;
  }

  let attempt = 0;
  let lastError = '';
  let finalResult: EmailDispatchResult | null = null;
  const startTime = Date.now();

  while (attempt < maxRetries) {
    attempt++;
    try {
      // 1. Prepare payload with variable normalization
      const templateConfig = DEFAULT_EMAIL_TEMPLATES[request.templateType];
      const subject =
        request.subject ||
        (templateConfig
          ? interpolateTemplate(
              templateConfig.subject,
              (request.variables as Record<string, string>) || {}
            )
          : `[WhyOr Dispatch] Notification for ${request.companyName || primaryRecipient}`);

      const payload = {
        to: recipients.join(', '),
        subject,
        templateType: request.templateType,
        recipientName: request.recipientName,
        companyName: request.companyName,
        teamName: request.teamName,
        role: request.role,
        allocatedTokens: request.allocatedTokens,
        budgetLimit: request.budgetLimit,
        tenantDomain: request.tenantDomain,
        authorizedModels: request.authorizedModels,
        routingPriority: request.routingPriority,
        customMessage: request.customMessage,
        sentBy: request.sentBy || 'solarastra.in@gmail.com',
        variables: request.variables,
        htmlBody: request.htmlBody,
        textBody: request.textBody,
      };

      // Try primary notify endpoint, with fallback to send-test / send-welcome
      let res: Response;
      try {
        res = await fetch(resolveApiUrl('/api/email/notify'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (networkErr) {
        // Fallback to legacy endpoint if notify route is unreachable
        res = await fetch(resolveApiUrl('/api/admin/smtp/send-test'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      let data: any = null;
      if (res.headers.get('content-type')?.includes('application/json')) {
        data = await res.json().catch(() => ({}));
      } else {
        const text = await res.text().catch(() => '');
        data = { success: res.ok, message: text };
      }

      if (res.ok && data.success) {
        finalResult = {
          success: true,
          recipient: primaryRecipient,
          messageId: data.messageId || `msg_${Date.now().toString(36)}`,
          attempts: attempt,
          durationMs: Date.now() - startTime,
          templateType: request.templateType,
          timestamp: new Date().toISOString(),
          deliveredDirectly: data.deliveredDirectly ?? true,
          log: data.log,
        };
        break;
      } else {
        lastError =
          data.error ||
          data.recommendation ||
          data.message ||
          `Server responded with HTTP status ${res.status}`;
        
        // If error is deterministic authentication failure or bad email syntax, do not burn useless retries
        if (
          lastError.includes('BadCredentials') ||
          lastError.includes('535') ||
          lastError.includes('credentials required') ||
          lastError.includes('Invalid recipient')
        ) {
          break;
        }

        if (attempt < maxRetries) {
          await sleep(Math.min(1000 * Math.pow(2, attempt - 1), 3000));
        }
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error connecting to email dispatch transport.';
      if (attempt < maxRetries) {
        await sleep(Math.min(1000 * Math.pow(2, attempt - 1), 3000));
      }
    }
  }

  if (!finalResult) {
    finalResult = {
      success: false,
      recipient: primaryRecipient,
      error: lastError || 'Email dispatch failed after maximum retry attempts.',
      attempts: attempt,
      durationMs: Date.now() - startTime,
      templateType: request.templateType,
      timestamp: new Date().toISOString(),
    };
  }

  // Record audit trail in Firestore
  if (!request.skipFirestoreLog) {
    try {
      await logEmailToFirestore({
        to: recipients.join(', '),
        from: `WhyOr Dispatch AI Enterprise <${request.sentBy || 'solarastra.in@gmail.com'}>`,
        subject: request.subject || `[WhyOr Dispatch] ${request.templateType}`,
        emailType: request.templateType,
        status: finalResult.success ? 'sent' : 'failed',
        messageId: finalResult.messageId,
        errorMessage: finalResult.error,
        sentBy: request.sentBy || 'System Notification Service',
      });
    } catch (logErr) {
      console.warn('Failed to record email audit in Firestore:', logErr);
    }
  }

  notifyListeners(finalResult);
  return finalResult;
}

/**
 * Batch Email Dispatcher with throttling and progress tracking
 */
export async function sendBatchEmailNotifications(
  requests: EmailNotificationRequest[],
  onProgress?: (completed: number, total: number, current: EmailDispatchResult) => void
): Promise<BatchEmailDispatchResult> {
  const total = requests.length;
  const results: EmailDispatchResult[] = [];
  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < total; i++) {
    const req = requests[i];
    const result = await sendEmailNotification(req);
    results.push(result);

    if (result.success) {
      sentCount++;
    } else {
      failedCount++;
    }

    if (onProgress) {
      onProgress(i + 1, total, result);
    }

    // Small delay between sends to prevent SMTP socket rate limiting
    if (i < total - 1) {
      await sleep(150);
    }
  }

  return {
    success: failedCount === 0,
    total,
    sentCount,
    failedCount,
    results,
  };
}

/**
 * Specialized Notification: Company & Workspace Provisioned
 * Triggered upon successful company creation / onboarding completion.
 */
export async function sendCompanyWelcomeNotification(params: {
  company: CompanyFirestore;
  adminUser?: CompanyAdminUser;
  customMessage?: string;
  sentBy?: string;
  notifySuperAdmin?: boolean;
}): Promise<EmailDispatchResult> {
  const { company, adminUser, customMessage, sentBy, notifySuperAdmin = true } = params;
  const adminEmail = (
    adminUser?.email ||
    company.companyAdminEmail ||
    company.billingEmail ||
    'solarastra.in@gmail.com'
  ).trim();

  const adminName = adminUser?.name || `${company.name} Administrator`;
  const modelsFormatted =
    company.allowedModels && company.allowedModels.length > 0
      ? company.allowedModels.join(', ')
      : 'Gemini 3.7 Flash, Claude 3.7 Sonnet, GPT-4.5';

  const quotaFormatted = `${(company.monthlyTokenQuota / 1_000_000).toFixed(0)}M tokens / month`;
  const budgetFormatted = `$${(company.monthlyBudgetUsd || 0).toLocaleString()} / month`;
  const routingPriorityLabel =
    company.routingPriority === 'byok_first'
      ? 'BYOK Dedicated Priority'
      : 'Zero-Markup Flat-Rate Subscriptions';

  const defaultMsg =
    customMessage ||
    `Enterprise workspace for ${company.name} (${company.domain}) has been provisioned on WhyOr Dispatch AI with delegated Corporate Admin authority.`;

  const variables: Record<string, string> = {
    '{{recipient_name}}': adminName,
    '{{recipient_email}}': adminEmail,
    '{{company_name}}': company.name,
    '{{allocated_tokens}}': quotaFormatted,
    '{{budget_limit}}': budgetFormatted,
    '{{tenant_domain}}': company.domain,
    '{{authorized_models}}': modelsFormatted,
    '{{routing_priority}}': routingPriorityLabel,
    '{{login_url}}': 'https://ais-dev-gcdyq3rgswqtgkxcjbfmqt-4552824319.us-west2.run.app',
    '{{timestamp}}': new Date().toLocaleString(),
    '{{custom_message}}': defaultMsg,
  };

  const adminResult = await sendEmailNotification({
    to: adminEmail,
    subject: `🏢 [WhyOr Enterprise] Setup Instructions: Your ${company.name} AI Workspace is Ready`,
    templateType: 'company_onboarded',
    recipientName: adminName,
    companyName: company.name,
    allocatedTokens: quotaFormatted,
    budgetLimit: budgetFormatted,
    tenantDomain: company.domain,
    authorizedModels: modelsFormatted,
    routingPriority: routingPriorityLabel,
    customMessage: defaultMsg,
    variables,
    sentBy: sentBy || company.superAdminEmail || 'solarastra.in@gmail.com',
  });

  // Optionally send carbon-copy summary to SuperAdmin if different
  if (notifySuperAdmin && company.superAdminEmail && company.superAdminEmail.toLowerCase() !== adminEmail.toLowerCase()) {
    sendEmailNotification({
      to: company.superAdminEmail,
      subject: `🏢 [SuperAdmin Audit] New Enterprise Tenant Created: ${company.name}`,
      templateType: 'company_onboarded',
      recipientName: 'SuperAdmin',
      companyName: company.name,
      allocatedTokens: quotaFormatted,
      budgetLimit: budgetFormatted,
      tenantDomain: company.domain,
      authorizedModels: modelsFormatted,
      routingPriority: routingPriorityLabel,
      customMessage: `Tenant '${company.name}' provisioned. Assigned Corporate Admin: ${adminName} (${adminEmail}).`,
      variables: {
        ...variables,
        '{{recipient_name}}': 'SuperAdmin',
        '{{recipient_email}}': company.superAdminEmail,
      },
      sentBy: sentBy || 'solarastra.in@gmail.com',
    }).catch((e) => console.warn('SuperAdmin CC notification notice:', e));
  }

  return adminResult;
}

/**
 * Specialized Notification: Corporate Administrator Privileges & Access Grant
 */
export async function sendCorporateAdminCredentialsNotification(params: {
  admin: CompanyAdminUser;
  company: CompanyFirestore;
  customMessage?: string;
  sentBy?: string;
}): Promise<EmailDispatchResult> {
  const { admin, company, customMessage, sentBy } = params;
  const quotaFormatted = `${((admin.monthlyTokenQuota || company.monthlyTokenQuota || 50_000_000) / 1_000_000).toFixed(0)}M tokens / month`;
  
  const privList: string[] = [];
  if (admin.privileges?.canCreateTeams) privList.push('Create & Manage Teams');
  if (admin.privileges?.canManageBYOK) privList.push('Enterprise BYOK & Provider Keys');
  if (admin.privileges?.canManageBudgets) privList.push('Budget & Spend Control');
  if (admin.privileges?.canInviteMembers) privList.push('Invite & Provision Engineers');
  if (admin.privileges?.canConfigureRouting) privList.push('Autonomous Routing Policies');
  if (admin.privileges?.canViewTelemetry) privList.push('Live Telemetry & Logs');

  const modelsFormatted =
    company.allowedModels && company.allowedModels.length > 0
      ? company.allowedModels.join(', ')
      : 'Gemini 3.7 Flash, Claude 3.7 Sonnet, GPT-4.5, DeepSeek R1';

  const defaultMsg =
    customMessage ||
    `You have been appointed Corporate Administrator for ${company.name}. Delegated privileges: ${privList.join(', ')}. Login at WhyOr Dispatch AI with your verified email (${admin.email}) to manage corporate teams, enterprise BYOK credentials, and developer quotas.`;

  const variables: Record<string, string> = {
    '{{recipient_name}}': admin.name,
    '{{recipient_email}}': admin.email,
    '{{company_name}}': company.name,
    '{{role}}': `Corporate Administrator (${admin.title || 'Executive Lead'})`,
    '{{allocated_tokens}}': quotaFormatted,
    '{{authorized_models}}': modelsFormatted,
    '{{tier_cap}}': admin.tierCap || 'Frontier Tier 3',
    '{{active_permissions}}': privList.join(', ') || 'Full Corporate Governance',
    '{{sent_by}}': sentBy || 'SuperAdmin',
    '{{login_url}}': 'https://ais-dev-gcdyq3rgswqtgkxcjbfmqt-4552824319.us-west2.run.app',
    '{{timestamp}}': new Date().toLocaleString(),
    '{{custom_message}}': defaultMsg,
  };

  return sendEmailNotification({
    to: admin.email,
    subject: `👑 [WhyOr Dispatch] Corporate Admin Credentials: ${company.name} Delegated Authority`,
    templateType: 'admin_privilege_grant',
    recipientName: admin.name,
    companyName: company.name,
    role: `Corporate Administrator (${admin.title || 'Director of AI'})`,
    allocatedTokens: quotaFormatted,
    authorizedModels: modelsFormatted,
    customMessage: defaultMsg,
    variables,
    sentBy: sentBy || 'SuperAdmin (solarastra.in@gmail.com)',
  });
}

/**
 * Specialized Notification: Employee / Team Member Onboarding & Setup Guide
 */
export async function sendEmployeeSetupGuideNotification(params: {
  employees: Array<{
    name: string;
    email: string;
    role?: string;
    teamName?: string;
    tierCap?: string;
    monthlyTokenQuota?: number;
    monthlyBudgetUsd?: number;
  }>;
  company: CompanyFirestore;
  customMessage?: string;
  sentBy?: string;
  onProgress?: (completed: number, total: number, current: EmailDispatchResult) => void;
}): Promise<BatchEmailDispatchResult> {
  const { employees, company, customMessage, sentBy, onProgress } = params;
  const modelsFormatted =
    company.allowedModels && company.allowedModels.length > 0
      ? company.allowedModels.join(', ')
      : 'Gemini 3.7 Flash, Claude 3.7 Sonnet, GPT-4.5';

  const requests: EmailNotificationRequest[] = employees.map((emp) => {
    const quotaM = emp.monthlyTokenQuota
      ? (emp.monthlyTokenQuota / 1_000_000).toFixed(0)
      : (company.monthlyTokenQuota / 1_000_000).toFixed(0);
    const quotaFormatted = `${quotaM}M tokens / month`;

    const defaultMsg =
      customMessage ||
      `Welcome to ${company.name}'s AI Engineering Workspace on WhyOr Dispatch AI. You can route models with zero markup and collaborative team telemetry.`;

    const variables: Record<string, string> = {
      '{{recipient_name}}': emp.name,
      '{{recipient_email}}': emp.email,
      '{{company_name}}': company.name,
      '{{team_name}}': emp.teamName || `${company.name} Core AI Team`,
      '{{role}}': emp.role || 'AI Developer',
      '{{allocated_tokens}}': quotaFormatted,
      '{{authorized_models}}': modelsFormatted,
      '{{login_url}}': 'https://ais-dev-gcdyq3rgswqtgkxcjbfmqt-4552824319.us-west2.run.app',
      '{{timestamp}}': new Date().toLocaleString(),
      '{{custom_message}}': defaultMsg,
    };

    return {
      to: emp.email,
      subject: `🚀 [WhyOr Dispatch] Welcome to ${company.name} AI Lab — Workspace Credentials & Token Quota`,
      templateType: 'onboarding_invite',
      recipientName: emp.name,
      companyName: company.name,
      teamName: emp.teamName || `${company.name} Core Team`,
      role: emp.role || 'AI Developer',
      allocatedTokens: quotaFormatted,
      authorizedModels: modelsFormatted,
      customMessage: defaultMsg,
      variables,
      sentBy: sentBy || company.companyAdminEmail || 'solarastra.in@gmail.com',
    };
  });

  return sendBatchEmailNotifications(requests, onProgress);
}

/**
 * Specialized Notification: Quota & Monthly Statement Alert
 */
export async function sendQuotaThresholdNotification(params: {
  company: CompanyFirestore;
  thresholdPct?: number;
  currentSpend?: string;
  budgetLimit?: string;
  tokensUsed?: string;
  customMessage?: string;
  sentBy?: string;
}): Promise<EmailDispatchResult> {
  const { company, thresholdPct = 80, currentSpend, budgetLimit, tokensUsed, customMessage, sentBy } = params;
  const targetEmail = company.billingEmail || company.companyAdminEmail || 'solarastra.in@gmail.com';
  
  const formattedTokensUsed =
    tokensUsed || `${(company.monthlyTokensUsed || 0).toLocaleString()} tokens`;
  const formattedBudgetLimit =
    budgetLimit || `$${(company.monthlyBudgetUsd || 0).toLocaleString()}`;
  const formattedCurrentSpend =
    currentSpend || `$${Math.round(((company.monthlyTokensUsed || 0) / Math.max(1, company.monthlyTokenQuota)) * (company.monthlyBudgetUsd || 500)).toLocaleString()}`;

  const defaultMsg =
    customMessage ||
    `Dear ${company.name} Administrator,\n\nYour current monthly token consumption is ${(company.monthlyTokensUsed || 0).toLocaleString()} out of ${company.monthlyTokenQuota.toLocaleString()} allocated tokens (${Math.round(((company.monthlyTokensUsed || 0) / Math.max(1, company.monthlyTokenQuota)) * 100)}% capacity). Your active routing priority is set to ${company.routingPriority.toUpperCase()}.\n\nLog in with your corporate Google Account to inspect granular per-team telemetry.`;

  const variables: Record<string, string> = {
    '{{recipient_name}}': `${company.name} Administrator`,
    '{{recipient_email}}': targetEmail,
    '{{company_name}}': company.name,
    '{{threshold_percentage}}': String(thresholdPct),
    '{{current_spend}}': formattedCurrentSpend,
    '{{budget_limit}}': formattedBudgetLimit,
    '{{tokens_used}}': formattedTokensUsed,
    '{{fallback_route}}': 'Zero-Markup Flat-Rate Subscriptions',
    '{{timestamp}}': new Date().toLocaleString(),
    '{{custom_message}}': defaultMsg,
    '{{action_url}}': 'https://ais-dev-gcdyq3rgswqtgkxcjbfmqt-4552824319.us-west2.run.app',
  };

  return sendEmailNotification({
    to: targetEmail,
    subject: `⚠️ [WhyOr Quota Alert] ${company.name} Monthly Token Budget at ${thresholdPct}%`,
    templateType: 'quota_alert',
    recipientName: `${company.name} Admin`,
    companyName: company.name,
    customMessage: defaultMsg,
    variables,
    sentBy: sentBy || 'Admin Superuser',
  });
}
