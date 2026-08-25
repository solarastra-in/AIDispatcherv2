/**
 * src/pages/DocumentationPage.tsx
 *
 * Developer Documentation, SDK Integration Guides & 14-Endpoint API Reference
 * Full indexable documentation for search crawlers & developers.
 */

import React, { useState } from 'react';
import { usePageSEO } from '../lib/seo';
import { 
  Code2, 
  Terminal, 
  Zap, 
  BookOpen, 
  Cpu, 
  ShieldCheck, 
  Copy, 
  Check, 
  Layers, 
  ArrowRight, 
  Sparkles, 
  ExternalLink,
  Lock,
  Search,
  ChevronRight,
  Server
} from 'lucide-react';

interface DocEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  category: string;
  summary: string;
  description: string;
  sampleRequest?: string;
  sampleResponse?: string;
}

const ENDPOINTS_CATALOG: DocEndpoint[] = [
  {
    method: 'POST',
    path: '/api/v1/dispatch',
    category: 'Core Dispatch Engine',
    summary: 'OpenAI-compatible intelligent multi-model dispatch proxy',
    description: 'Accepts standard chat completion prompts, scores semantic complexity, samples Thompson Beta(α,β) distributions, and routes to the cheapest verified model.',
    sampleRequest: `curl -X POST https://ai.whyor.in/api/v1/dispatch \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_WHYT_API_KEY" \\
  -d '{
    "prompt": "Refactor this SQL query for PostgreSQL 16 with indexed joins",
    "temperature": 0.2,
    "qualityThreshold": 0.85,
    "stream": false
  }'`,
    sampleResponse: `{
  "success": true,
  "routedModel": "gemini-2.5-pro",
  "archetype": "code_refactoring",
  "costUsd": 0.00042,
  "tokensSaved": 412,
  "completion": "EXPLAIN ANALYZE SELECT ...",
  "latencyMs": 340
}`,
  },
  {
    method: 'GET',
    path: '/api/models',
    category: 'Catalog & Telemetry',
    summary: 'List all verified models with live pricing & latency metrics',
    description: 'Returns real-time provider catalog including input/output cost per million tokens, Thompson quality priors, and context window limits.',
    sampleResponse: `[
  {
    "id": "claude-3-7-sonnet",
    "name": "Claude 3.7 Sonnet (Hybrid Reasoning)",
    "provider": "Anthropic",
    "costPer1kInput": 0.003,
    "costPer1kOutput": 0.015,
    "thompsonPrior": { "alpha": 28.4, "beta": 1.2 }
  }
]`,
  },
  {
    method: 'POST',
    path: '/api/corroborate',
    category: 'Integrity & Verification',
    summary: 'Dual-Model Parallel Fact Verification (WhyOr Corroborate)',
    description: 'Dispatches query to two divergent model architectures in parallel, computing semantic agreement vectors and highlighting hallucination deltas.',
    sampleRequest: `curl -X POST https://ai.whyor.in/api/corroborate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_WHYT_API_KEY" \\
  -d '{
    "prompt": "Verify the tax compliance rules for Section 179 deductions in 2026",
    "primaryModel": "gpt-4o",
    "secondaryModel": "claude-3-7-sonnet"
  }'`,
  },
  {
    method: 'POST',
    path: '/api/relay',
    category: 'Sequential Refinement',
    summary: 'Multi-Stage Relay (Drafter → Critic → Polisher) with Diminishing Returns',
    description: 'Sequentially amplifies response quality across specialized models and automatically terminates early when delta thresholds are met.',
  },
  {
    method: 'GET',
    path: '/api/ledger',
    category: 'Context Memory',
    summary: 'Retrieve immutable SHA-256 context ledger entries',
    description: 'Inspect extracted entity graphs, conversational state constraints, and verifiable token savings certificates.',
  },
];

