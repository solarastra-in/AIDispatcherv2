/**
 * src/server/permissions.ts
 *
 * Single source of truth for "who can do what," across every page,
 * button, and endpoint in the app. Everything else (frontend route
 * gates, nav rendering, backend endpoint guards) reads from this one
 * table — there should never be a second place that decides whether a
 * persona can see the Admin Console or submit a dispatch.
 *
 * Four personas, not three — this patch adds GUEST as a first-class
 * persona rather than treating "no user found" as an implicit fallback.
 * That distinction is exactly what closes the real gap found while
 * building this: several existing endpoints only checked permissions
 * `if (requester)`, which meant an unauthenticated caller (requester ===
 * undefined) skipped the check entirely instead of being blocked.
 * Making GUEST explicit means "no capability for this persona" reads as
 * a real, visible row in the table below, not a silent gap.
 */

import { getUserByEmail, type UserAccount } from "./orgModel";
import { isSuperAdminEmail } from "./authGate";

export type Persona = "guest" | "team_member" | "company_admin" | "super_admin";

export type Capability =
  | "view_marketing"          // Home page — public marketing site
  | "view_workspace"          // the chat/dispatch app itself
  | "submit_dispatch"         // actually send a request (normal, Corroborate, or Relay)
  | "select_model"            // manually override auto-routing (further gated by the per-user canSelectModel privilege on top of this)
  | "view_company_console"    // Team, Governance, budgets, credentials pages
  | "manage_credentials"      // add/remove provider API keys or local proxies
  | "manage_budgets"          // set user/team token & cost limits
  | "manage_team_models"      // restrict a team to an approved model list
  | "manage_employees"        // seed employees, set their privileges
  | "view_platform_console"   // the super-admin console — company onboarding, platform-wide payments/usage
  | "manage_companies";       // onboard a company, assign its first company admin

// The full matrix — every persona, every capability, explicit true/false.
// Reading this table top to bottom IS the access policy; nothing should
// contradict it elsewhere.
const MATRIX: Record<Persona, Record<Capability, boolean>> = {
  guest: {
    view_marketing: true,
    view_workspace: false,
    submit_dispatch: false,
    select_model: false,
    view_company_console: false,
    manage_credentials: false,
    manage_budgets: false,
    manage_team_models: false,
    manage_employees: false,
    view_platform_console: false,
    manage_companies: false,
  },
  team_member: {
    view_marketing: true,
    view_workspace: true,
    submit_dispatch: true,
    select_model: true, // narrowed further by the per-user canSelectModel privilege — see resolveCapabilities()
    view_company_console: false,
    manage_credentials: false,
    manage_budgets: false,
    manage_team_models: false,
    manage_employees: false,
    view_platform_console: false,
    manage_companies: false,
  },
  company_admin: {
    view_marketing: true,
    view_workspace: true,
    submit_dispatch: true,
    select_model: true,
    view_company_console: true,
    manage_credentials: true,
    manage_budgets: true,
    manage_team_models: true,
    manage_employees: true,
    view_platform_console: false, // scoped to their own company only — never platform-wide
    manage_companies: false,
  },
  super_admin: {
    view_marketing: true,
    view_workspace: true,
    submit_dispatch: true,
    select_model: true,
    view_company_console: true, // can see into any company's console for support purposes
    manage_credentials: true,
    manage_budgets: true,
    manage_team_models: true,
    manage_employees: true,
    view_platform_console: true,
    manage_companies: true,
  },
};

export interface ResolvedCapabilities {
  persona: Persona;
  userId: string | null;
  companyId: string | null;
  teamId: string | null;
  capabilities: Record<Capability, boolean>;
}

/**
 * The one function everything else calls. Takes a verified email (or
 * null for an unauthenticated request — never trust anything else as
 * "authenticated") and returns the full resolved capability set.
 */
export function resolvePersona(email: string | null): { persona: Persona; user: UserAccount | undefined } {
  if (!email) return { persona: "guest", user: undefined };
  if (isSuperAdminEmail(email)) return { persona: "super_admin", user: getUserByEmail(email) };

  const user = getUserByEmail(email);
  if (!user) return { persona: "guest", user: undefined }; // a verified email with no matching account is still treated as guest, not silently upgraded
  if (user.role === "company_admin") return { persona: "company_admin", user };
  return { persona: "team_member", user };
}

export function resolveCapabilities(email: string | null): ResolvedCapabilities {
  const { persona, user } = resolvePersona(email);
  const capabilities = { ...MATRIX[persona] };

  // Narrow select_model further by the per-employee privilege a company
  // admin grants — a team_member persona can select_model per the base
  // matrix, but only if THIS specific user has been granted it.
  if (persona === "team_member" && user && !user.privileges.canSelectModel) {
    capabilities.select_model = false;
  }

  return {
    persona, userId: user?.id ?? null, companyId: user?.companyId ?? null, teamId: user?.teamId ?? null,
    capabilities,
  };
}

export function requireCapability(email: string | null, capability: Capability): { allowed: boolean; persona: Persona; reason: string | null } {
  const resolved = resolveCapabilities(email);
  const allowed = resolved.capabilities[capability];
  return {
    allowed, persona: resolved.persona,
    reason: allowed ? null : `Persona '${resolved.persona}' does not have '${capability}' — sign in required, or your account doesn't have this privilege.`,
  };
}
