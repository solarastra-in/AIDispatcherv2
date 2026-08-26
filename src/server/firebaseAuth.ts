import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { Request, Response, NextFunction } from "express";

let app: App | null = null;

function ensureInitialized(): App | null {
  if (app) return app;
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return app;
  } catch (err) {
    console.warn("Failed to initialize Firebase Admin:", err);
    return null;
  }
}

export interface VerifiedIdentity {
  email: string;
  uid: string;
  emailVerified: boolean;
}

type TokenVerifier = (idToken: string) => Promise<{ email?: string; uid: string; email_verified?: boolean }>;

function defaultVerifier(idToken: string) {
  const initializedApp = ensureInitialized();
  if (!initializedApp) {
    throw new Error("Firebase Admin not configured");
  }
  return getAuth(initializedApp).verifyIdToken(idToken);
}

export async function verifyFirebaseIdToken(
  idToken: string | undefined | null,
  verifier: TokenVerifier = defaultVerifier
): Promise<VerifiedIdentity | null> {
  if (!idToken) return null;

  try {
    const decoded = await verifier(idToken);
    if (!decoded.email) return null;
    if (decoded.email_verified === false) return null;
    return { email: decoded.email, uid: decoded.uid, emailVerified: true };
  } catch {
    return null;
  }
}

export async function firebaseAuthMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  
  const headerEmail = (req.headers["x-user-email"] || req.headers["x-email"] || req.headers["x-auth-email"]) as string | undefined;
  const bodyEmail = (req.body && typeof req.body === 'object') ? (req.body.email || req.body.userEmail || req.body.actorEmail) : undefined;
  const queryEmail = req.query?.userEmail as string | undefined;

  let email: string | null = null;
  if (token) {
    const identity = await verifyFirebaseIdToken(token);
    if (identity?.email) {
      email = identity.email;
    }
  }

  if (!email && headerEmail) {
    email = headerEmail;
  }
  if (!email && bodyEmail && typeof bodyEmail === 'string') {
    email = bodyEmail;
  }
  if (!email && queryEmail && typeof queryEmail === 'string') {
    email = queryEmail;
  }

  (req as any).authenticatedEmail = email;
  next();
}
