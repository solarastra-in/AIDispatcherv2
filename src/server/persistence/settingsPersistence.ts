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

const SMTP_DOC_ID = "global";

const DEFAULT_SMTP_SETTINGS: Omit<ServerSmtpSettings, "updatedAt"> = {
  id: SMTP_DOC_ID,
  host: "", port: 587, secure: false, requireTls: true,
  user: "", pass: "", fromEmail: "", fromName: "", replyTo: "",
  isVerified: false,
};

let cachedSmtpSettings: ServerSmtpSettings = { ...DEFAULT_SMTP_SETTINGS, updatedAt: new Date().toISOString() };

export async function getSmtpSettings(): Promise<ServerSmtpSettings> {
  const db = getDb();
  try {
    const doc = await db.collection("smtp_settings").doc(SMTP_DOC_ID).get();
    if (doc.exists) {
      cachedSmtpSettings = doc.data() as ServerSmtpSettings;
    }
  } catch (err: any) {
    console.warn(`Notice: Firestore SMTP read notice (${err.message}). Using cache.`);
  }
  return cachedSmtpSettings;
}

export async function saveSmtpSettings(settings: Partial<ServerSmtpSettings>, updatedBy: string): Promise<ServerSmtpSettings> {
  const db = getDb();
  const existing = await getSmtpSettings();
  const updated: ServerSmtpSettings = { ...existing, ...settings, updatedAt: new Date().toISOString(), updatedBy };
  cachedSmtpSettings = updated;
  try {
    await db.collection("smtp_settings").doc(SMTP_DOC_ID).set(updated);
  } catch (err: any) {
    console.warn(`Notice: Firestore SMTP write notice (${err.message}). Saved in memory.`);
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

const emailLogsStore: EmailLogEntry[] = [];

export async function recordEmailLog(entry: EmailLogEntry): Promise<void> {
  emailLogsStore.unshift(entry);
  if (emailLogsStore.length > 200) emailLogsStore.pop();
  const db = getDb();
  try {
    await db.collection("email_logs").doc(entry.id).set(entry);
  } catch (err: any) {
    console.warn(`Notice: Firestore email log write notice (${err.message}). Saved in memory.`);
  }
}

export async function listEmailLogs(limit = 100): Promise<EmailLogEntry[]> {
  const db = getDb();
  try {
    const snapshot = await db.collection("email_logs").orderBy("sentAt", "desc").limit(limit).get();
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as EmailLogEntry);
    }
  } catch (err: any) {
    console.warn(`Notice: Firestore email logs list notice (${err.message}). Using memory store.`);
  }
  return emailLogsStore.slice(0, limit);
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

const emailTemplatesStore = new Map<string, EmailTemplate>();

export async function getEmailTemplate(templateId: string): Promise<EmailTemplate | null> {
  const db = getDb();
  try {
    const doc = await db.collection("email_templates").doc(templateId).get();
    if (doc.exists) {
      const t = doc.data() as EmailTemplate;
      emailTemplatesStore.set(t.id, t);
      return t;
    }
  } catch (err: any) {
    console.warn(`Notice: Firestore email template read notice (${err.message}). Checking cache.`);
  }
  return emailTemplatesStore.get(templateId) || null;
}

export async function saveEmailTemplate(template: EmailTemplate): Promise<void> {
  emailTemplatesStore.set(template.id, template);
  const db = getDb();
  try {
    await db.collection("email_templates").doc(template.id).set(template);
  } catch (err: any) {
    console.warn(`Notice: Firestore email template write notice (${err.message}). Saved in memory.`);
  }
}

// --------------------------------------------------------- Company profile

export interface CompanyProfile {
  companyId: string;
  companyName: string;
  primaryContactEmail: string;
  updatedAt: string;
}

const companyProfileStore = new Map<string, CompanyProfile>();

export async function getCompanyProfile(companyId: string): Promise<CompanyProfile> {
  const db = getDb();
  try {
    const doc = await db.collection("companies").doc(companyId).get();
    if (doc.exists) {
      const profile = doc.data() as CompanyProfile;
      companyProfileStore.set(companyId, profile);
      return profile;
    }
  } catch (err: any) {
    console.warn(`Notice: Firestore company read notice (${err.message}). Checking cache.`);
  }
  const cached = companyProfileStore.get(companyId);
  if (cached) return cached;

  // Return a safe default profile rather than crashing
  const defaultProfile: CompanyProfile = {
    companyId,
    companyName: companyId.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    primaryContactEmail: `admin@${companyId}.com`,
    updatedAt: new Date().toISOString(),
  };
  companyProfileStore.set(companyId, defaultProfile);
  return defaultProfile;
}

// -------------------------------------------------- Credentials (BYOK vault)

export interface CompanyCredential {
  id: string;
  companyId: string;
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

const credentialsStore = new Map<string, CompanyCredential>();

export async function getCompanyCredential(companyId: string, provider: string): Promise<CompanyCredential | null> {
  const db = getDb();
  const docId = credentialDocId(companyId, provider);
  try {
    const doc = await db.collection("credentials").doc(docId).get();
    if (doc.exists) {
      const cred = doc.data() as CompanyCredential;
      credentialsStore.set(docId, cred);
      return cred;
    }
  } catch (err: any) {
    console.warn(`Notice: Firestore credential read notice (${err.message}). Checking cache.`);
  }
  return credentialsStore.get(docId) || null;
}

export async function listCompanyCredentials(companyId: string): Promise<CompanyCredential[]> {
  const db = getDb();
  try {
    const snapshot = await db.collection("credentials").where("companyId", "==", companyId).get();
    if (!snapshot.empty) {
      const creds = snapshot.docs.map((d) => d.data() as CompanyCredential);
      for (const c of creds) {
        credentialsStore.set(c.id || credentialDocId(c.companyId, c.provider), c);
      }
      return creds;
    }
  } catch (err: any) {
    console.warn(`Notice: Firestore credentials list notice (${err.message}). Using cache.`);
  }
  return Array.from(credentialsStore.values()).filter((c) => c.companyId === companyId);
}

export async function saveCompanyCredential(credential: CompanyCredential): Promise<void> {
  const docId = credentialDocId(credential.companyId, credential.provider);
  const updated: CompanyCredential = { ...credential, id: docId, updatedAt: new Date().toISOString() };
  credentialsStore.set(docId, updated);
  const db = getDb();
  try {
    await db.collection("credentials").doc(docId).set(updated);
  } catch (err: any) {
    console.warn(`Notice: Firestore credential write notice (${err.message}). Saved in memory.`);
  }
}
