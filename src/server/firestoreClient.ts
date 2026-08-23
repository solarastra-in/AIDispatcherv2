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

  const existing = getApps();
  const app = existing.length > 0
    ? existing[0]
    : (() => {
        let projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

        if (!projectId) {
          try {
            const configPath = path.join(process.cwd(), "firebase-applet-config.json");
            if (fs.existsSync(configPath)) {
              const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
              projectId = cfg.projectId;
            }
          } catch (e) {
            // ignore
          }
        }

        if (projectId && clientEmail && privateKey) {
          return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
        }

        if (projectId) {
          return initializeApp({ projectId });
        }

        // Business exception, not a silent fallback to in-memory state —
        // this is exactly the failure mode the request called out: if
        // Firestore isn't configured, callers must find out immediately
        // via a real error, not have their data silently go nowhere.
        throw new BusinessException(
          "FIRESTORE_WRITE_FAILED",
          "Firestore is not configured — FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY must all be set as environment variables before any persisted data can be read or written.",
          500
        );
      })();

  firestoreInstance = getFirestore(app);
  return firestoreInstance;
}
