/**
 * src/lib/seo.ts
 *
 * Centralized SEO Manager & Dynamic Meta Tag Hydrator
 * Manages document title, meta description, keywords, canonical URLs,
 * OpenGraph tags, Twitter cards, and Schema.org JSON-LD structured data.
 */

import { useEffect } from 'react';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  path: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  noindex?: boolean;
}

export const BASE_URL = 'https://ai.whyor.in';
export const DEFAULT_OG_IMAGE = 'https://ai.whyor.in/og-image.png';

export const PAGE_SEO_REGISTRY: Record<string, SEOConfig> = {
  home: {
    title: 'WhyOr Dispatch — AI Model Router & Token Cost Optimization Engine',
    description: 'Route every prompt to the cheapest AI model that can handle it. Complexity-based multi-model routing across Claude 3.7, GPT-4.5, Gemini 2.5, DeepSeek R1, and Groq with 95%+ token cost savings.',
    keywords: 'AI model router, LLM cost optimization, multi-model AI routing, token efficiency AI, AI orchestration platform, cheapest AI model API, Thompson sampling AI router, context compression',
    path: '/',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'WhyOr Dispatch',
      url: 'https://ai.whyor.in/',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web, API, Cloud',
      description: 'Complexity-based AI model router that dispatches each request to the cheapest model that can serve it, with Thompson-sampling routing and portable context ledger.',
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: '0',
        description: '7-Day Free Trial available with full multi-model access',
      },
      publisher: {
        '@type': 'Organization',
        name: 'WhyOr Technologies Inc.',
        url: 'https://whyor.in/',
        logo: 'https://ai.whyor.in/icon-32.png',
      },
      featureList: [
        'Complexity-based 2-stage pre-call model routing',
        'Thompson-sampling Bayesian quality learning',
        'Multi-provider support: Anthropic Claude, OpenAI, Google Gemini, DeepSeek, Mistral, Groq',
        'Cryptographic SHA-256 Context Ledger',
        'In-chat token compression saving up to 90% tokens',
        'BYOK (Bring Your Own Key) & Local CLI Proxy',
      ],
    },
  },
  'how-it-works': {
    title: 'How WhyOr Dispatch Works — 2-Stage Pre-Call Classifier & Bayesian Routing',
    description: 'Explore the technical architecture of WhyOr Dispatch: semantic task classification, Thompson-sampling Beta(α,β) model selection, and zero-loss context compression.',
    keywords: 'how AI routing works, Thompson sampling LLM, Bayesian model selection, prompt compression algorithm, multi-model gateway architecture',
    path: '/how-it-works',
    ogType: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'How WhyOr Dispatch Works — Architecture & Bayesian Routing',
      description: 'Step-by-step technical breakdown of semantic task classification, Thompson-sampling quality estimation, and context ledger compression.',
      url: 'https://ai.whyor.in/how-it-works',
      author: {
        '@type': 'Organization',
        name: 'WhyOr Technologies Inc.',
      },
    },
  },
  capabilities: {
    title: 'Platform Capabilities & Architecture — WhyOr Dispatch AI',
    description: 'Enterprise AI capabilities: Dual-model corroboration (WhyOr Corroborate), multi-stage relay refinement (WhyOr Relay), AST code pruning, and local CLI proxy integration.',
    keywords: 'AI capabilities, multi-model corroboration, LLM relay pipeline, code AST pruning, enterprise AI gateway, BYOK proxy',
    path: '/capabilities',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'WhyOr Dispatch Capabilities & Enterprise Architecture',
      description: 'Comprehensive overview of multi-model dispatching, corroboration, relay pipelines, and token reduction engines.',
      url: 'https://ai.whyor.in/capabilities',
    },
  },
  examples: {
    title: 'Real AI Routing Examples & Measured Token Savings — WhyOr Dispatch',
    description: 'Interactive examples of complexity routing, AST codebase filtering (99.2% token savings), server log deduplication, and dual-model fact verification in action.',
    keywords: 'AI routing examples, token savings benchmark, code AST optimization, LLM prompt preprocessing, real AI benchmarks',
    path: '/examples',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'WhyOr Dispatch Real Examples & Token Reduction Benchmarks',
      description: 'Live interactive benchmarks and verifiable token savings across real-world developer workloads.',
      url: 'https://ai.whyor.in/examples',
    },
  },
  pricing: {
    title: 'Transparent Pricing & 7-Day Free Trial — WhyOr Dispatch',
    description: 'Flexible pricing plans for individuals, teams, and enterprises. Start with a 7-day free trial on Claude 3.7 and Gemini 2.5 pools, or Bring Your Own Keys (BYOK) with $0 markup.',
    keywords: 'AI router pricing, LLM cost calculator, BYOK AI pricing, Claude 3.7 pricing, OpenAI routing costs, enterprise AI gateway pricing',
    path: '/pricing',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'PriceSpecification',
      name: 'WhyOr Dispatch Pricing & Subscription Tiers',
      description: 'Free 7-day trial, Developer BYOK tier, Team Growth, and Enterprise Custom VPC plans.',
      url: 'https://ai.whyor.in/pricing',
    },
  },
  benchmarks: {
    title: 'AI Model Cost, Latency & Quality Benchmarks (2026) — WhyOr Dispatch',
    description: 'Comprehensive LLM benchmarks comparing Claude 3.7 Sonnet, GPT-4.5, Gemini 2.5 Pro, DeepSeek R1, Groq Llama 3.3, and Mistral. Compare $/1M tokens, latency, and routing accuracy.',
    keywords: 'LLM benchmarks 2026, AI cost per token, Claude 3.7 vs GPT-4.5 vs Gemini 2.5, DeepSeek R1 pricing, fastest AI model latency, LLM cost comparison table',
    path: '/benchmarks',
    ogType: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: '2026 AI Model Cost, Latency and Efficiency Benchmarks',
      description: 'Comparative latency, throughput, token pricing, and quality benchmarks for major LLM providers.',
      url: 'https://ai.whyor.in/benchmarks',
    },
  },
  docs: {
    title: 'Developer Documentation & API Reference — WhyOr Dispatch',
    description: 'Complete API documentation and SDK guides for WhyOr Dispatch. Integrate the drop-in OpenAI-compatible `/api/v1/dispatch` endpoint in Python, TypeScript, and cURL.',
    keywords: 'WhyOr API docs, AI model router API, OpenAI compatible router, LLM SDK TypeScript Python, dispatch API endpoints, Thompson sampling API',
    path: '/docs',
    ogType: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'WhyOr Dispatch API Documentation & Quickstart Guide',
      description: 'Full developer documentation covering REST API endpoints, SDK client libraries, authentication, and error codes.',
      url: 'https://ai.whyor.in/docs',
    },
  },
  faq: {
    title: 'Frequently Asked Questions (FAQ) — WhyOr Dispatch AI Model Router',
    description: 'Answers to common questions about WhyOr Dispatch: How does Bayesian routing save money? Is my data secure? How does BYOK work? What models are supported?',
    keywords: 'WhyOr FAQ, AI router questions, how does token optimization work, BYOK security, LLM routing FAQ',
    path: '/faq',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does WhyOr Dispatch reduce LLM token costs by up to 95%?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'WhyOr uses a 2-stage pre-call classifier to score the semantic complexity of every prompt. Simple queries (e.g., entity extraction, boilerplate generation) are dispatched to high-speed, cost-effective models like Gemini 2.5 Flash or DeepSeek V3, while complex reasoning tasks are routed to frontier models like Claude 3.7 or GPT-4.5. This eliminates overpaying for frontier models on trivial requests.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is Thompson-Sampling in AI model selection?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Thompson sampling is a Bayesian multi-armed bandit algorithm. WhyOr maintains a probability distribution Beta(α,β) for each model across 14 task archetypes. By sampling from this distribution rather than greedy selection, WhyOr continuously discovers optimal price-to-quality ratios while converging within ±1% of true model performance.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use my own API keys (BYOK) or existing Claude/ChatGPT subscriptions?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. WhyOr supports direct Bring-Your-Own-Key (BYOK) for all major providers (Anthropic, OpenAI, Google, Groq, DeepSeek, Mistral) as well as a local CLI proxy adapter that connects directly to your authenticated subscription endpoints at $0 marginal markup.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does WhyOr protect data privacy and ensure zero retention?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'WhyOr operates under a strict Zero Data Retention (ZDR) policy for customer prompts. All payloads are processed in-memory. When context ledger storage is enabled, data is encrypted with tenant-specific keys and verified via immutable SHA-256 cryptographic hashes.',
          },
        },
      ],
    },
  },
  contact: {
    title: 'Contact Enterprise Solutions & Support — WhyOr Dispatch',
    description: 'Get in touch with the WhyOr engineering team for enterprise private VPC deployments, custom SLA agreements, SAML SSO integration, and volume discounts.',
    keywords: 'contact WhyOr, enterprise AI support, custom VPC LLM deployment, private AI cluster quote',
    path: '/contact',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact WhyOr Dispatch Enterprise Team',
      description: 'Contact us for enterprise custom quotes, technical support, and partnership inquiries.',
      url: 'https://ai.whyor.in/contact',
    },
  },
  privacy: {
    title: 'Privacy Policy & Zero-Data-Retention (ZDR) Guarantee — WhyOr Dispatch',
    description: 'Read the WhyOr Dispatch Privacy Policy, GDPR & CCPA compliance commitments, cryptographic context ledger guarantees, and Zero-Data-Retention agreements.',
    keywords: 'WhyOr privacy policy, AI zero data retention, GDPR AI compliance, enterprise AI privacy, CCPA data security',
    path: '/privacy',
    ogType: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'WhyOr Dispatch Privacy Policy & Data Security Agreement',
      url: 'https://ai.whyor.in/privacy',
    },
  },
  terms: {
    title: 'Terms of Service & Enterprise SLA Guarantee — WhyOr Dispatch',
    description: 'Review the WhyOr Dispatch Terms of Service, Acceptable Use Policy, 99.9% uptime SLA guarantee, and billing terms.',
    keywords: 'WhyOr terms of service, AI SaaS SLA, acceptable use policy, API service level agreement',
    path: '/terms',
    ogType: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'WhyOr Dispatch Terms of Service & Enterprise SLA',
      url: 'https://ai.whyor.in/terms',
    },
  },
  dispatch: {
    title: 'Live Dispatch Console — Multi-Model AI Routing & Execution',
    description: 'Execute prompts across Claude 3.7, GPT-4.5, Gemini 2.5, DeepSeek, and Groq with live routing explainability, token meter, and instant response streaming.',
    keywords: 'AI dispatch console, live LLM prompt runner, multi-model execution, streaming AI prompt',
    path: '/dispatch',
    ogType: 'website',
  },
  quality: {
    title: 'Bayesian Quality Inspector & Thompson Sampling Telemetry — WhyOr',
    description: 'Inspect live Beta(α,β) distribution curves, accuracy scores, reward updates, and archetype convergence for all routed AI models.',
    keywords: 'Bayesian quality inspector, Thompson sampling telemetry, LLM quality tracking, model evaluation dashboard',
    path: '/quality',
    ogType: 'website',
  },
  catalog: {
    title: 'AI Model Catalog & Provider Ecosystem — WhyOr Dispatch',
    description: 'Browse the unified catalog of 20+ supported models from Anthropic, OpenAI, Google, DeepSeek, Mistral, xAI, Meta, and Groq with live pricing and latency metrics.',
    keywords: 'AI model catalog, LLM provider directory, compare Claude GPT Gemini, AI pricing directory',
    path: '/catalog',
    ogType: 'website',
  },
  ledger: {
    title: 'Cryptographic SHA-256 Context Ledger & Audit Trail — WhyOr',
    description: 'Explore the immutable SHA-256 context ledger that tracks extracted entities, decisions, and token savings across multi-turn AI interactions.',
    keywords: 'cryptographic context ledger, SHA-256 AI audit trail, conversation state persistence, LLM context ledger',
    path: '/ledger',
    ogType: 'website',
  },
  analytics: {
    title: 'Real-Time Token Savings & Routing Analytics — WhyOr Dispatch',
    description: 'Track cumulative token savings, cost reduction percentiles, archetype distributions, and provider efficiency in real time.',
    keywords: 'token savings analytics, AI cost reduction dashboard, LLM ROI calculator, multi-model analytics',
    path: '/analytics',
    ogType: 'website',
  },
  credentials: {
    title: 'Company Credentials & BYOK Gateway — WhyOr Dispatch',
    description: 'Securely configure enterprise API keys (OpenAI, Anthropic, Gemini, Groq, DeepSeek) and local CLI subscription proxies.',
    keywords: 'BYOK AI gateway, enterprise API key vault, Claude subscription proxy, secure LLM credentials',
    path: '/credentials',
    ogType: 'website',
    noindex: true,
  },
  teams: {
    title: 'Team Governance & Role-Based Access Control — WhyOr Dispatch',
    description: 'Manage team members, department budget caps, model access policies, and enterprise approval workflows.',
    keywords: 'AI team governance, LLM budget enforcement, role-based AI access, enterprise AI management',
    path: '/teams',
    ogType: 'website',
    noindex: true,
  },
  admin: {
    title: 'Enterprise Admin Console & Platform Operations — WhyOr Dispatch',
    description: 'Platform operations, SMTP gateway settings, tenant isolation, and audit logs for WhyOr Dispatch administrators.',
    keywords: 'AI platform admin, enterprise console, SMTP settings, audit logs',
    path: '/admin',
    ogType: 'website',
    noindex: true,
  },
  research: {
    title: 'Market Architecture & Multi-Model Routing Whitepaper — WhyOr Dispatch',
    description: 'In-depth market research and whitepaper on multi-model AI routing architectures, economic efficiency, and enterprise LLM orchestration.',
    keywords: 'AI routing whitepaper, LLM market research, multi-model orchestration economics, enterprise AI strategy',
    path: '/research',
    ogType: 'article',
  },
  workspace: {
    title: 'Enterprise AI Workspace — WhyOr Dispatch',
    description: 'Unified collaborative workspace with multi-model chat sessions, document analysis, corroboration, and relay polishers.',
    keywords: 'enterprise AI workspace, multi-model chat, document analysis LLM, AI collaboration',
    path: '/workspace',
    ogType: 'website',
    noindex: true,
  },
};