export default function DocumentationPage({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: string) => void;
} = {}) {
  usePageSEO({
    tabKey: 'docs',
    path: '/docs',
  });

  const [activeLang, setActiveLang] = useState<'typescript' | 'python' | 'curl'>('typescript');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<DocEndpoint>(ENDPOINTS_CATALOG[0]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const CODE_EXAMPLES = {
    typescript: `import { WhyOrDispatchClient } from '@whyor/dispatch-sdk';

const client = new WhyOrDispatchClient({
  apiKey: process.env.WHYT_API_KEY,
  // Optional: Auto-fallback to local CLI subscription proxy
  enableLocalCliProxy: true,
});

async function main() {
  const response = await client.dispatch({
    prompt: "Write a high-performance LRU Cache in TypeScript with O(1) ops",
    // Quality bar between 0.0 and 1.0 (Thompson sampler picks cheapest matching model)
    qualityThreshold: 0.88,
    preferLowestCost: true,
  });

  console.log('⚡ Routed Model:', response.routedModel);
  console.log('💰 Cost:', response.costUsd, 'USD');
  console.log('📝 Completion:', response.text);
}

main();`,
    python: `from whyor_dispatch import DispatchClient
import os

client = DispatchClient(api_key=os.getenv("WHYT_API_KEY"))

# Drop-in multi-model intelligent routing
response = client.dispatch(
    prompt="Summarize the key SEC 10-K filing risks for Q3 2026",
    quality_threshold=0.85,
    max_tokens=2048,
    temperature=0.3
)

print(f"Routed to: {response.routed_model}")
print(f"Tokens Saved: {response.tokens_saved}")
print(response.completion)`,
    curl: `curl -X POST https://ai.whyor.in/api/v1/dispatch \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "prompt": "Explain the zero-knowledge SNARK proof verification pipeline in simple terms",
    "qualityThreshold": 0.85,
    "temperature": 0.4
  }'`,
  };

  const filteredEndpoints = ENDPOINTS_CATALOG.filter(
    (ep) =>
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="text-slate-100 antialiased space-y-12 pb-16">
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-[#0b0f19] border border-white/10 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono">
            <BookOpen className="w-3.5 h-3.5" /> API Reference & Quickstart v1.4
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-white">
            Developer Documentation & SDK Reference
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Integrate WhyOr's intelligent multi-model router in minutes. Replace hardcoded model endpoints with a single OpenAI-compatible API that cuts token costs by up to 95% while dynamically maintaining output accuracy.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigateTab?.('pricing')}
              className="px-5 py-2.5 rounded-xl bg-orange-500 text-slate-950 font-bold text-sm hover:bg-orange-400 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              Get Free API Key <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab?.('dispatch')}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-sm hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" /> Interactive Console
            </button>
          </div>
        </div>
      </header>

      {/* 3-Step Quickstart Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Zero Migration Friction</div>
            <h2 className="text-2xl font-bold text-white mt-1">15-Minute SDK Quickstart</h2>
          </div>
          {/* Language Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono">
            {(['typescript', 'python', 'curl'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeLang === lang
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'typescript' ? 'TypeScript' : lang === 'python' ? 'Python' : 'cURL'}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="rounded-2xl bg-slate-950 border border-white/10 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-b border-white/5 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>{activeLang === 'typescript' ? 'client.ts' : activeLang === 'python' ? 'app.py' : 'terminal.sh'}</span>
            </div>
            <button
              onClick={() => copyToClipboard(CODE_EXAMPLES[activeLang], activeLang)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              {copiedSnippet === activeLang ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-5 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed">
            <code>{CODE_EXAMPLES[activeLang]}</code>
          </pre>
        </div>
      </section>

      {/* Interactive REST API Reference */}
      <section className="space-y-6 pt-4">
        <div>
          <div className="text-xs font-mono text-orange-400 uppercase tracking-wider">REST & Streaming Surface</div>
          <h2 className="text-2xl font-bold text-white mt-1">Unified API Endpoints</h2>
          <p className="text-sm text-slate-400 mt-1">
            Standard HTTP/JSON endpoints compatible with any HTTP client or OpenAI-compatible toolchain.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Endpoint List Sidebar */}
          <div className="lg:col-span-5 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search endpoints (/api/v1/dispatch)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="space-y-2">
              {filteredEndpoints.map((ep) => {
                const isSelected = selectedEndpoint.path === ep.path;
                return (
                  <button
                    key={ep.path}
                    onClick={() => setSelectedEndpoint(ep)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/50 shadow-md'
                        : 'bg-slate-900/50 border-white/5 hover:bg-slate-800/40 hover:border-white/10'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        ep.method === 'POST'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : ep.method === 'GET'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono font-semibold text-white truncate">{ep.path}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{ep.summary}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Endpoint Detail Panel */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-white/10 p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
                    selectedEndpoint.method === 'POST'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-white">
                  {selectedEndpoint.path}
                </span>
              </div>
              <div className="text-sm text-slate-300 leading-relaxed">
                {selectedEndpoint.description}
              </div>
            </div>

            {selectedEndpoint.sampleRequest && (
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400">Request Example:</div>
                <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-cyan-300 overflow-x-auto border border-white/5">
                  <pre>{selectedEndpoint.sampleRequest}</pre>
                </div>
              </div>
            )}

            {selectedEndpoint.sampleResponse && (
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400">Response (200 OK):</div>
                <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-300 overflow-x-auto border border-white/5">
                  <pre>{selectedEndpoint.sampleResponse}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
