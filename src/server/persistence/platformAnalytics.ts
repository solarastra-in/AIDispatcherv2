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

const inMemoryLedgerEntries: DispatchLedgerEntry[] = [];

export async function recordDispatchLedgerEntry(entry: Omit<DispatchLedgerEntry, "id" | "createdAt">): Promise<void> {
  const db = getDb();
  const docRef = db.collection("dispatch_ledger").doc();
  const fullEntry: DispatchLedgerEntry = { ...entry, id: docRef.id, createdAt: new Date().toISOString() };
  inMemoryLedgerEntries.unshift(fullEntry);
  if (inMemoryLedgerEntries.length > 500) inMemoryLedgerEntries.pop();

  try {
    await docRef.set(fullEntry);
  } catch (err: any) {
    console.warn(`Notice: Firestore dispatch ledger write notice (${err.message}). Kept in memory.`);
  }
}

export interface PlatformTotals {
  totalTokensRouted: number;
  totalCostUsd: number;
  totalRequests: number;
  computedFrom: "live_firestore_aggregation" | "in_memory_aggregation";
  periodStart: string | null;
}

export async function computePlatformTotals(): Promise<PlatformTotals> {
  const db = getDb();
  try {
    const snapshot = await db.collection("dispatch_ledger").get();
    if (!snapshot.empty) {
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
  } catch (err: any) {
    console.warn(`Notice: Firestore totals computation notice (${err.message}). Aggregating from memory.`);
  }

  // In-memory fallback
  let totalTokensRouted = 0, totalCostUsd = 0;
  let earliestCreatedAt: string | null = null;
  inMemoryLedgerEntries.forEach((e) => {
    totalTokensRouted += (e.inputTokens || 0) + (e.outputTokens || 0);
    totalCostUsd += e.costUsd || 0;
    if (!earliestCreatedAt || e.createdAt < earliestCreatedAt) earliestCreatedAt = e.createdAt;
  });

  return {
    totalTokensRouted,
    totalCostUsd: Math.round(totalCostUsd * 100000) / 100000,
    totalRequests: inMemoryLedgerEntries.length,
    computedFrom: "in_memory_aggregation",
    periodStart: earliestCreatedAt,
  };
}