/**
 * React hook to dynamically sync document <head> metadata with the current page.
 */
export function usePageSEO(customConfig?: Partial<SEOConfig> & { tabKey?: string }) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const tabKey = customConfig?.tabKey || 'home';
    const baseConfig = PAGE_SEO_REGISTRY[tabKey] || PAGE_SEO_REGISTRY.home;
    const finalConfig: SEOConfig = {
      ...baseConfig,
      ...customConfig,
    };

    // Update document title
    document.title = finalConfig.title;

    // Update Meta Description
    updateMetaTag('name', 'description', finalConfig.description);

    // Update Meta Keywords
    if (finalConfig.keywords) {
      updateMetaTag('name', 'keywords', finalConfig.keywords);
    }

    // Update Canonical URL
    const canonicalUrl = `${BASE_URL}${finalConfig.path === '/' ? '' : finalConfig.path}`;
    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Update Robots Meta
    if (finalConfig.noindex) {
      updateMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      updateMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }

    // Update OpenGraph
    updateMetaTag('property', 'og:title', finalConfig.title);
    updateMetaTag('property', 'og:description', finalConfig.description);
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('property', 'og:type', finalConfig.ogType || 'website');
    updateMetaTag('property', 'og:image', finalConfig.ogImage || DEFAULT_OG_IMAGE);

    // Update Twitter Cards
    updateMetaTag('name', 'twitter:title', finalConfig.title);
    updateMetaTag('name', 'twitter:description', finalConfig.description);
    updateMetaTag('name', 'twitter:image', finalConfig.ogImage || DEFAULT_OG_IMAGE);

    // Update JSON-LD structured data
    let jsonLdScript = document.getElementById('dynamic-page-jsonld') as HTMLScriptElement | null;
    if (finalConfig.jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'dynamic-page-jsonld';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(finalConfig.jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }
  }, [
    customConfig?.title,
    customConfig?.description,
    customConfig?.path,
    customConfig?.keywords,
    customConfig?.tabKey,
  ]);
}

function updateMetaTag(keyType: 'name' | 'property', keyName: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[${keyType}="${keyName}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(keyType, keyName);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}
