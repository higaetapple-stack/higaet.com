import type { Page, Request } from "@playwright/test";

/**
 * Analytics network interceptor.
 * Captures outbound requests to PostHog, GA4 / GTM, and Meta Pixel so tests
 * can assert real user flows actually emit contract events end-to-end.
 */
export interface CapturedEvent {
  provider: "posthog" | "ga4" | "meta" | "dataLayer";
  name?: string;
  url: string;
  raw: string;
}

const EVENT_HOST_MATCHERS: Array<{
  provider: CapturedEvent["provider"];
  test: (u: string) => boolean;
  extractName: (req: Request) => string | undefined;
}> = [
  {
    provider: "posthog",
    test: (u) => /(\/|\.)posthog\.com|i\.posthog\.com/.test(u),
    extractName: (req) => {
      try {
        const body = req.postData();
        if (!body) return undefined;
        const parsed = JSON.parse(body) as { event?: string; batch?: Array<{ event?: string }> };
        return parsed.event ?? parsed.batch?.[0]?.event;
      } catch {
        return undefined;
      }
    },
  },
  {
    provider: "ga4",
    test: (u) => /google-analytics\.com|analytics\.google\.com|googletagmanager\.com\/g\/collect/.test(u),
    extractName: (req) => new URL(req.url()).searchParams.get("en") ?? undefined,
  },
  {
    provider: "meta",
    test: (u) => /facebook\.com\/tr|connect\.facebook\.net/.test(u),
    extractName: (req) => new URL(req.url()).searchParams.get("ev") ?? undefined,
  },
];

export interface EventTracker {
  events: CapturedEvent[];
  hasEvent: (name: string) => boolean;
  countEvent: (name: string) => number;
  byProvider: (p: CapturedEvent["provider"]) => CapturedEvent[];
  wait: (name: string, timeoutMs?: number) => Promise<CapturedEvent>;
  clear: () => void;
  installDataLayerHook: () => Promise<void>;
}

export async function createEventTracker(page: Page): Promise<EventTracker> {
  const events: CapturedEvent[] = [];

  page.on("request", (req) => {
    const url = req.url();
    const matcher = EVENT_HOST_MATCHERS.find((m) => m.test(url));
    if (!matcher) return;
    events.push({
      provider: matcher.provider,
      name: matcher.extractName(req),
      url,
      raw: req.postData() ?? "",
    });
  });

  // Also drain window.dataLayer so we still see events even without a GA network hit
  // (e.g. GTM not configured in staging). This is a defensive fallback.
  await page.exposeFunction(
    "__captureDataLayerEvent",
    (name: string, payload: unknown) => {
      events.push({
        provider: "dataLayer",
        name,
        url: "dataLayer://push",
        raw: JSON.stringify(payload ?? {}),
      });
    },
  );

  const installHook = async () => {
    await page.addInitScript(() => {
      const w = window as unknown as {
        dataLayer?: Array<Record<string, unknown>>;
        __captureDataLayerEvent?: (n: string, p: unknown) => void;
      };
      const dl = (w.dataLayer = w.dataLayer ?? []);
      const originalPush = dl.push.bind(dl);
      dl.push = (...args: Array<Record<string, unknown>>) => {
        for (const entry of args) {
          const name = typeof entry?.event === "string" ? entry.event : undefined;
          if (name) w.__captureDataLayerEvent?.(name, entry);
        }
        return originalPush(...args);
      };
    });
  };
  await installHook();

  return {
    events,
    hasEvent: (name) => events.some((e) => e.name === name),
    countEvent: (name) => events.filter((e) => e.name === name).length,
    byProvider: (p) => events.filter((e) => e.provider === p),
    async wait(name, timeoutMs = 5000) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const hit = events.find((e) => e.name === name);
        if (hit) return hit;
        await page.waitForTimeout(100);
      }
      throw new Error(
        `Timed out waiting for analytics event "${name}". Captured: ${events
          .map((e) => e.name ?? "?")
          .join(", ")}`,
      );
    },
    clear: () => {
      events.length = 0;
    },
    installDataLayerHook: installHook,
  };
}
