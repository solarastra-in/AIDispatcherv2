/**
 * src/components/RequireCapability.tsx
 *
 * Replaces AdminConsoleGate.tsx (built earlier) with a general-purpose
 * version driven by the full permission matrix — same "render nothing
 * until the server confirms" principle (the server is the actual
 * authority; this never trusts client-side state alone), extended to
 * every capability in permissions.ts, not just the two admin-console
 * checks AdminConsoleGate.tsx originally had.
 */
import { useEffect, useState, type ReactNode } from "react";
import { authedFetch } from "../lib/firebaseClient";

export type Capability =
  | "view_marketing" | "view_workspace" | "submit_dispatch" | "select_model"
  | "view_company_console" | "manage_credentials" | "manage_budgets"
  | "manage_team_models" | "manage_employees" | "view_platform_console" | "manage_companies";

interface CapabilitiesResponse {
  persona: string;
  capabilities: Record<Capability, boolean>;
}

let cachedCapabilities: CapabilitiesResponse | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000; // short cache — avoids a capability check per component mount on a page with many gated sections, while staying fresh enough that a role change (e.g. a company admin revoking a privilege) takes effect within 30s, not requiring a full page reload

async function fetchCapabilities(): Promise<CapabilitiesResponse> {
  if (cachedCapabilities && Date.now() - cachedAt < CACHE_TTL_MS) return cachedCapabilities;
  const res = await authedFetch("/api/permissions");
  const data = await res.json();
  cachedCapabilities = data;
  cachedAt = Date.now();
  return data;
}

/** Call after any action that might change the caller's own permissions
 * (e.g. a company admin just granted themselves — or was granted —
 * a new privilege) so the next gate check doesn't serve stale cache. */
export function invalidateCapabilitiesCache(): void {
  cachedCapabilities = null;
}

export function RequireCapability({
  capability,
  fallback = null,
  children,
}: {
  capability: Capability;
  fallback?: ReactNode; // what to render when NOT permitted — defaults to nothing (true "not visible"), pass a fallback for e.g. showing a nav link disabled instead of hidden, where that's the intended UX
  children: ReactNode;
}) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCapabilities()
      .then((data) => { if (!cancelled) setAllowed(!!data.capabilities[capability]); })
      .catch(() => { if (!cancelled) setAllowed(false); }); // a failed permission check defaults to NOT permitted, never to permitted
    return () => { cancelled = true; };
  }, [capability]);

  if (allowed === null) return null; // render nothing while checking — never flash gated content then hide it
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}

/** Hook form, for logic that needs the boolean directly rather than
 * wrapping JSX — e.g. disabling a button vs. hiding a whole section. */
export function useCapability(capability: Capability): boolean | null {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchCapabilities()
      .then((data) => { if (!cancelled) setAllowed(!!data.capabilities[capability]); })
      .catch(() => { if (!cancelled) setAllowed(false); });
    return () => { cancelled = true; };
  }, [capability]);
  return allowed;
}
