/**
 * Sentry REST client — Worker-safe (fetch only).
 *
 * MCP is an agent/IDE surface; deployed apps can't call MCP directly. This
 * client speaks the Sentry Web API with a scoped auth token so the SRE loop
 * works from server functions and cron routes.
 *
 * Env:
 *   SENTRY_AUTH_TOKEN  — required to make live calls
 *   SENTRY_ORG_SLUG    — default "higaet-5y"
 *   SENTRY_PROJECT_SLUG — default "higaet-core-engine"
 */

export interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit?: string | null;
  level?: string;
  status?: string;
  count?: string | number;
  userCount?: number;
  firstSeen?: string;
  lastSeen?: string;
  permalink?: string;
  metadata?: { type?: string; value?: string; filename?: string } | null;
  project?: { slug?: string; name?: string };
}

export interface SentryEventFrame {
  filename?: string;
  function?: string;
  lineNo?: number;
  module?: string;
}

export interface SentryEventDetail {
  id: string;
  eventID?: string;
  message?: string;
  platform?: string;
  errorType?: string;
  errorValue?: string;
  frames: SentryEventFrame[];
  tags: Record<string, string>;
}

export interface SentryClientConfig {
  authToken?: string;
  orgSlug?: string;
  projectSlug?: string;
  baseUrl?: string;
}

const DEFAULT_BASE = "https://sentry.io/api/0";

export class SentryClient {
  readonly orgSlug: string;
  readonly projectSlug: string;
  private readonly authToken: string | undefined;
  private readonly baseUrl: string;

  constructor(cfg: SentryClientConfig = {}) {
    this.authToken = cfg.authToken ?? process.env.SENTRY_AUTH_TOKEN;
    this.orgSlug = cfg.orgSlug ?? process.env.SENTRY_ORG_SLUG ?? "higaet-5y";
    this.projectSlug =
      cfg.projectSlug ?? process.env.SENTRY_PROJECT_SLUG ?? "higaet-core-engine";
    this.baseUrl = cfg.baseUrl ?? DEFAULT_BASE;
  }

  isConfigured(): boolean {
    return Boolean(this.authToken);
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.authToken) {
      throw new Error("SENTRY_AUTH_TOKEN is not configured");
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Sentry ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  }

  /** List unresolved issues for the scoped project. */
  async listIssues(opts: { query?: string; limit?: number } = {}): Promise<SentryIssue[]> {
    const query = opts.query ?? "is:unresolved";
    const limit = Math.min(opts.limit ?? 25, 100);
    const params = new URLSearchParams({ query, limit: String(limit) });
    return this.request<SentryIssue[]>(
      `/projects/${this.orgSlug}/${this.projectSlug}/issues/?${params}`,
    );
  }

  async getIssue(issueId: string): Promise<SentryIssue> {
    return this.request<SentryIssue>(`/issues/${issueId}/`);
  }

  /** Get the latest event on an issue and flatten the top exception + frames. */
  async getLatestEvent(issueId: string): Promise<SentryEventDetail | null> {
    const raw = await this.request<any>(`/issues/${issueId}/events/latest/`);
    if (!raw) return null;
    const exceptionEntry = (raw.entries ?? []).find((e: any) => e.type === "exception");
    const exc = exceptionEntry?.data?.values?.[0];
    const frames: SentryEventFrame[] = (exc?.stacktrace?.frames ?? []).map((f: any) => ({
      filename: f.filename,
      function: f.function,
      lineNo: f.lineNo,
      module: f.module,
    }));
    const tags: Record<string, string> = {};
    for (const t of raw.tags ?? []) if (t?.key) tags[t.key] = String(t.value ?? "");
    return {
      id: raw.id,
      eventID: raw.eventID,
      message: raw.message ?? raw.title,
      platform: raw.platform,
      errorType: exc?.type,
      errorValue: exc?.value,
      frames,
      tags,
    };
  }
}
