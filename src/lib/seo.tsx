/**
 * src/lib/seo.tsx
 *
 * Per-page SEO metadata, zero new dependencies (no react-helmet-async —
 * a ~15-line custom hook does the same DOM work without adding a
 * package). Sets document.title, meta description, canonical URL, OG
 * tags, and optional JSON-LD per mounted route.
 *
 * HONEST LIMITATION, stated directly rather than implied away: this is
 * CLIENT-SIDE metadata — it runs after the page's JS executes. Googlebot
 * does execute JS and will see these tags on a render pass, but a crawler
 * that doesn't run JS (some social-media link previewers, some older
 * bots) will only ever see whatever's in the static index.html. The
 * actual fix for that gap — noted in the original codebase review
 * earlier in this engagement — is server-side rendering or a
 * prerendering build step (vite-plugin-ssr or similar), which is a real,
 * separate infrastructure decision, not something this hook can
 * substitute for. This hook is a genuine, real improvement over having
 * one static <title> for the whole SPA — it is not equivalent to SSR.
 */
import { useEffect } from "react";

export interface PageSEO {
  title: string;
  description: string;
  path: string;              // e.g. "/how-it-works" — used to build the canonical URL
  jsonLd?: Record<string, any>;
}

const SITE_URL = "https://ai.whyor.in";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute(rel, rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id: string, data: Record<string, any>) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function usePageSEO(seo: PageSEO) {
  useEffect(() => {
    const url = `${SITE_URL}${seo.path}`;
    document.title = seo.title;
    upsertMeta("name", "description", seo.description);
    upsertLink("canonical", url);
    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:description", seo.description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", DEFAULT_OG_IMAGE);
    upsertMeta("name", "twitter:title", seo.title);
    upsertMeta("name", "twitter:description", seo.description);

    if (seo.jsonLd) upsertJsonLd("page-jsonld", seo.jsonLd);

    // No cleanup on unmount — the next page's usePageSEO call overwrites
    // these same tags on its own mount, which runs before this page's
    // content unmounts in a typical route transition. Removing tags here
    // would risk a flash of no-title between routes.
  }, [seo.title, seo.description, seo.path, JSON.stringify(seo.jsonLd)]);
}
