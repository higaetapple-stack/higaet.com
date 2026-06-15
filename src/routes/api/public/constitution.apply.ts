import { createFileRoute } from "@tanstack/react-router";
import { applyAmendment } from "@/lib/constitution/executor";
import { getConstitution, getHistory, rollback } from "@/lib/constitution/store";
import type { ConstitutionAmendment } from "@/lib/constitution/amendments";

export const Route = createFileRoute("/api/public/constitution/apply")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({ current: getConstitution(), history: getHistory() }),
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          amendment?: ConstitutionAmendment;
          rollbackTo?: number;
        };

        if (typeof body.rollbackTo === "number") {
          const v = rollback(body.rollbackTo);
          if (!v) return new Response("Version not found", { status: 404 });
          return Response.json({ status: "rolled_back", version: v });
        }

        if (!body.amendment) {
          return new Response("Missing amendment", { status: 400 });
        }

        const result = applyAmendment(body.amendment);
        const status = result.status === "applied" ? 200 : 400;
        return Response.json(
          result.status === "applied"
            ? {
                status: "applied",
                newVersion: result.version.version,
                appliedAmendments: result.version.appliedAmendments,
              }
            : { status: "rejected", reason: result.reason },
          { status },
        );
      },
    },
  },
});
