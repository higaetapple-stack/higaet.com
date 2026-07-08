import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * DNS + SSL + HSTS status for HIGAET domains.
 *
 * Runs from the server so it works from any admin browser regardless of
 * local network. Uses DNS-over-HTTPS (Cloudflare) for record lookups, and
 * a plain HTTPS fetch to determine SSL reachability and inspect the
 * Strict-Transport-Security header.
 */

const EXPECTED_IP = "185.158.133.1";
const DOMAINS = [
  { host: "higaet.com", role: "apex", requireHsts: true },
  { host: "www.higaet.com", role: "www", requireHsts: true },
  { host: "staging.higaet.com", role: "staging", requireHsts: false },
] as const;

export interface DomainStatus {
  host: string;
  role: string;
  dns: {
    ok: boolean;
    records: string[];
    expected: string;
    detail: string;
  };
  ssl: {
    ok: boolean;
    httpStatus: number | null;
    latencyMs: number | null;
    error: string | null;
  };
  hsts: {
    required: boolean;
    present: boolean;
    header: string | null;
    includesSubDomains: boolean;
    maxAge: number | null;
    detail: string;
  };
  overall: "pass" | "warn" | "fail";
}

export interface DomainStatusReport {
  generatedAt: string;
  expectedIp: string;
  domains: DomainStatus[];
  overall: "pass" | "warn" | "fail";
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data: allowed, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"],
  });
  if (error) throw new Error(error.message);
  if (!allowed) throw new Error("Forbidden");
}

async function dohLookupA(host: string): Promise<string[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=A`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`DoH ${res.status}`);
  const j: any = await res.json();
  const answers: any[] = j?.Answer ?? [];
  return answers.filter((a) => a.type === 1).map((a) => String(a.data));
}

function parseHsts(header: string | null): { maxAge: number | null; includesSubDomains: boolean } {
  if (!header) return { maxAge: null, includesSubDomains: false };
  const lower = header.toLowerCase();
  const m = lower.match(/max-age\s*=\s*(\d+)/);
  return {
    maxAge: m ? Number(m[1]) : null,
    includesSubDomains: lower.includes("includesubdomains"),
  };
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
    ? `${hstsHeader}`
    : requireHsts
      ? "No Strict-Transport-Security header returned."
      : "No HSTS (optional for this host).";

  const overall: DomainStatus["overall"] =
    !dnsOk || !sslOk || (requireHsts && !hstsPresent)
      ? "fail"
      : requireHsts && !parsedHsts.includesSubDomains
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
    overall,
  };
}

export const getDomainStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DomainStatusReport> => {
    await assertAdmin(context);
    const domains = await Promise.all(
      DOMAINS.map((d) => inspect(d.host, d.role, d.requireHsts)),
    );
    const anyFail = domains.some((d) => d.overall === "fail");
    const anyWarn = domains.some((d) => d.overall === "warn");
    const overall: DomainStatusReport["overall"] = anyFail ? "fail" : anyWarn ? "warn" : "pass";
    return {
      generatedAt: new Date().toISOString(),
      expectedIp: EXPECTED_IP,
      domains,
      overall,
    };
  });
