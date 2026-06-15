import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";
import {
  getAcademyBreadcrumbs,
  getAcademyCourses,
  resolveCategoryById,
  academyCategoryUrl,
} from "@/content/providers";
import {
  buildAcademyHeadMeta,
  buildBreadcrumbJsonLd,
  buildCollectionJsonLd,
} from "@/lib/seo/academy-metadata";

export const Route = createFileRoute("/academy/certifications")({
  head: async () => {
    const category = await resolveCategoryById("academy_category_certifications");
    const path = category ? academyCategoryUrl(category) : "/academy/certifications";
    if (!category) {
      return buildAcademyHeadMeta({
        title: "AI Certifications — HIGAET Academy",
        description:
          "HIGAET Academy certifications for Generative AI, applied engineering, and job-ready software development skills.",
        path,
      });
    }
    const courses = await getAcademyCourses({ filter: { categoryId: category.id } });
    const trail = await getAcademyBreadcrumbs(path);
    return {
      ...buildAcademyHeadMeta({
        title: category.metadata.title,
        description: category.metadata.description,
        path,
      }),
      scripts: [
        buildCollectionJsonLd(category, courses, path),
        ...(trail.length ? [buildBreadcrumbJsonLd(trail)] : []),
      ],
    };
  },
  component: CertificationsPage,
});

function CertificationsPage() {
  return (
    <DivisionDetailPage
      brand="academy"
      eyebrow="Certifications"
      title="Verified AI credentials built around real capability."
      subtitle="Credentials that connect learning outcomes to practical projects, assessments, and role-aligned skill evidence."
      overviewTitle="Certification with evidence, not just attendance."
      overviewBody="HIGAET credentials are designed to show what a learner can build, explain, and improve across modern AI engineering workflows."
      points={[
        { title: "Role-aligned tracks", body: "Credential paths mapped to AI engineer, prompt engineer, analyst, and software roles." },
        { title: "Project assessment", body: "Evaluation based on applied assignments and capstones rather than passive completion." },
        { title: "Verified records", body: "Completion records that support admissions, hiring, and internal upskilling conversations." },
        { title: "Upgrade pathways", body: "Move from foundational certificates into advanced programs and internships." },
      ]}
      outcomes={[
        "Clear credential signal for employers and academic applications.",
        "Portfolio artifacts linked to assessed learning outcomes.",
        "Defined progression from beginner to advanced AI engineering.",
        "Stronger confidence in interviews and technical discussions.",
      ]}
      ctaTitle="Find the certification that fits your goal."
      ctaBody="Tell us your target role and current skill level; we’ll recommend a practical route."
      primaryLabel="Ask for guidance"
      secondaryHref="/academy/online-courses"
      secondaryLabel="Online courses"
    />
  );
}
