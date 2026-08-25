/**
 * src/pages/FaqPage.tsx
 *
 * Frequently Asked Questions (FAQ) with Schema.org FAQPage Structured Data
 * Provides comprehensive, deep-indexed answers to technical and business questions.
 */

import React, { useState } from 'react';
import { usePageSEO } from '../lib/seo';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  KeyRound, 
  ArrowRight,
  Database,
  Building2
} from 'lucide-react';

interface FaqItem {
  question: string;
  category: 'Routing' | 'Cost' | 'Security' | 'BYOK' | 'Enterprise';
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How does WhyOr Dispatch achieve up to 95% token cost reductions?",
    category: "Routing",
    answer: "Most production prompts (like classification, boilerplate code, or summarization) do not require $75/M frontier models like GPT-4.5. WhyOr uses a sub-5ms semantic classifier to evaluate task complexity across 14 archetypes. It dispatches simple tasks to efficient models (Gemini 2.5 Flash, DeepSeek V3, Groq Llama) and reserves high-cost frontier models exclusively for complex multi-step reasoning. In testing, this blended distribution drops aggregate token bills by 85%–95%.",
  },
  {
    question: "What is Thompson Sampling and why is it better than rule-based routing?",
    category: "Routing",
    answer: "Rule-based routers use static regex or hardcoded thresholds that degrade as models update. Thompson sampling is a Bayesian multi-armed bandit algorithm that maintains a probability distribution Beta(α,β) for every model per task archetype. By sampling from this distribution, WhyOr continuously explores new model capabilities without getting stuck on suboptimal choices, converging to within ±1% of true ground-truth accuracy.",
  },
  {
    question: "Can we Bring Our Own Keys (BYOK) or use our Claude/ChatGPT subscriptions?",
    category: "BYOK",
    answer: "Yes. WhyOr provides full BYOK support. You can input your API keys for Anthropic, OpenAI, Google, Groq, DeepSeek, and Mistral with 0% platform markup. Additionally, our local CLI proxy adapter allows you to route requests through your authenticated Claude Pro/Max or ChatGPT Plus/Pro desktop sessions at zero marginal token cost.",
  },
  {
    question: "Is our proprietary prompt data retained or used for AI training?",
    category: "Security",
    answer: "No. WhyOr enforces a strict Zero Data Retention (ZDR) policy. Prompt payloads and completions are processed in-memory and never used for model training. When context ledger features are enabled, data is stored in tenant-isolated Firestore partitions encrypted with AES-256 and anchored by SHA-256 cryptographic hashes.",
  },
  {
    question: "How does the SHA-256 Context Ledger work across multi-turn sessions?",
    category: "Security",
    answer: "Every conversation turn extracts key entities and decision states, appending them to an immutable SHA-256 hash-chain. This provides an audit trail of which model made which decision, while allowing older conversational turns to be safely compressed without hallucination or context loss.",
  },
  {
    question: "How does WhyOr prevent hallucinations during critical tasks?",
    category: "Routing",
    answer: "WhyOr includes 'WhyOr Corroborate', a dual-model fact verification engine. For high-stakes queries (legal, medical, financial), Dispatch routes the prompt in parallel to two independent model architectures (e.g. Claude 3.7 and GPT-4o), calculating semantic agreement vectors and highlighting uncorroborated claims before outputting the result.",
  },
  {
    question: "What is the setup process for Enterprise private VPC deployments?",
    category: "Enterprise",
    answer: "Enterprise customers can deploy WhyOr Dispatch inside their own private AWS, GCP, or Azure VPCs using Terraform and Helm charts. Enterprise plans include SAML 2.0 / Okta SSO, custom SLA guarantees (<2 hour response time), custom Ollama inference clustering, and PO/Net-30 billing.",
  },
  {
    question: "How does in-chat context compression save 3,600+ tokens?",
    category: "Cost",
    answer: "As multi-turn conversations grow, sending the full historical prompt on every turn causes exponential token consumption. WhyOr's Context Compressor identifies invariant facts and compresses redundant dialogue turns into structured summaries, reducing context window overhead by up to 88% while preserving full reasoning continuity.",
  },
];

export default function FaqPage({
  onNavigateTab,
}: {
  onNavigateTab?: (tab: string) => void;
} = {}) {
  usePageSEO({
    tabKey: 'faq',
    path: '/faq',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const categories = ['All', 'Routing', 'Cost', 'Security', 'BYOK', 'Enterprise'];

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="text-slate-100 antialiased space-y-12 pb-16">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-[#0b0f19] border border-white/10 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-400/30 text-orange-300 text-xs font-mono">
            <HelpCircle className="w-3.5 h-3.5" /> Comprehensive Knowledge Base
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Everything you need to know about Bayesian model routing, token cost reduction, zero-data retention, and enterprise integration.
          </p>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/80 border border-white/10 rounded-2xl">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
          />
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-4">
        {filteredFaqs.map((faq, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div
              key={faq.question}
              className="rounded-2xl bg-slate-900/70 border border-white/10 overflow-hidden transition-all shadow-md"
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 hover:bg-white/[0.02] cursor-pointer"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-orange-400 border border-orange-500/20">
                    {faq.category}
                  </span>
                  <div className="text-base sm:text-lg font-semibold text-white">
                    {faq.question}
                  </div>
                </div>
                <div className="p-1 rounded-lg bg-white/5 text-slate-400 shrink-0 mt-1">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-6 sm:px-6 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still Have Questions CTA */}
      <div className="rounded-3xl bg-gradient-to-r from-orange-950/40 via-amber-950/20 to-slate-900 border border-orange-500/30 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-xl font-bold text-white">Still have technical or enterprise questions?</h2>
          <p className="text-sm text-slate-300">
            Our engineering team is available for custom architectural consultations and benchmark audits.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab?.('contact')}
          className="px-6 py-3 rounded-xl bg-orange-500 text-slate-950 font-bold text-sm hover:bg-orange-400 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg"
        >
          Talk to Engineering <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
