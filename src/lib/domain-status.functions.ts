import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, assertSameOrigin, throttle, writeAudit } from "@/lib/admin-guard";

/**
 * DNS + SSL + HSTS status for HIGAET domains.
 *
 * - DNS via Cloudflare DNS-over-HTTPS
 * - HTTPS reachability + HSTS header via server-side fetch
 * - Cert issuer / not_before / not_after via crt.sh Certificate Transparency
 *   logs (the Worker runtime does not expose the TLS peer cert; CT is the
 *   next-best public signal)
 * - Every snapshot is written to admin_domain_status_history so the page
 *   can show a short pass/fail + cert history per domain.
 */

const EXPECTED_IP = "185.158.133.1";
const DOMAINS = [
  { host: "higaet.com", role: "apex", requireHsts: true },
  { host: "www.higaet.com", role: "www", requireHsts: true },
] as const;

export interface DomainStatus {
  host: string;
  role: string;
  dns: { ok: boolean; records: string[]; expected: string; detail: string };
  ssl: { ok: boolean; httpStatus: number | null; latencyMs: number | null; error: string | null };
  hsts: {
    required: boolean;
    present: boolean;
    header: string | null;
    includesSubDomains: boolean;
    maxAge: number | null;
    detail: string;
  };
  cert: {
    issuer: string | null;
    notBefore: string | null;
    notAfter: string | null;
    daysRemaining: number | null;
    source: "crt.sh" | "unavailable";
    detail: string;
  };
  overall: "pass" | "warn" | "fail";
}

export interface DomainStatusHistoryRow {
  id: string;
  host: string;
  overall: "pass" | "warn" | "fail";
  dns_ok: boolean;
  ssl_ok: boolean;
  http_status: number | null;
  hsts_present: boolean;
  hsts_max_age: number | null;
  hsts_include_subdomains: boolean;
  cert_issuer: string | null;
  cert_not_after: string | null;
  detail: string | null;
  checked_at: string;
}

export interface DomainStatusReport {
  generatedAt: string;
  expectedIp: string;
  domains: DomainStatus[];
  history: Record<string, DomainStatusHistoryRow[]>;
  overall: "pass" | "warn" | "fail";
}

async function dohLookupA(host: string): Promise<string[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=A`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`DoH ${res.status}`);
  const j: any = await res.json();
  const answers: any[] = j?.Answer ?? [];
  return answers.filter((a) => a.type === 1).map((a) => String(a.data));
}

function parseHsts(header: string | null) {
  if (!header) return { maxAge: null as number | null, includesSubDomains: false };
  const lower = header.toLowerCase();
  const m = lower.match(/max-age\s*=\s*(\d+)/);
  return {
    maxAge: m ? Number(m[1]) : null,
    includesSubDomains: lower.includes("includesubdomains"),
  };
}

async function fetchCertFromCrtSh(host: string): Promise<DomainStatus["cert"]> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://crt.sh/?q=${encodeURIComponent(host)}&output=json&exclude=expired`,
      { signal: controller.signal, headers: { accept: "application/json" } },
    );
    clearTimeout(t);
    if (!res.ok) {
      return {
        issuer: null,
        notBefore: null,
        notAfter: null,
        daysRemaining: null,
        source: "unavailable",
        detail: `crt.sh HTTP ${res.status}`,
      };
    }
    const rows: any[] = await res.json();
    if (!rows || rows.length === 0) {
      return {
        issuer: null,
        notBefore: null,
        notAfter: null,
        daysRemaining: null,
        source: "unavailable",
        detail: "No CT entries returned.",
      };
    }
    const latest = rows
      .filter((r) => r?.not_after)
      .sort((a, b) => new Date(b.not_after).getTime() - new Date(a.not_after).getTime())[0];
    if (!latest) {
      return {
        issuer: null,
        notBefore: null,
        notAfter: null,
        daysRemaining: null,
        source: "unavailable",
        detail: "No usable CT entry.",
      };
    }
    const notAfter = new Date(latest.not_after);
    const days = Math.round((notAfter.getTime() - Date.now()) / 86_400_000);
    return {
      issuer: String(latest.issuer_name ?? "").split(",").find((s: string) => s.trim().startsWith("O="))?.split("=")[1]?.trim() ?? String(latest.issuer_name ?? ""),
      notBefore: latest.not_before ?? null,
      notAfter: latest.not_after ?? null,
      daysRemaining: days,
      source: "crt.sh",
      detail: `Latest CT cert · issuer ${latest.issuer_name ?? "?"}`,
    };
  } catch (e: any) {
    return {
      issuer: null,
      notBefore: null,
      notAfter: null,
      daysRemaining: null,
      source: "unavailable",
      detail: `crt.sh error: ${e?.message ?? "network"}`,
    };
  }
}

