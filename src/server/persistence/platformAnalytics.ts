/**
 * src/server/persistence/platformAnalytics.ts (v2 — corrected)
 *
 * v1 aggregated from an invented "usageEvents" collection that doesn't
 * exist in the real firestore.rules schema. Corrected to aggregate from
 * `dispatch_ledger` — the real collection firestore.rules already
 * defines for "Dispatch Ledger & Task History." Writes are server-only
 * per that collection's rule (`allow write: if false` for clients — the
 * Admin SDK used here bypasses Firestore rules entirely, which is
 * exactly why client-side writes to this collection must stay blocked).
 */

import { getDb } from "../firestoreClient";
import { BusinessException } from "../businessException";

export interface DispatchLedgerEntry {
  id: string;
  userId: string | null;
  companyId: string | null;
  provider: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  createdAt: string;
}

export async function recordDispatchLedgerEntry(entry: Omit<DispatchLedgerEntry, "id" | "createdAt">): Promise<void> {
  const db = getDb();
  const docRef = db.collection("dispatch_ledger").doc();
  try {
    await docRef.set({ ...entry, id: docRef.id, createdAt: new Date().toISOString() });
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_WRITE_FAILED", `Failed to record dispatch ledger entry: ${err.message}`, 500);
  }
}

export interface PlatformTotals {
  totalTokensRouted: number;
  totalCostUsd: number;
  totalRequests: number;
  computedFrom: "live_firestore_aggregation"; // explicit marker — never confuse this with a hardcoded figure again
  periodStart: string | null; // null if there are zero entries yet
}

/**
 * Real aggregation, not an estimate. For high-volume production use,
 * this should move to a scheduled Cloud Function maintaining a running
 * counter document instead of scanning all ledger entries on every
 * call — noted here rather than silently left as a scaling problem for
 * someone to discover later.
 */
export async function computePlatformTotals(): Promise<PlatformTotals> {
  const db = getDb();
  let snapshot;
  try {
    snapshot = await db.collection("dispatch_ledger").get();
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_READ_FAILED", `Failed to compute platform totals: ${err.message}`, 500);
  }

  if (snapshot.empty) {
    return { totalTokensRouted: 0, totalCostUsd: 0, totalRequests: 0, computedFrom: "live_firestore_aggregation", periodStart: null };
  }

  let totalTokensRouted = 0, totalCostUsd = 0;
  let earliestCreatedAt: string | null = null;
  snapshot.docs.forEach((d) => {
    const e = d.data() as DispatchLedgerEntry;
    totalTokensRouted += (e.inputTokens || 0) + (e.outputTokens || 0);
    totalCostUsd += e.costUsd || 0;
    if (!earliestCreatedAt || e.createdAt < earliestCreatedAt) earliestCreatedAt = e.createdAt;
  });

  return {
    totalTokensRouted, totalCostUsd: Math.round(totalCostUsd * 100000) / 100000,
    totalRequests: snapshot.size, computedFrom: "live_firestore_aggregation", periodStart: earliestCreatedAt,
  };
}
