import { UserPersona, UserRole } from '../types';

export type PageTabId = 
  | 'home' 
  | 'how-it-works' 
  | 'capabilities' 
  | 'examples' 
  | 'pricing' 
  | 'benchmarks'
  | 'docs'
  | 'faq'
  | 'contact' 
  | 'privacy'
  | 'terms'
  | 'research' 
  | 'dispatch' 
  | 'workspace' 
  | 'quality'
  | 'catalog' 
  | 'ledger' 
  | 'analytics' 
  | 'credentials' 
  | 'teams' 
  | 'admin';

export type ActionCapability = 
  | 'view_marketing'
  | 'view_dispatch_console'
  | 'submit_dispatch'
  | 'dispatch_prompt'
  | 'simulate_failure'
  | 'view_workspace'
  | 'submit_workspace_message'
  | 'select_model_manually'
  | 'select_engine_manually'
  | 'view_model_catalog'
  | 'manage_model_catalog'
  | 'view_context_ledger'
  | 'manage_context_ledger'
  | 'view_analytics'
  | 'view_credentials'
  | 'manage_credentials'
  | 'view_team_governance'
  | 'manage_team_members'
  | 'manage_team_budgets'
  | 'view_admin_console'
  | 'manage_admin_settings'
  | 'send_smtp_test'
  | 'view_audit_logs';

export interface RolePermissionSpec {
  role: UserRole;
  label: string;
  badgeColor: string;
  description: string;
  allowedPages: PageTabId[];
  allowedCapabilities: ActionCapability[];
  submissionRules: {
    canDispatch: boolean;
    dispatchNotice?: string;
    canManageBYOK: boolean;
    canManageTeam: boolean;
    canAccessSuperAdmin: boolean;
  };
}

