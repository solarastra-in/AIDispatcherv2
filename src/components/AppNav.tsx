/**
 * src/components/AppNav.tsx (v2 — replaces the version from patch 0014)
 *
 * Adds How It Works, Capabilities, and Examples — the three new marketing
 * pages built in this patch — as always-visible links (view_marketing is
 * true for every persona including Guest, matching the request that a
 * visitor "shall be available to view home page, marketing pages"). The
 * gated links (Workspace, Team/Governance, Admin Console) are unchanged
 * from the previous version.
 */
import { RequireCapability } from "./RequireCapability";
import GoogleSignInButton from "./GoogleSignInButton";

const MARKETING_LINKS = [
  { path: "/how-it-works", label: "How it works" },
  { path: "/capabilities", label: "Capabilities" },
  { path: "/examples", label: "Examples" },
  { path: "/benchmarks", label: "Benchmarks" },
  { path: "/docs", label: "Docs" },
  { path: "/pricing", label: "Pricing" },
  { path: "/faq", label: "FAQ" },
];

export default function AppNav({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <nav className="h-14 border-b border-[#2A2F38] flex items-center justify-between px-5 bg-[#0F1216]">
      <div className="flex items-center gap-1">
        <button onClick={() => onNavigate("/")} className="text-sm font-semibold px-3 py-1.5 text-[#E7E9EC]">
          WhyOr Dispatch
        </button>

        {MARKETING_LINKS.map((link) => (
          <button key={link.path} onClick={() => onNavigate(link.path)} className="text-xs px-3 py-1.5 text-[#93999F] hover:text-[#E7E9EC]">
            {link.label}
          </button>
        ))}

        <RequireCapability capability="view_workspace">
          <button onClick={() => onNavigate("/workspace")} className="text-xs px-3 py-1.5 text-[#93999F] hover:text-[#E7E9EC]">
            Workspace
          </button>
        </RequireCapability>

        <RequireCapability capability="view_company_console">
          <button onClick={() => onNavigate("/company/team")} className="text-xs px-3 py-1.5 text-[#93999F] hover:text-[#E7E9EC]">
            Team
          </button>
          <button onClick={() => onNavigate("/company/governance")} className="text-xs px-3 py-1.5 text-[#93999F] hover:text-[#E7E9EC]">
            Governance
          </button>
        </RequireCapability>

        <RequireCapability capability="view_platform_console">
          <button onClick={() => onNavigate("/admin")} className="text-xs px-3 py-1.5 text-[#93999F] hover:text-[#E7E9EC]">
            Admin Console
          </button>
        </RequireCapability>
      </div>

      <GoogleSignInButton />
    </nav>
  );
}
