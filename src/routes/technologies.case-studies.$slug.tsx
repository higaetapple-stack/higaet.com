import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  CaseStudyDetailPage,
  buildCaseStudyHead,
} from "@/components/site/CaseStudyDetailPage";
import { CASE_STUDIES } from "@/content/case-studies";

export const Route = createFileRoute("/technologies/case-studies/$slug")({
  loader: ({ params }) => {
    const cs = CASE_STUDIES[params.slug];
    if (!cs) throw notFound();
    return cs;
  },
  head: ({ loaderData }) => (loaderData ? buildCaseStudyHead(loaderData) : { meta: [{ title: "Case Study Not Found" }] }),
  component: CaseStudyRoute,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <h1 className="font-display text-3xl text-ink">Case study not found.</h1>
      <p className="mt-4 text-muted-foreground">
        The case study you're looking for may have moved or is no longer available.
      </p>
    </div>
  ),
});

function CaseStudyRoute() {
  const cs = Route.useLoaderData();
  return <CaseStudyDetailPage content={cs} />;
}
