/**
 * HIGAET analytics — env-driven. GA4 / GTM / Meta Pixel / Clarity / GSC verification.
 * Tags do NOT load until the user grants consent via the cookie banner.
 *
 * All IDs are public (VITE_*) — safe to expose to the client.
 */
export const ANALYTICS_IDS = {
  gtm: import.meta.env.VITE_GTM_ID ?? "",
  ga4: import.meta.env.VITE_GA4_ID ?? "",
  metaPixel: import.meta.env.VITE_META_PIXEL_ID ?? "",
  clarity: import.meta.env.VITE_CLARITY_ID ?? "",
  linkedIn: import.meta.env.VITE_LINKEDIN_PARTNER_ID ?? "",
  gscVerification: import.meta.env.VITE_GSC_VERIFICATION ?? "",
  posthogKey: import.meta.env.VITE_POSTHOG_KEY ?? "",
  posthogHost: import.meta.env.VITE_POSTHOG_HOST ?? "https://eu.i.posthog.com",
} as const;

export const CONSENT_KEY = "higaet.consent.v1";

export type ConsentState = "granted" | "denied" | "unset";

export function getConsent(): ConsentState {
  if (typeof window === "undefined") return "unset";
  const v = window.localStorage.getItem(CONSENT_KEY);
  return v === "granted" || v === "denied" ? v : "unset";
}

export function setConsent(value: "granted" | "denied") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_KEY, value);
  if (value === "granted") loadTags();
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

let loaded = false;

export function loadTags() {
  if (typeof window === "undefined" || loaded) return;
  loaded = true;

  // GTM
  if (ANALYTICS_IDS.gtm) {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${ANALYTICS_IDS.gtm}`;
    document.head.appendChild(s);
  }

  // GA4 (only if GTM is NOT configured — otherwise GA4 should load via GTM)
  if (!ANALYTICS_IDS.gtm && ANALYTICS_IDS.ga4) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_IDS.ga4}`;
    document.head.appendChild(s);
    const init = document.createElement("script");
    init.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ANALYTICS_IDS.ga4}');`;
    document.head.appendChild(init);
  }

  // Meta Pixel
  if (ANALYTICS_IDS.metaPixel) {
    const init = document.createElement("script");
    init.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${ANALYTICS_IDS.metaPixel}');fbq('track','PageView');`;
    document.head.appendChild(init);
  }

  // Microsoft Clarity
  if (ANALYTICS_IDS.clarity) {
    const init = document.createElement("script");
    init.text = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${ANALYTICS_IDS.clarity}");`;
    document.head.appendChild(init);
  }

  // PostHog (product analytics)
  if (ANALYTICS_IDS.posthogKey) {
    // Lazy-import so it stays out of the initial bundle until consent granted.
    void import("posthog-js").then(({ default: posthog }) => {
      posthog.init(ANALYTICS_IDS.posthogKey, {
        api_host: ANALYTICS_IDS.posthogHost,
        capture_pageview: true,
        capture_pageleave: true,
        person_profiles: "identified_only",
      });
      (window as unknown as { posthog?: unknown }).posthog = posthog;
    });
  }
}

import { validateEvent } from "./analytics-contract";

/** Push a custom event into dataLayer / Pixel / PostHog. Safe no-op when tags aren't loaded.
 *  Known events are validated against the Zod contract; invalid payloads are dropped
 *  (and logged in dev) to prevent silent analytics drift. */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const result = validateEvent(name, params);
  if (!result.ok) {
    if (import.meta.env.DEV) {
      console.error(`[analytics] invalid event "${name}": ${result.error}`);
    }
    return;
  }
  window.dataLayer?.push({ event: name, ...params });
  window.fbq?.("trackCustom", name, params);
  const ph = (window as unknown as { posthog?: { capture: (n: string, p?: Record<string, unknown>) => void } }).posthog;
  ph?.capture(name, params);
}

/** Identify a signed-in user across analytics providers. Safe no-op when tags aren't loaded. */
export function identifyUser(userId: string, traits: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !userId) return;
  // GA4 via GTM
  window.dataLayer?.push({ event: "user_identified", user_id: userId, ...traits });
  // PostHog
  const ph = (window as unknown as { posthog?: { identify: (id: string, t?: Record<string, unknown>) => void } }).posthog;
  ph?.identify(userId, traits);
}

/** Reset identity on sign-out. */
export function resetIdentity() {
  if (typeof window === "undefined") return;
  window.dataLayer?.push({ event: "user_signed_out" });
  const ph = (window as unknown as { posthog?: { reset: () => void } }).posthog;
  ph?.reset();
}
