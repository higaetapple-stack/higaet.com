import { createFileRoute, notFound } from "@tanstack/react-router";
import { CompanyDetailPage, buildCompanyHead } from "@/components/site/CompanyDetailPage";
import { getCompanyPage } from "@/content/company";

export const Route = createFileRoute("/technologies/company/$slug")({
  loader: ({ params }) => {
    const page = getCompanyPage(params.slug);
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => (loaderData ? buildCompanyHead(loaderData.page) : {}),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-medium text-ink">Page not found</h1>
      <p className="mt-4 text-muted-foreground">
        That company page does not exist. Browse the company section index instead.
      </p>
      <a href="/technologies/company" className="mt-6 inline-block text-tech underline">
        Back to Company
      </a>
    </div>
  ),
  component: CompanyDetailRoute,
});

function CompanyDetailRoute() {
  const { page } = Route.useLoaderData();
  return <CompanyDetailPage content={page} />;
}
