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

export async function getCatalogModels(): Promise<CatalogModel[]> {
  const db = getDb();
  const snapshot = await db.collection("model_catalog").get();
  return snapshot.docs.map((d) => d.data() as CatalogModel);
}

export async function addCatalogModel(model: CatalogModel, addedByAdminId: string): Promise<void> {
  const db = getDb();
  try {
    await db.collection("model_catalog").doc(model.id).set({
      ...model, addedByAdminId, addedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_WRITE_FAILED", `Failed to add catalog model '${model.id}': ${err.message}`, 500);
  }
}

export async function updateCatalogModelStatus(modelId: string, status: "active" | "disabled"): Promise<void> {
  const db = getDb();
  try {
    await db.collection("model_catalog").doc(modelId).update({ status });
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_WRITE_FAILED", `Failed to update catalog model '${modelId}': ${err.message}`, 500);
  }
}
