/**
 * src/pages/TermsOfServicePage.tsx
 *
 * Terms of Service, Acceptable Use Policy & Enterprise SLA Guarantees
 */

import React from 'react';
import { usePageSEO } from '../lib/seo';
import { FileText, ShieldCheck, CheckCircle2, AlertTriangle, Scale, Clock } from 'lucide-react';

export default function TermsOfServicePage({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: string) => void;
} = {}) {
  usePageSEO({
    tabKey: 'terms',
    path: '/terms',
  });

  return (
    <div className="text-slate-100 antialiased space-y-12 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-[#0b0f19] border border-white/10 p-8 sm:p-12 shadow-2xl">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-400/30 text-orange-300 text-xs font-mono">
            <Scale className="w-3.5 h-3.5" /> Service Agreement & SLA
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
            Terms of Service & Enterprise SLA
          </h1>
          <p className="text-sm font-mono text-slate-400">
            Effective Date: August 25, 2026 • WhyOr Technologies Inc.
          </p>
        </div>
      </header>

      {/* SLA Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
          <Clock className="w-5 h-5 text-orange-400" />
          <div className="text-sm font-bold text-white">99.95% API Uptime</div>
          <div className="text-xs text-slate-400 leading-relaxed">
            Multi-region gateway failover ensures zero-downtime routing across upstream LLMs.
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div className="text-sm font-bold text-white">0% BYOK Markup</div>
          <div className="text-xs text-slate-400 leading-relaxed">
            Bring Your Own Key calls pass through at raw provider rates with zero hidden fees.
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
          <Scale className="w-5 h-5 text-cyan-400" />
          <div className="text-sm font-bold text-white">Enterprise SLA Guarantee</div>
          <div className="text-xs text-slate-400 leading-relaxed">
            Sub-2-hour guaranteed incident response for Enterprise VPC deployments.
          </div>
        </div>
      </div>

      {/* Terms Content */}
      <article className="space-y-8 text-sm text-slate-300 leading-relaxed font-sans bg-slate-900/40 border border-white/10 rounded-3xl p-8 sm:p-10">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the WhyOr Dispatch platform, APIs, SDKs, or associated services, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or legal entity, you represent that you have the authority to bind such entity.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">2. Multi-Model Routing & Token Metering</h2>
          <p>
            WhyOr Dispatch routes AI requests across third-party model providers including Anthropic, OpenAI, Google, Groq, DeepSeek, and Mistral. Token usage is calculated based on exact model tokenizers and billed in real-time. For managed pool users, accounts receive access during the 7-day free trial and billed according to the chosen subscription plan thereafter.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">3. Acceptable Use Policy (AUP)</h2>
          <p>
            Users agree not to utilize WhyOr Dispatch for:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>Generating deceptive deepfakes, non-consensual imagery, or malware payload vectors.</li>
            <li>Attempting to bypass upstream provider safety filters through adversarial jailbreak vectors.</li>
            <li>Denial-of-service or brute-force token exhaustion attacks against the dispatch gateway.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">4. Service Level Agreement (SLA)</h2>
          <p>
            WhyOr guarantees 99.95% monthly uptime for the `/api/v1/dispatch` endpoint. In the event of upstream model provider degradation (e.g. OpenAI or Anthropic API outage), WhyOr's automatic failover engine reroutes traffic to equivalent fallback models without dropping requests.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">5. Governing Law & Inquiries</h2>
          <p>
            These terms are governed by the laws of the State of Delaware. For legal inquiries or enterprise MSA contracts, contact <code className="text-orange-400 font-mono">legal@whyor.in</code>.
          </p>
        </section>
      </article>
    </div>
  );
}
