/**
 * src/server/persistence/auditLog.ts
 *
 * Backend for the requested "Admin Audit Trail" tab. Matches the
 * `audit_logs` collection already defined in firestore.rules
 * (super_admin read-only; `allow write: if false` for clients, since
 * writes happen server-side via the Admin SDK, which bypasses that rule
 * by design — exactly the pattern this collection was built for).
 *
 * WHY THIS MATTERS FOR "pinpoint why duplicate any errors that might be
 * generated": every significant admin/security action across this
 * review (budget changes, credential changes, SMTP changes, catalog
 * changes, failed auth attempts) now has a real, queryable trail — so a
 * super admin can see, for example, that a budget was set twice in
 * quick succession by two different callers, rather than just observing
 * the confusing end state.
 */

import { getDb } from "../firestoreClient";
import { BusinessException } from "../businessException";

export type AuditEventType =
  | "budget_changed" | "credential_saved" | "credential_deleted"
  | "smtp_settings_changed" | "smtp_verified" | "catalog_model_added"
  | "catalog_model_status_changed" | "company_onboarded" | "team_created"
  | "auth_denied" | "email_delivery_failed";

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  actorEmail: string | null; // null for a denied/unauthenticated attempt — see auth_denied
  targetId?: string; // whatever the action was performed on — a user ID, a company ID, a provider name, etc.
  details: Record<string, any>; // event-specific — e.g. { previousLimit, newLimit } for budget_changed
  ipAddress?: string;
  createdAt: string;
}

export async function recordAuditLog(entry: Omit<AuditLogEntry, "id" | "createdAt">): Promise<void> {
  const db = getDb();
  const docRef = db.collection("audit_logs").doc();
  try {
    await docRef.set({ ...entry, id: docRef.id, createdAt: new Date().toISOString() });
  } catch (err: any) {
    // Deliberately does NOT throw — a failure to write an audit log
    // should never block the real action it's describing (e.g. a
    // successful budget change shouldn't fail just because the audit
    // trail write hiccuped). Logged loudly instead, so the gap is
    // visible in server logs even though it doesn't block the request.
    console.error(`[AuditLog] Failed to record '${entry.eventType}' event:`, err.message);
  }
}

export interface AuditLogQuery {
  eventType?: AuditEventType;
  actorEmail?: string;
  limit?: number;
  before?: string; // ISO timestamp, for pagination
}

export async function listAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogEntry[]> {
  const db = getDb();
  let ref: FirebaseFirestore.Query = db.collection("audit_logs").orderBy("createdAt", "desc");

  if (query.eventType) ref = ref.where("eventType", "==", query.eventType);
  if (query.actorEmail) ref = ref.where("actorEmail", "==", query.actorEmail);
  if (query.before) ref = ref.where("createdAt", "<", query.before);

  ref = ref.limit(Math.min(query.limit ?? 100, 500)); // hard cap — never let an unbounded query run against a large log collection

  let snapshot;
  try {
    snapshot = await ref.get();
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_READ_FAILED", `Failed to read audit logs: ${err.message}`, 500);
  }
  return snapshot.docs.map((d) => d.data() as AuditLogEntry);
}

/**
 * Groups recent logs by a coarse "signature" (eventType + targetId) to
 * surface exactly the pattern requested — "pinpoint why duplicate...
 * errors might be generated." A repeated signature within a short
 * window is a real signal (a retry loop, a double-submit, a client bug
 * firing the same request twice), not just noise.
 */
export interface DuplicateSignal {
  eventType: AuditEventType;
  targetId: string | undefined;
  count: number;
  firstAt: string;
  lastAt: string;
}

export function detectDuplicateSignals(logs: AuditLogEntry[], windowMinutes = 5): DuplicateSignal[] {
  const groups = new Map<string, AuditLogEntry[]>();
  for (const log of logs) {
    const key = `${log.eventType}:${log.targetId ?? ""}`;
    const group = groups.get(key) ?? [];
    group.push(log);
    groups.set(key, group);
  }

  const signals: DuplicateSignal[] = [];
  for (const [, group] of groups) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const windowMs = windowMinutes * 60 * 1000;
    let clusterStart = 0;
    for (let i = 1; i <= sorted.length; i++) {
      const brokeWindow = i === sorted.length || (new Date(sorted[i].createdAt).getTime() - new Date(sorted[clusterStart].createdAt).getTime()) > windowMs;
      if (brokeWindow) {
        const cluster = sorted.slice(clusterStart, i);
        if (cluster.length >= 2) {
          signals.push({
            eventType: cluster[0].eventType, targetId: cluster[0].targetId,
            count: cluster.length, firstAt: cluster[0].createdAt, lastAt: cluster[cluster.length - 1].createdAt,
          });
        }
        clusterStart = i;
      }
    }
  }
  return signals.sort((a, b) => b.count - a.count);
}
