/**
 * src/pages/PrivacyPolicyPage.tsx
 *
 * Enterprise Privacy Policy, GDPR/CCPA Compliance & Zero Data Retention Guarantee
 */

import React from 'react';
import { usePageSEO } from '../lib/seo';
import { ShieldCheck, Lock, Database, EyeOff, Server, FileCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PrivacyPolicyPage({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: string) => void;
} = {}) {
  usePageSEO({
    tabKey: 'privacy',
    path: '/privacy',
  });

  return (
    <div className="text-slate-100 antialiased space-y-12 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-[#0b0f19] border border-white/10 p-8 sm:p-12 shadow-2xl">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Trust & Security
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
            Privacy Policy & Zero Data Retention Guarantee
          </h1>
          <p className="text-sm font-mono text-slate-400">
            Last Updated: August 25, 2026 • WhyOr Technologies Inc.
          </p>
        </div>
      </header>

      {/* Core Privacy Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
          <EyeOff className="w-5 h-5 text-cyan-400" />
          <div className="text-sm font-bold text-white">Zero Model Training</div>
          <div className="text-xs text-slate-400 leading-relaxed">
            Your proprietary prompts, embeddings, and completions are never utilized to train AI models.
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          <div className="text-sm font-bold text-white">In-Memory Execution</div>
          <div className="text-xs text-slate-400 leading-relaxed">
            Transient prompts are evaluated and routed in stateless ephemeral RAM buffers.
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
          <Database className="w-5 h-5 text-purple-400" />
          <div className="text-sm font-bold text-white">SHA-256 Ledger Isolation</div>
          <div className="text-xs text-slate-400 leading-relaxed">
            Persistent context ledgers are encrypted with AES-256 and partitioned per tenant.
          </div>
        </div>
      </div>

      {/* Detailed Legal Sections */}
      <article className="space-y-8 text-sm text-slate-300 leading-relaxed font-sans bg-slate-900/40 border border-white/10 rounded-3xl p-8 sm:p-10">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">1. Information We Process</h2>
          <p>
            WhyOr Technologies Inc. ("WhyOr", "we", "our") provides intelligent AI multi-model routing and token cost optimization infrastructure. When you utilize the WhyOr Dispatch platform, we process two distinct categories of data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li><strong className="text-slate-200">Account & Billing Data:</strong> Name, work email address, company profile, and usage counters required for access provisioning and billing.</li>
            <li><strong className="text-slate-200">Inference Payload Data:</strong> Prompts, system instructions, and completion requests transmitted to the `/api/v1/dispatch` endpoint.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">2. Zero Data Retention (ZDR) & BYOK Policy</h2>
          <p>
            Under our Bring Your Own Key (BYOK) architecture and Enterprise agreements:
          </p>
          <p>
            All inference payloads are transmitted directly to the upstream model provider (Anthropic, OpenAI, Google, Groq, DeepSeek, Mistral) using end-to-end TLS 1.3 encryption. We do not store, log, inspect, or retain raw prompt text on persistent disk unless you explicitly enable the optional Firestore Context Ledger feature for multi-turn session persistence.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">3. Cryptographic Integrity & Context Ledger</h2>
          <p>
            When context ledger persistence is activated, extracted entities and decision vectors are committed to a tamper-evident SHA-256 cryptographic hash-chain. This allows enterprise auditability of which AI model generated each specific response without exposing raw unencrypted prompt content to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">4. GDPR, CCPA & International Transfers</h2>
          <p>
            WhyOr complies fully with the European Union General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). Enterprise users maintain full rights of data rectification, erasure, and portability. You can export or purge your entire ledger history at any time through the Admin Console.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">5. Contact Privacy Officer</h2>
          <p>
            For inquiries regarding our security whitepaper, Data Processing Addendum (DPA), or SOC2 Type II reports, please contact our security team at <code className="text-cyan-400 font-mono">privacy@whyor.in</code>.
          </p>
        </section>
      </article>
    </div>
  );
}