export const ROLE_DEFINITIONS: Record<UserRole, RolePermissionSpec> = {
  guest: {
    role: 'guest',
    label: 'Guest Visitor',
    badgeColor: 'bg-slate-700/60 text-slate-300 border-white/10',
    description: 'Unauthenticated public visitor exploring features, architecture, and pricing in view-only mode.',
    allowedPages: ['home', 'how-it-works', 'capabilities', 'examples', 'pricing', 'benchmarks', 'docs', 'faq', 'contact', 'privacy', 'terms', 'research', 'dispatch', 'workspace', 'quality', 'catalog', 'ledger', 'analytics', 'credentials'],
    allowedCapabilities: [
      'view_marketing',
      'view_dispatch_console',
      'view_workspace',
      'view_model_catalog',
      'view_analytics',
      'view_context_ledger',
      'view_credentials',
    ],
    submissionRules: {
      canDispatch: false,
      dispatchNotice: 'Guest visitors have view-only access across all pages. Please sign in or start your 7-day free trial to execute requests.',
      canManageBYOK: false,
      canManageTeam: false,
      canAccessSuperAdmin: false,
    },
  },
  user: {
    role: 'user',
    label: 'Pro Developer',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    description: 'Authenticated pro engineer with personal quota, BYOK keys, and full dispatching.',
    allowedPages: ['home', 'how-it-works', 'capabilities', 'examples', 'pricing', 'benchmarks', 'docs', 'faq', 'contact', 'privacy', 'terms', 'research', 'dispatch', 'workspace', 'quality', 'catalog', 'ledger', 'analytics', 'credentials'],
    allowedCapabilities: [
      'view_marketing',
      'view_dispatch_console',
      'submit_dispatch',
      'view_workspace',
      'submit_workspace_message',
      'select_model_manually',
      'select_engine_manually',
      'view_model_catalog',
      'view_context_ledger',
      'manage_context_ledger',
      'view_analytics',
      'view_credentials',
      'manage_credentials',
    ],
    submissionRules: {
      canDispatch: true,
      canManageBYOK: true,
      canManageTeam: false,
      canAccessSuperAdmin: false,
    },
  },
  team_member: {
    role: 'team_member',
    label: 'Team Member',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    description: 'Enterprise developer operating under department budget caps and org model policies.',
    allowedPages: ['home', 'how-it-works', 'capabilities', 'examples', 'pricing', 'benchmarks', 'docs', 'faq', 'contact', 'privacy', 'terms', 'research', 'dispatch', 'workspace', 'quality', 'catalog', 'ledger', 'analytics', 'teams'],
    allowedCapabilities: [
      'view_marketing',
      'view_dispatch_console',
      'submit_dispatch',
      'view_workspace',
      'submit_workspace_message',
      'view_model_catalog',
      'view_context_ledger',
      'view_analytics',
      'view_team_governance',
    ],
    submissionRules: {
      canDispatch: true,
      canManageBYOK: false,
      canManageTeam: false,
      canAccessSuperAdmin: false,
    },
  },
  team_admin: {
    role: 'team_admin',
    label: 'Team Lead / Manager',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
    description: 'Team engineering lead with team member management and department quota controls.',
    allowedPages: ['home', 'how-it-works', 'capabilities', 'examples', 'pricing', 'benchmarks', 'docs', 'faq', 'contact', 'privacy', 'terms', 'research', 'dispatch', 'workspace', 'quality', 'catalog', 'ledger', 'analytics', 'credentials', 'teams'],
    allowedCapabilities: [
      'view_marketing',
      'view_dispatch_console',
      'submit_dispatch',
      'view_workspace',
      'submit_workspace_message',
      'select_model_manually',
      'select_engine_manually',
      'view_model_catalog',
      'view_context_ledger',
      'manage_context_ledger',
      'view_analytics',
      'view_credentials',
      'manage_credentials',
      'view_team_governance',
      'manage_team_members',
      'manage_team_budgets',
    ],
    submissionRules: {
      canDispatch: true,
      canManageBYOK: true,
      canManageTeam: true,
      canAccessSuperAdmin: false,
    },
  },
  corporate_admin: {
    role: 'corporate_admin',
    label: 'Corporate Admin',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    description: 'Company / Corporate administrator with full authority to provision teams, configure enterprise BYOK, set spend budgets, and invite engineers.',
    allowedPages: ['home', 'how-it-works', 'capabilities', 'examples', 'pricing', 'benchmarks', 'docs', 'faq', 'contact', 'privacy', 'terms', 'research', 'dispatch', 'workspace', 'quality', 'catalog', 'ledger', 'analytics', 'credentials', 'teams'],
    allowedCapabilities: [
      'view_marketing',
      'view_dispatch_console',
      'submit_dispatch',
      'view_workspace',
      'submit_workspace_message',
      'select_model_manually',
      'select_engine_manually',
      'view_model_catalog',
      'view_context_ledger',
      'manage_context_ledger',
      'view_analytics',
      'view_credentials',
      'manage_credentials',
      'view_team_governance',
      'manage_team_members',
      'manage_team_budgets',
    ],
    submissionRules: {
      canDispatch: true,
      canManageBYOK: true,
      canManageTeam: true,
      canAccessSuperAdmin: false,
    },
  },
  platform_admin: {
    role: 'platform_admin',
    label: 'Platform Superadmin',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
    description: 'Master platform administrator (solarastra.in@gmail.com) with root governance and global telemetry.',
    allowedPages: ['home', 'how-it-works', 'capabilities', 'examples', 'pricing', 'benchmarks', 'docs', 'faq', 'contact', 'privacy', 'terms', 'research', 'dispatch', 'workspace', 'quality', 'catalog', 'ledger', 'analytics', 'credentials', 'teams', 'admin'],
    allowedCapabilities: [
      'view_marketing',
      'view_dispatch_console',
      'submit_dispatch',
      'view_workspace',
      'submit_workspace_message',
      'select_model_manually',
      'select_engine_manually',
      'view_model_catalog',
      'manage_model_catalog',
      'view_context_ledger',
      'manage_context_ledger',
      'view_analytics',
      'view_credentials',
      'manage_credentials',
      'view_team_governance',
      'manage_team_members',
      'manage_team_budgets',
      'view_admin_console',
      'manage_admin_settings',
      'send_smtp_test',
      'view_audit_logs',
    ],
    submissionRules: {
      canDispatch: true,
      canManageBYOK: true,
      canManageTeam: true,
      canAccessSuperAdmin: true,
    },
  },
};

/**
 * Checks if a given persona/role is authorized to view a specific tab/page.
 */