async function inspect(host: string, role: string, requireHsts: boolean): Promise<DomainStatus> {
  // DNS
  let dnsRecords: string[] = [];
  let dnsErr = "";
  try {
    dnsRecords = await dohLookupA(host);
  } catch (e: any) {
    dnsErr = e?.message ?? "dns lookup failed";
  }
  const dnsOk = dnsRecords.length > 0 && dnsRecords.includes(EXPECTED_IP);
  const dnsDetail = dnsErr
    ? `DNS lookup error: ${dnsErr}`
    : dnsRecords.length === 0
      ? "No A records returned."
      : dnsOk
        ? `A → ${dnsRecords.join(", ")}`
        : `A → ${dnsRecords.join(", ")} (expected ${EXPECTED_IP})`;

  // HTTPS + HSTS
  const started = Date.now();
  let httpStatus: number | null = null;
  let sslErr: string | null = null;
  let hstsHeader: string | null = null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://${host}/`, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
    });
    clearTimeout(t);
    httpStatus = res.status;
    hstsHeader = res.headers.get("strict-transport-security");
  } catch (e: any) {
    sslErr = e?.name === "AbortError" ? "timeout" : (e?.message ?? "network error");
  }
  const latencyMs = Date.now() - started;
  const sslOk = httpStatus !== null && httpStatus < 500 && sslErr === null;
  const parsedHsts = parseHsts(hstsHeader);
  const hstsPresent = !!hstsHeader && (parsedHsts.maxAge ?? 0) > 0;
  const hstsDetail = hstsHeader
    ? hstsHeader
    : requireHsts
      ? "No Strict-Transport-Security header returned."
      : "No HSTS (optional for this host).";

  // Cert enrichment (best-effort)
  const cert = await fetchCertFromCrtSh(host);

  const overall: DomainStatus["overall"] =
    !dnsOk || !sslOk || (requireHsts && !hstsPresent)
      ? "fail"
      : (requireHsts && !parsedHsts.includesSubDomains) ||
          (cert.daysRemaining !== null && cert.daysRemaining < 21)
        ? "warn"
        : "pass";

  return {
    host,
    role,
    dns: { ok: dnsOk, records: dnsRecords, expected: EXPECTED_IP, detail: dnsDetail },
    ssl: { ok: sslOk, httpStatus, latencyMs, error: sslErr },
    hsts: {
      required: requireHsts,
      present: hstsPresent,
      header: hstsHeader,
      includesSubDomains: parsedHsts.includesSubDomains,
      maxAge: parsedHsts.maxAge,
      detail: hstsDetail,
    },
    cert,
    overall,
  };
}

async function persistSnapshot(supabase: any, s: DomainStatus) {
  await supabase.from("admin_domain_status_history").insert({
    host: s.host,
    overall: s.overall,
    dns_ok: s.dns.ok,
    ssl_ok: s.ssl.ok,
    http_status: s.ssl.httpStatus,
    hsts_present: s.hsts.present,
    hsts_max_age: s.hsts.maxAge,
    hsts_include_subdomains: s.hsts.includesSubDomains,
    cert_issuer: s.cert.issuer,
    cert_not_before: s.cert.notBefore,
    cert_not_after: s.cert.notAfter,
    detail: [s.dns.detail, s.hsts.detail, s.cert.detail].filter(Boolean).join(" · ").slice(0, 500),
  });
}

async function loadHistory(supabase: any): Promise<Record<string, DomainStatusHistoryRow[]>> {
  const { data } = await supabase
    .from("admin_domain_status_history")
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(60);
  const out: Record<string, DomainStatusHistoryRow[]> = {};
  for (const row of (data ?? []) as DomainStatusHistoryRow[]) {
    (out[row.host] ||= []).push(row);
  }
  for (const host of Object.keys(out)) out[host] = out[host].slice(0, 8);
  return out;
}

export const getDomainStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DomainStatusReport> => {
    assertSameOrigin();
    await assertAdmin(context);
    throttle("domain-status", context.userId, 5_000);

    const domains = await Promise.all(
      DOMAINS.map((d) => inspect(d.host, d.role, d.requireHsts)),
    );

    // Persist each snapshot in parallel (best-effort)
    await Promise.all(domains.map((d) => persistSnapshot(context.supabase, d).catch(() => null)));

    const history = await loadHistory(context.supabase);
    const anyFail = domains.some((d) => d.overall === "fail");
    const anyWarn = domains.some((d) => d.overall === "warn");
    const overall: DomainStatusReport["overall"] = anyFail ? "fail" : anyWarn ? "warn" : "pass";

    await writeAudit(context.supabase, context.userId, "domain_status.check", "domain", null, {
      overall,
      results: domains.map((d) => ({ host: d.host, overall: d.overall })),
    });

    return {
      generatedAt: new Date().toISOString(),
      expectedIp: EXPECTED_IP,
      domains,
      history,
      overall,
    };
  });
