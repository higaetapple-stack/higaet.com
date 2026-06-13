import { createFileRoute, notFound } from "@tanstack/react-router";
import { InsightDetailPage, buildInsightHead } from "@/components/site/InsightDetailPage";
import { getInsight } from "@/content/insights";

export const Route = createFileRoute("/technologies/insights/$slug")({
  loader: ({ params }) => {
    const insight = getInsight(params.slug);
    if (!insight) throw notFound();
    return { insight };
  },
  head: ({ loaderData }) => (loaderData ? buildInsightHead(loaderData.insight) : {}),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-medium text-ink">Article not found</h1>
      <p className="mt-4 text-muted-foreground">
        That article may have been moved or unpublished. Browse the latest from our team instead.
      </p>
      <a href="/technologies/insights" className="mt-6 inline-block text-tech underline">
        Back to Insights
      </a>
    </div>
  ),
  component: InsightDetailRoute,
});

function InsightDetailRoute() {
  const { insight } = Route.useLoaderData();
  return <InsightDetailPage content={insight} />;
}
