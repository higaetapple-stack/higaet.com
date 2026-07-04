/**
 * PR risk evaluation endpoint — advisory only. Verifies a shared-secret
 * header before running the gate so CI is the only allowed caller.
 *
 * POST { prNumber?: number, diff?: string, outcome?: { prNumber, outcome, signals } }
 *   - Provide `diff` directly OR `prNumber` to fetch via GITHUB_TOKEN.
 *   - Provide `outcome` to feed the self-learning model (RIV feedback loop).
 */

import { createFileRoute } from "@tanstack/react-router";
import { getPRDiff } from "@/lib/risk/github-diff";
import { evaluatePR } from "@/lib/risk/gate";
import { recordOutcome, type PROutcome } from "@/lib/risk/learning";
import {
  recordPrediction,
  summarizeAccuracy,
  type ActualOutcome,
} from "@/lib/risk/accuracy";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-risk-secret, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/risk/evaluate-pr")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const secret = process.env.RISK_GATE_SECRET;
        if (!secret) {
          return new Response(
            JSON.stringify({ error: "RISK_GATE_SECRET not configured" }),
            { status: 503, headers: { ...cors, "Content-Type": "application/json" } },
          );
        }
        if (request.headers.get("x-risk-secret") !== secret) return unauthorized();

        let body: {
          prNumber?: number;
          diff?: string;
          outcome?: { prNumber: number; outcome: PROutcome; signals: string[] };
        };
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "invalid json" }), {
            status: 400,
            headers: { ...cors, "Content-Type": "application/json" },
          });
        }

        if (body.outcome) {
          recordOutcome(body.outcome);
        }

        let diff = body.diff;
        if (!diff && typeof body.prNumber === "number") {
          try {
            diff = await getPRDiff(body.prNumber);
          } catch (err) {
            return new Response(
              JSON.stringify({ error: (err as Error).message }),
              { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
            );
          }
        }

        if (!diff) {
          return new Response(
            JSON.stringify({
              ok: true,
              learnedOnly: Boolean(body.outcome),
              message: "no diff supplied",
            }),
            { headers: { ...cors, "Content-Type": "application/json" } },
          );
        }

        const result = await evaluatePR(diff);
        return new Response(JSON.stringify(result), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      },
    },
  },
});
