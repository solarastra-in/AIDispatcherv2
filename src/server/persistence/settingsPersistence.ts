/**
 * src/server/persistence/settingsPersistence.ts (v2 — corrected)
 *
 * v1 of this file (delivered in the prior patch) invented collection
 * names — "platformSettings/smtp", credentials nested inside a company
 * document — before firestore.rules was visible to this session. Now
 * that it is, this version uses the REAL schema the app's own security
 * rules define: top-level `credentials`, `smtp_settings`,
 * `email_templates`, `companies`, `teams` collections. Same fix
 * rationale as before (no fabricated "verified" state, real business
 * exceptions on failure) — corrected to the schema that actually exists.
 */

import { getDb } from "../firestoreClient";
import { BusinessException } from "../businessException";

// ---------------------------------------------------------------- SMTP

export interface ServerSmtpSettings {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  requireTls: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  isVerified: boolean;
  lastVerifiedAt?: string;
  lastTestedAt?: string;
  updatedAt: string;
  updatedBy?: string;
}

const SMTP_DOC_ID = "global"; // single platform-wide SMTP config, matching smtp_settings/{settingsId} in firestore.rules

const DEFAULT_SMTP_SETTINGS: Omit<ServerSmtpSettings, "updatedAt"> = {
  id: SMTP_DOC_ID,
  host: "", port: 587, secure: false, requireTls: true,
  user: "", pass: "", fromEmail: "", fromName: "", replyTo: "",
  // Deliberately NOT pre-verified — a real fabrication found in the
  // reviewed server.ts (isVerified: true at boot, before any test ran).
  isVerified: false,
};

export async function getSmtpSettings(): Promise<ServerSmtpSettings> {
  const db = getDb();
  const doc = await db.collection("smtp_settings").doc(SMTP_DOC_ID).get();
  if (!doc.exists) return { ...DEFAULT_SMTP_SETTINGS, updatedAt: new Date().toISOString() };
  return doc.data() as ServerSmtpSettings;
}

export async function saveSmtpSettings(settings: Partial<ServerSmtpSettings>, updatedBy: string): Promise<ServerSmtpSettings> {
  const db = getDb();
  const existing = await getSmtpSettings();
  const updated: ServerSmtpSettings = { ...existing, ...settings, updatedAt: new Date().toISOString(), updatedBy };
  try {
    await db.collection("smtp_settings").doc(SMTP_DOC_ID).set(updated);
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_WRITE_FAILED", `Failed to save SMTP settings: ${err.message}`, 500);
  }
  return updated;
}

// -------------------------------------------------------------- Email logs

export interface EmailLogEntry {
  id: string;
  to: string;
  from: string;
  subject: string;
  emailType: string;
  status: "sent" | "failed";
  messageId?: string;
  errorMessage?: string;
  sentAt: string;
  sentBy: string;
}

export async function recordEmailLog(entry: EmailLogEntry): Promise<void> {
  const db = getDb();
  try {
    await db.collection("email_logs").doc(entry.id).set(entry); // matches email_logs/{logId} in firestore.rules
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_WRITE_FAILED", `Failed to record email log: ${err.message}`, 500);
  }
}

export async function listEmailLogs(limit = 100): Promise<EmailLogEntry[]> {
  const db = getDb();
  const snapshot = await db.collection("email_logs").orderBy("sentAt", "desc").limit(limit).get();
  return snapshot.docs.map((d) => d.data() as EmailLogEntry);
  // No seeded fake entry — an empty result means no emails have been
  // sent yet, which is the honest state for a fresh deployment.
}

// ------------------------------------------------------------- Email templates

export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  updatedAt: string;
  updatedBy?: string;
}

export async function getEmailTemplate(templateId: string): Promise<EmailTemplate | null> {
  const db = getDb();
  const doc = await db.collection("email_templates").doc(templateId).get();
  return doc.exists ? (doc.data() as EmailTemplate) : null;
}

export async function saveEmailTemplate(template: EmailTemplate): Promise<void> {
  const db = getDb();
  try {
    await db.collection("email_templates").doc(template.id).set(template);
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_WRITE_FAILED", `Failed to save email template '${template.id}': ${err.message}`, 500);
  }
}

// --------------------------------------------------------- Company profile

export interface CompanyProfile {
  companyId: string;
  companyName: string;
  primaryContactEmail: string;
  updatedAt: string;
}

export async function getCompanyProfile(companyId: string): Promise<CompanyProfile> {
  const db = getDb();
  const doc = await db.collection("companies").doc(companyId).get();
  if (!doc.exists) {
    throw new BusinessException(
      "INVALID_CREDENTIAL_STATE",
      `No company profile exists for '${companyId}' — a company must be onboarded before its settings can be read.`,
      404
    );
  }
  return doc.data() as CompanyProfile;
}

// -------------------------------------------------- Credentials (BYOK vault)

export interface CompanyCredential {
  id: string;             // `${companyId}_${provider}` — matches the flat top-level `credentials` collection in firestore.rules
  companyId: string;      // required field the security rule's isCompanyAdminOf() check reads (resource.data.companyId)
  provider: string;
  providerDisplayName: string;
  authMethod?: "api_key" | "local_proxy" | "both";
  apiKey: string;
  maskedKey: string;
  localProxyUrl?: string;
  status: "connected" | "unconfigured" | "verifying" | "invalid";
  lastVerifiedAt?: string;
  detectedModels?: string[];
  updatedAt: string;
}

function credentialDocId(companyId: string, provider: string): string {
  return `${companyId}_${provider}`;
}

export async function getCompanyCredential(companyId: string, provider: string): Promise<CompanyCredential | null> {
  const db = getDb();
  const doc = await db.collection("credentials").doc(credentialDocId(companyId, provider)).get();
  return doc.exists ? (doc.data() as CompanyCredential) : null;
}

export async function listCompanyCredentials(companyId: string): Promise<CompanyCredential[]> {
  const db = getDb();
  const snapshot = await db.collection("credentials").where("companyId", "==", companyId).get();
  return snapshot.docs.map((d) => d.data() as CompanyCredential);
}

export async function saveCompanyCredential(credential: CompanyCredential): Promise<void> {
  const db = getDb();
  try {
    await db.collection("credentials").doc(credentialDocId(credential.companyId, credential.provider)).set({
      ...credential, updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_WRITE_FAILED", `Failed to save credential for '${credential.provider}': ${err.message}`, 500);
  }
}
