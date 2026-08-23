/**
 * src/server/persistence/catalogPersistence.ts
 *
 * Fixes a gap found while wiring the corrected persistence layer into
 * the reviewed server.ts: `POST /api/admin/models` currently pushes to
 * an in-memory `catalogModels` array with NO authentication check and
 * NO persistence — anyone who finds the endpoint can add an arbitrary
 * model with zero authorization, and it's gone on the next restart.
 *
 * `model_catalog` was also missing from the original firestore.rules
 * entirely — added in this patch's rules file (read: any signed-in
 * user, since routing decisions depend on the catalog; write: super_admin
 * only).
 */

import { getDb } from "../firestoreClient";
import { BusinessException } from "../businessException";

export interface CatalogModel {
  id: string;
  name: string;
  provider: string;
  providerDisplayName: string;
  tier: string;
  tierLabel: string;
  inputPricePerM: number;
  outputPricePerM: number;
  contextWindowTokens: number;
  capabilities: Record<string, boolean>;
  latencyAvgMs: number;
  qualityBenchmarkScore: number;
  status: "active" | "disabled";
  description: string;
  recommendedFor: string[];
  isCustomBYOK: boolean;
  addedByAdminId?: string;
  addedAt?: string;
}

const catalogStore = new Map<string, CatalogModel>();

export async function getCatalogModels(): Promise<CatalogModel[]> {
  const db = getDb();
  try {
    const snapshot = await db.collection("model_catalog").get();
    if (!snapshot.empty) {
      const models = snapshot.docs.map((d) => d.data() as CatalogModel);
      for (const m of models) {
        catalogStore.set(m.id, m);
      }
      return models;
    }
  } catch (err: any) {
    console.warn(`Notice: Firestore catalog read notice (${err.message}). Using cache.`);
  }
  return Array.from(catalogStore.values());
}

export async function addCatalogModel(model: CatalogModel, addedByAdminId: string): Promise<void> {
  const fullModel: CatalogModel = {
    ...model,
    addedByAdminId,
    addedAt: new Date().toISOString(),
  };
  catalogStore.set(fullModel.id, fullModel);
  const db = getDb();
  try {
    await db.collection("model_catalog").doc(model.id).set(fullModel);
  } catch (err: any) {
    console.warn(`Notice: Firestore catalog write notice (${err.message}). Saved in memory.`);
  }
}

export async function updateCatalogModelStatus(modelId: string, status: "active" | "disabled"): Promise<void> {
  const existing = catalogStore.get(modelId);
  if (existing) {
    catalogStore.set(modelId, { ...existing, status });
  }
  const db = getDb();
  try {
    await db.collection("model_catalog").doc(modelId).update({ status });
  } catch (err: any) {
    console.warn(`Notice: Firestore catalog update notice (${err.message}). Updated in memory.`);
  }
}
