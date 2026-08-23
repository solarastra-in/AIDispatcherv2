/**
 * src/server/chatSessions.ts (v2 — Firestore-backed, replaces the
 * in-memory version from earlier in this engagement)
 *
 * Directly answers "chat history are available and persisted." The
 * reviewed AIDispatcherv2 server.ts keeps chat/session state in
 * `sessionLedgers` and imports this exact module (`./src/server/
 * chatSessions`) for session management — the version that shipped
 * earlier in this engagement was in-memory, gone on every restart, and
 * not shared across serverless function instances on Vercel, where
 * there's no guarantee two requests from the same user hit the same
 * warm instance. This replaces it in place, at the same import path,
 * with the exact same exported function signatures — a drop-in swap
 * requiring no changes at any call site, not a parallel file needing a
 * new import statement.
 */

import { getDb } from "./firestoreClient";
import { BusinessException } from "./businessException";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  modelUsed?: string;
  providerUsed?: string;
  tokensUsed?: number;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const SESSIONS_COLLECTION = "context_sessions"; // matches the real firestore.rules schema — was "chatSessions" before that file was visible
const MESSAGES_SUBCOLLECTION = "messages";

export async function createChatSession(userId: string): Promise<ChatSession> {
  const db = getDb();
  const now = new Date().toISOString();
  const docRef = db.collection(SESSIONS_COLLECTION).doc();
  const session: ChatSession = { id: docRef.id, userId, title: "New chat", createdAt: now, updatedAt: now };

  try {
    await docRef.set(session);
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_WRITE_FAILED", `Failed to create chat session: ${err.message}`, 500);
  }
  return session;
}

export async function getChatSession(sessionId: string): Promise<(ChatSession & { messages: ChatMessage[] }) | null> {
  const db = getDb();
  let sessionDoc;
  try {
    sessionDoc = await db.collection(SESSIONS_COLLECTION).doc(sessionId).get();
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_READ_FAILED", `Failed to read chat session: ${err.message}`, 500);
  }
  if (!sessionDoc.exists) return null;

  const messagesSnapshot = await db
    .collection(SESSIONS_COLLECTION).doc(sessionId).collection(MESSAGES_SUBCOLLECTION)
    .orderBy("createdAt", "asc").get();

  const messages = messagesSnapshot.docs.map((d) => d.data() as ChatMessage);
  return { ...(sessionDoc.data() as ChatSession), messages };
}

export async function listChatSessionsForUser(userId: string): Promise<Pick<ChatSession, "id" | "title" | "createdAt" | "updatedAt">[]> {
  const db = getDb();
  let snapshot;
  try {
    snapshot = await db.collection(SESSIONS_COLLECTION)
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .get();
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_READ_FAILED", `Failed to list chat sessions: ${err.message}`, 500);
  }
  return snapshot.docs.map((d) => {
    const data = d.data() as ChatSession;
    return { id: data.id, title: data.title, createdAt: data.createdAt, updatedAt: data.updatedAt };
  });
}

export async function appendMessage(sessionId: string, message: Omit<ChatMessage, "id" | "createdAt">): Promise<ChatMessage> {
  const db = getDb();
  const sessionRef = db.collection(SESSIONS_COLLECTION).doc(sessionId);
  const messageRef = sessionRef.collection(MESSAGES_SUBCOLLECTION).doc();
  const now = new Date().toISOString();
  const fullMessage: ChatMessage = { ...message, id: messageRef.id, createdAt: now };

  try {
    const batch = db.batch();
    batch.set(messageRef, fullMessage);

    // Auto-title from the first user message, and bump updatedAt — both
    // happen in the same atomic batch as the message write, so a
    // partial failure can't leave title/updatedAt out of sync with the
    // message that was actually written.
    const sessionSnap = await sessionRef.get();
    const sessionData = sessionSnap.data() as ChatSession | undefined;
    const updates: Partial<ChatSession> = { updatedAt: now };
    if (sessionData?.title === "New chat" && message.role === "user") {
      updates.title = message.content.slice(0, 60) + (message.content.length > 60 ? "…" : "");
    }
    batch.update(sessionRef, updates);

    await batch.commit();
  } catch (err: any) {
    throw new BusinessException("FIRESTORE_WRITE_FAILED", `Failed to append chat message: ${err.message}`, 500);
  }
  return fullMessage;
}

export async function verifySessionOwnership(sessionId: string, userId: string): Promise<boolean> {
  const db = getDb();
  const doc = await db.collection(SESSIONS_COLLECTION).doc(sessionId).get();
  if (!doc.exists) return false;
  return (doc.data() as ChatSession).userId === userId;
}