export function canUserViewPage(tabId: string, persona: UserPersona, userEmail?: string | null): boolean {
  // Master SuperAdmin override for solarastra.in@gmail.com
  const isSuperEmail = (userEmail && userEmail.toLowerCase() === 'solarastra.in@gmail.com') || (persona.email.toLowerCase() === 'solarastra.in@gmail.com');
  if (isSuperEmail) return true;

  // SuperAdmin Console is strictly limited to superadmin
  if (tabId === 'admin') {
    return isSuperEmail || persona.role === 'platform_admin';
  }

  // Team & Governance is limited to team_member, team_admin, corporate_admin, platform_admin
  if (tabId === 'teams') {
    return persona.role === 'team_admin' || persona.role === 'corporate_admin' || persona.role === 'team_member' || persona.role === 'platform_admin' || !!persona.isCompanyAdmin;
  }

  // Workspace Studio requires authenticated status
  if (tabId === 'workspace') {
    return persona.role !== 'guest';
  }

  // Company BYOK Credentials
  if (tabId === 'credentials') {
    return persona.role !== 'guest';
  }

  const spec = ROLE_DEFINITIONS[persona.role];
  if (!spec) return true;
  return spec.allowedPages.includes(tabId as PageTabId);
}

/**
 * Checks if a given persona/role is permitted to execute a specific action/submission.
 */
export function canUserSubmitAction(action: ActionCapability, persona: UserPersona, userEmail?: string | null): boolean {
  const isSuperEmail = (userEmail && userEmail.toLowerCase() === 'solarastra.in@gmail.com') || (persona.email.toLowerCase() === 'solarastra.in@gmail.com');
  if (isSuperEmail) return true;

  const spec = ROLE_DEFINITIONS[persona.role];
  if (!spec) return false;

  // Specific action overrides
  if (action === 'dispatch_prompt' || action === 'submit_dispatch') {
    return spec.submissionRules.canDispatch;
  }

  if (action === 'simulate_failure') {
    return persona.role !== 'guest';
  }

  if (action === 'manage_credentials') {
    return spec.submissionRules.canManageBYOK;
  }

  if (action === 'manage_team_members' || action === 'manage_team_budgets') {
    return spec.submissionRules.canManageTeam;
  }

  if (action === 'manage_admin_settings' || action === 'send_smtp_test' || action === 'view_admin_console') {
    return spec.submissionRules.canAccessSuperAdmin;
  }

  return spec.allowedCapabilities.includes(action);
}

/**
 * Get human-readable access restriction explanation
 */
export function getAccessRestrictionReason(tabId: string, role: UserRole): {
  title: string;
  message: string;
  requiredRole: string;
  suggestedAction: 'sign_in' | 'upgrade_team' | 'contact_admin' | 'switch_persona';
} {
  if (tabId === 'admin') {
    return {
      title: 'SuperAdmin Console Access Denied',
      message: 'The SuperAdmin Console is strictly restricted to platform superadministrators (solarastra.in@gmail.com). You cannot access system configuration or audit trails with your current credentials.',
      requiredRole: 'Platform Superadmin',
      suggestedAction: 'switch_persona',
    };
  }

  if (tabId === 'teams') {
    return {
      title: 'Team & Governance Restricted',
      message: 'Team & Governance dashboards are available only to enterprise team members and company administrators. As a visitor or solo developer, you must join or provision an enterprise team to view department policy controls.',
      requiredRole: 'Team Member / Company Admin',
      suggestedAction: 'upgrade_team',
    };
  }

  if (tabId === 'workspace') {
    return {
      title: 'Workspace Studio Authentication Required',
      message: 'Workspace Studio multi-turn context execution and file analysis requires an active account or trial session.',
      requiredRole: 'Pro Developer / Team Member',
      suggestedAction: 'sign_in',
    };
  }

  if (tabId === 'credentials') {
    return {
      title: 'BYOK Credentials Authentication Required',
      message: 'Managing personal or company provider API keys and CLI proxy tunnels requires an authenticated account.',
      requiredRole: 'Pro Developer / Company Admin',
      suggestedAction: 'sign_in',
    };
  }

  return {
    title: 'Access Restricted',
    message: 'This area is restricted based on your current role and permissions.',
    requiredRole: 'Authenticated User',
    suggestedAction: 'sign_in',
  };
}
