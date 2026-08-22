/**
 * src/pages/Capabilities.tsx
 *
 * New, separately-routed page. Hosts the business/technical capabilities
 * slide deck (WhyOr_Dispatch_Capabilities.pptx — built and QA'd
 * alongside this patch) plus an inline text summary, since a .pptx
 * download link alone gives search engines and no-JS visitors nothing
 * to index — the inline content is the crawlable substance, the deck is
 * the downloadable artifact for people already engaged.
 */
import React from "react";
import { usePageSEO } from "../lib/seo";
import { 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Database, 
  FileSpreadsheet, 
  Sparkles, 
  Zap, 
  Lock, 
  Activity, 
  FileDown, 
  ArrowRight,
  TrendingDown
} from "lucide-react";

interface CapabilityItem {
  name: string;
  category: string;
  detail: string;
  icon: React.ElementType;
  targetTab?: string;
  actionLabel?: string;
  tag: string;
}

const CAPABILITIES: CapabilityItem[] = [
  { 
    name: "Complexity-Based Thompson Routing", 
    category: "Adaptive Routing Core",
    detail: "Bayesian Thompson-sampling model selection calibrated across 14 task archetypes. Converges to within ±1% of ground truth after 300 test runs, dynamically routing between frontier models and low-cost execution engines.",
    icon: Cpu,
    targetTab: "dispatch",
    actionLabel: "Try Dynamic Routing",
    tag: "95.3% Cost Reduction"
  },
  { 
    name: "WhyOr Corroborate (Dual-Model Fact Verification)", 
    category: "Integrity & Hallucination Defense",
    detail: "Cross-model parallel fact verification comparing two distinct model architectures (e.g. OpenAI GPT-4o vs Anthropic Claude 3.7). Automatically calculates agreement scores and classifies divergence impact.",
    icon: ShieldCheck,
    targetTab: "workspace",
    actionLabel: "Run Corroborate Verification",
    tag: "Multi-Model Audit"
  },
  { 
    name: "WhyOr Relay (Sequential Multi-Stage Refinement)", 
    category: "Quality Amplification",
    detail: "Sequential synthesis pipeline (Drafter → Critic → Polisher) with built-in diminishing returns detection. Automatically halts execution when quality deltas fall below threshold, preventing wasteful token burn.",
    icon: Activity,
    targetTab: "workspace",
    actionLabel: "Launch Relay Synthesis",
    tag: "Early-Stop Heuristic"
  },
  { 
    name: "11-Format Deterministic Preprocessor", 
    category: "Token Reduction Engine",
    detail: "Deterministic zero-AI extraction across PDF, DOCX, XLSX, HTML, server logs, source code, email threads, JSON, and base64 payloads with safe fallbacks. Saves up to 99.2% of raw prompt tokens before model dispatch.",
    icon: Layers,
    targetTab: "examples",
    actionLabel: "View Token Savings Matrix",
    tag: "Zero-Cost Preprocessing"
  },
  { 
    name: "Portable SHA-256 Context Ledger", 
    category: "Cryptographic Memory",
    detail: "Hash-chained, tamper-evident fact ledger preserving entity constraints, decisions, and data tables across isolated chat sessions without resending monolithic transcripts.",
    icon: Database,
    targetTab: "ledger",
    actionLabel: "Inspect Context Ledger",
    tag: "Tamper-Evident State"
  },
  { 
    name: "In-Chat Semantic Compression", 
    category: "Conversational Optimization",
    detail: "Maintains recent dialog turns verbatim while compressing historical turns with three-tier safety guardrails (rejection of hallucinated placeholders, over-compression, or excessive truncation).",
    icon: TrendingDown,
    targetTab: "dispatch",
    actionLabel: "Test Live Chat Compression",
    tag: "62.5% Context Trim"
  },
  { 
    name: "Multi-Tenant Enterprise RBAC Governance", 
    category: "Security & Access",
    detail: "Four-persona permission matrix (Guest, Team Member, Company Admin, Platform SuperAdmin) with client and server-side role validation, department policy locks, and model catalog whitelisting.",
    icon: Lock,
    targetTab: "teams",
    actionLabel: "Configure Team Policies",
    tag: "Full RBAC Security"
  },
  { 
    name: "Hard Token & Cost Budget Enforcement", 
    category: "Financial Governance",
    detail: "Strict per-user and per-department spend quotas with real-time blocks upon exhaustion, preventing runaway agent loops and unbudgeted API overages.",
    icon: Sparkles,
    targetTab: "credentials",
    actionLabel: "Manage BYOK & Budgets",
    tag: "Zero Overages"
  },
  { 
    name: "Multi-Format Artifact Output Generator", 
    category: "Export & Delivery",
    detail: "Direct transformation of model completions into publication-ready PDF documents, interactive Excel workbooks (.xlsx), SVG architecture diagrams, and high-resolution images.",
    icon: FileSpreadsheet,
    targetTab: "dispatch",
    actionLabel: "Generate Artifacts",
    tag: "PDF / XLSX / Images"
  },
  { 
    name: "Self-Host Open-Weight Viability Advisor", 
    category: "Infrastructure Strategy",
    detail: "Calculates precise break-even thresholds comparing hosted API costs vs self-hosted open-weight deployments (vLLM on H100 / L40S) using live market GPU rental pricing.",
    icon: Zap,
    targetTab: "research",
    actionLabel: "Explore Market Architecture",
    tag: "GPU Break-Even Math"
  },
];

export default function Capabilities({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: string) => void;
} = {}) {
  usePageSEO({
    title: "Capabilities — Business & Technical Overview | WhyOr Dispatch",
    description: "Full business and technical capability overview for WhyOr Dispatch, including a downloadable slide deck covering routing, governance, and verified test results.",
    path: "/capabilities",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: "WhyOr Dispatch — Business & Technical Capabilities",
      url: "https://ai.whyor.in/capabilities",
    },
  });

  return (
    <div className="text-slate-100 antialiased selection:bg-orange-500 selection:text-white space-y-10">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-white/10 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
            <Layers className="w-3.5 h-3.5" /> Full Platform Surface
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Every capability shipped and verified — in one place.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            A comprehensive business and technical rundown of all 10 core systems, from Bayesian Thompson routing to cryptographic context ledgers — plus a downloadable slide deck for internal executive sharing.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="/WhyOr_Dispatch_Capabilities.pptx"
              download
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              Download Capabilities Deck (.pptx)
            </a>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('examples') : null}
              className="border border-white/15 hover:border-white/30 text-slate-200 text-sm px-5 py-3.5 rounded-xl cursor-pointer transition-all backdrop-blur-md flex items-center gap-2"
            >
              View Measured Payloads <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 10 Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CAPABILITIES.map((c, i) => {
          const Icon = c.icon;
          return (
            <div 
              key={c.name} 
              className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-7 shadow-xl hover:border-white/20 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-400/20 px-2.5 py-1 rounded-md">
                    {c.category}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                    {c.tag}
                  </span>
                </div>

                <div className="flex items-start gap-3 mt-2">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shrink-0 group-hover:border-amber-400/50 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white leading-snug">{c.name}</h2>
                  </div>
                </div>

                <p className="mt-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {c.detail}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  Capability #{i + 1 < 10 ? `0${i + 1}` : i + 1}
                </span>

                {c.targetTab && (
                  <button
                    onClick={() => onNavigateTab ? onNavigateTab(c.targetTab!) : null}
                    className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer group-hover:translate-x-1 transition-transform"
                  >
                    <span>{c.actionLabel || 'Explore'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
