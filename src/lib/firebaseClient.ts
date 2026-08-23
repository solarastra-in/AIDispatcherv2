import { auth, signInWithGoogle as originalSignInWithGoogle, signOutUser, onAuthChanged } from "./firebase";
import type { User } from "firebase/auth";

export { auth };

export async function signInWithGoogle(): Promise<User> {
  const result = await originalSignInWithGoogle();
  return result.user;
}

export async function signOut(): Promise<void> {
  await signOutUser();
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthChanged(callback);
}

export async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getIdToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // If user is currently signed in via Firebase, set email header
  if (auth.currentUser?.email) {
    headers.set("x-user-email", auth.currentUser.email);
    headers.set("x-auth-method", "google");
  } else {
    // Check if user completed email registration trial
    try {
      const raw = localStorage.getItem("whyor_trial_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email && (parsed?.emailVerified || parsed?.isTrialActive)) {
          headers.set("x-user-email", parsed.email);
          headers.set("x-user-uid", parsed.uid || "");
          headers.set("x-auth-method", parsed.authMethod || "registration");
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...options, headers });
}

export async function safeFetchJson<T = any>(url: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  try {
    const res = await authedFetch(url, options);
    const contentType = res.headers.get("content-type") || "";
    let data: any = {};
    
    if (contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch (err: any) {
        data = { error: "Failed to parse JSON response" };
      }
    } else {
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text.length > 200 ? `HTTP ${res.status}: ${res.statusText || 'Server Error'}` : text || `HTTP ${res.status}` };
      }
    }

    return {
      ok: res.ok,
      status: res.status,
      data: data as T,
      error: !res.ok ? (data?.error || data?.message || `Request failed with status ${res.status}`) : undefined,
    };
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      data: {} as T,
      error: netErr.message || "Network error. Please check connection.",
    };
  }
}

