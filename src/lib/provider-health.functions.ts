import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

type PingResult = {
  provider: string;
  model: string;
  status: number | "NO_KEY" | "ERROR";
  latency_ms: number;
  error?: string;
};

async function pingChat(opts: {
  provider: string;
  url: string;
  key: string | undefined;
  model: string;
  authHeader?: string;
}): Promise<PingResult> {
  if (!opts.key) {
    return { provider: opts.provider, model: opts.model, status: "NO_KEY", latency_ms: 0 };
  }
  const start = Date.now();
  try {
    const res = await fetch(opts.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: opts.authHeader ?? `Bearer ${opts.key}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages: [{ role: "user", content: "Ping" }],
        max_tokens: 5,
      }),
    });
    const latency_ms = Date.now() - start;
    let error: string | undefined;
    if (!res.ok) {
      const text = await res.text();
      error = text.slice(0, 200);
    }
    return { provider: opts.provider, model: opts.model, status: res.status, latency_ms, error };
  } catch (e) {
    return {
      provider: opts.provider,
      model: opts.model,
      status: "ERROR",
      latency_ms: Date.now() - start,
      error: (e as Error).message,
    };
  }
}

export const runProviderHealthCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const checks = await Promise.all([
      pingChat({
        provider: "openai",
        url: "https://api.openai.com/v1/chat/completions",
        key: process.env.OPENAI_API_KEY,
        model: "gpt-4o-mini",
      }),
      pingChat({
        provider: "groq",
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: process.env.GROQ_API_KEY,
        model: "llama-3.3-70b-versatile",
      }),
      pingChat({
        provider: "groq",
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: process.env.GROQ_API_KEY,
        model: "llama-3.1-8b-instant",
      }),
      pingChat({
        provider: "openrouter",
        url: "https://openrouter.ai/api/v1/chat/completions",
        key: process.env.OPENROUTER_API_KEY,
        model: "meta-llama/llama-3.3-70b-instruct",
      }),
      pingChat({
        provider: "google",
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        key: process.env.GEMINI_API_KEY,
        model: "gemini-2.0-flash",
      }),
    ]);

    return { checked_at: new Date().toISOString(), results: checks };
  });

export const getProviderHealthMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ hours: z.number().int().min(1).max(168).default(24) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const since = new Date(Date.now() - data.hours * 3600_000).toISOString();

    const { data: rows, error } = await sb
      .from("ai_usage")
      .select("provider, model, outcome, latency_ms, cost_usd, error_code, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) throw new Error(error.message);

    type Agg = {
      provider: string;
      model: string;
      requests: number;
      success: number;
      fallback: number;
      failure: number;
      latency_total: number;
      cost_total: number;
      last_success?: string;
      last_failure?: string;
    };
    const map = new Map<string, Agg>();
    for (const r of rows ?? []) {
      const key = `${r.provider}::${r.model}`;
      let a = map.get(key);
      if (!a) {
        a = {
          provider: r.provider,
          model: r.model,
          requests: 0,
          success: 0,
          fallback: 0,
          failure: 0,
          latency_total: 0,
          cost_total: 0,
        };
        map.set(key, a);
      }
      a.requests++;
      a.latency_total += r.latency_ms ?? 0;
      a.cost_total += Number(r.cost_usd ?? 0);
      if (r.outcome === "success") {
        a.success++;
        if (!a.last_success) a.last_success = r.created_at;
      } else if (r.outcome === "fallback") {
        a.fallback++;
      } else {
        a.failure++;
        if (!a.last_failure) a.last_failure = r.created_at;
      }
    }

    const providers = Array.from(map.values()).map((a) => ({
      provider: a.provider,
      model: a.model,
      requests: a.requests,
      success_rate: a.requests ? a.success / a.requests : 0,
      fallback_rate: a.requests ? a.fallback / a.requests : 0,
      error_rate: a.requests ? a.failure / a.requests : 0,
      avg_latency_ms: a.requests ? Math.round(a.latency_total / a.requests) : 0,
      cost_usd: Number(a.cost_total.toFixed(4)),
      last_success: a.last_success ?? null,
      last_failure: a.last_failure ?? null,
    }));

    const totals = {
      requests: rows?.length ?? 0,
      success: providers.reduce((s, p) => s + Math.round(p.success_rate * p.requests), 0),
      failure: providers.reduce((s, p) => s + Math.round(p.error_rate * p.requests), 0),
      fallback: providers.reduce((s, p) => s + Math.round(p.fallback_rate * p.requests), 0),
      cost_usd: Number(providers.reduce((s, p) => s + p.cost_usd, 0).toFixed(4)),
    };

    return { since, totals, providers };
  });
