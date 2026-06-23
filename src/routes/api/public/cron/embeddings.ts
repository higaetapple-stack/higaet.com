// Phase 7.2 RAG — embedding worker.
// Public cron endpoint that drains ai_embeddings_queue, chunks pending documents,
// generates embeddings via Lovable AI, and writes them into ai_chunks.
//
// Auth: relies on /api/public/* bypass + Supabase anon `apikey` header (verified below).
// Trigger: pg_cron every minute (see setup migration in the data tool).

import { createFileRoute } from "@tanstack/react-router";
import { chunkText, embedTexts, toVectorLiteral } from "@/lib/ai-embeddings.server";

const BATCH = 5; // documents per run
// Phase 1.13: increased from 4 → 10 with exponential backoff so transient
// provider outages (429/503) don't dead-letter content prematurely.
const MAX_ATTEMPTS = 10;

export const Route = createFileRoute("/api/public/cron/embeddings")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKeyHeader = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!apiKeyHeader || apiKeyHeader !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        // Phase 1.13: removed hard-fail on OPENAI_API_KEY — embedTexts() now
        // falls over to OpenRouter, so the worker must run even if OpenAI is
        // unavailable. Provider key validation happens inside embedTexts().

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Lease pending queue rows
        const { data: queueRows, error: qErr } = await supabaseAdmin
          .from("ai_embeddings_queue")
          .select("id, document_id, attempts")
          .in("status", ["pending", "failed"])
          .lte("scheduled_for", new Date().toISOString())
          .lt("attempts", MAX_ATTEMPTS)
          .order("scheduled_for", { ascending: true })
          .limit(BATCH);
        if (qErr) return Response.json({ error: qErr.message }, { status: 500 });
        if (!queueRows || queueRows.length === 0) {
          return Response.json({ processed: 0 });
        }

        let processed = 0;
        let failed = 0;

        for (const row of queueRows) {
          if (!row.document_id) {
            await supabaseAdmin.from("ai_embeddings_queue")
              .update({ status: "dead", last_error: "missing document_id" })
              .eq("id", row.id);
            continue;
          }
          const documentId = row.document_id;
          try {
            // Mark in-flight
            await supabaseAdmin
              .from("ai_embeddings_queue")
              .update({ status: "processing", attempts: row.attempts + 1 })
              .eq("id", row.id);

            const { data: doc, error: dErr } = await supabaseAdmin
              .from("ai_documents")
              .select("id, content, collection_id")
              .eq("id", documentId)
              .maybeSingle();
            if (dErr) throw new Error(dErr.message);
            if (!doc || !doc.content) {
              await supabaseAdmin.from("ai_embeddings_queue")
                .update({ status: "completed", processed_at: new Date().toISOString() })
                .eq("id", row.id);
              continue;
            }

            const chunks = chunkText(doc.content ?? "");
            if (chunks.length === 0) {
              await supabaseAdmin.from("ai_embeddings_queue")
                .update({ status: "completed", processed_at: new Date().toISOString() })
                .eq("id", row.id);
              continue;
            }

            const vectors = await embedTexts(undefined, chunks);

            // Replace existing chunks for this document
            await supabaseAdmin.from("ai_chunks").delete().eq("document_id", doc.id);

            const insertRows = chunks.map((text, idx) => ({
              document_id: doc.id,
              collection_id: doc.collection_id,
              chunk_order: idx,
              chunk_text: text,
              embedding: toVectorLiteral(vectors[idx]) as unknown as string,
              embedding_status: "completed",
              embedded_at: new Date().toISOString(),
            }));
            const { error: insErr } = await supabaseAdmin.from("ai_chunks").insert(insertRows);
            if (insErr) throw new Error(insErr.message);

            await supabaseAdmin.from("ai_documents")
              .update({ embedding_status: "completed", chunk_status: "completed" })
              .eq("id", doc.id);

            await supabaseAdmin.from("ai_embeddings_queue")
              .update({ status: "completed", processed_at: new Date().toISOString(), last_error: null })
              .eq("id", row.id);

            processed += 1;
          } catch (err) {
            failed += 1;
            const msg = err instanceof Error ? err.message : String(err);
            const nextAttempt = row.attempts + 1;
            const backoffMs = Math.min(60_000 * 2 ** nextAttempt, 30 * 60_000);
            await supabaseAdmin
              .from("ai_embeddings_queue")
              .update({
                status: nextAttempt >= MAX_ATTEMPTS ? "dead" : "failed",
                last_error: msg.slice(0, 1000),
                scheduled_for: new Date(Date.now() + backoffMs).toISOString(),
              })
              .eq("id", row.id);
            console.error("[cron/embeddings] document failed", row.document_id, msg);
          }
        }

        return Response.json({ processed, failed });
      },
    },
  },
});
