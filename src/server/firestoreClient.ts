/**
 * src/server/firestoreClient.ts
 *
 * Shared Firestore handle for every persistence module in this patch.
 * Reuses firebaseAuth.ts's existing Firebase Admin app initialization
 * (same credentials, one app instance) rather than initializing a
 * second one — matches the modular firebase-admin API already
 * established as correct earlier in this engagement (v14+ uses
 * `firebase-admin/app` / `firebase-admin/firestore`, not the legacy
 * `admin.firestore()` namespace pattern — verified against the actual
 * installed package version then, reused here rather than re-guessed).
 */

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { BusinessException } from "./businessException";
import fs from "fs";
import path from "path";

let firestoreInstance: Firestore | null = null;

export function getDb(): Firestore {
  if (firestoreInstance) return firestoreInstance;

  let projectId = process.env.FIREBASE_PROJECT_ID;
  let databaseId = process.env.FIRESTORE_DATABASE_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (!projectId && cfg.projectId) projectId = cfg.projectId;
      if (!databaseId && cfg.firestoreDatabaseId) databaseId = cfg.firestoreDatabaseId;
    }
  } catch (e) {
    // ignore
  }

  if (!databaseId) {
    databaseId = "ai-studio-whyordispatchair-f52d9846-7a46-467a-8fdf-1329e39c74f7";
  }

  const existing = getApps();
  const app = existing.length > 0
    ? existing[0]
    : (() => {
        if (projectId && clientEmail && privateKey) {
          return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
        }

        if (projectId) {
          return initializeApp({ projectId });
        }

        return initializeApp();
      })();

  if (databaseId) {
    firestoreInstance = getFirestore(app, databaseId);
  } else {
    firestoreInstance = getFirestore(app);
  }

  return firestoreInstance;
}
