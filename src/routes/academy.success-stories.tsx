import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";
import { getAcademyTestimonials, getAcademyBreadcrumbs } from "@/content/providers";
import {
  buildAcademyHeadMeta,
  buildBreadcrumbJsonLd,
  buildReviewsJsonLd,
} from "@/lib/seo/academy-metadata";

export const Route = createFileRoute("/academy/success-stories")({
  head: () => {
    const path = "/academy/success-stories";
    const testimonials = getAcademyTestimonials();
    const trail = getAcademyBreadcrumbs(path);
    return {
      ...buildAcademyHeadMeta({
        title: "Learner Success Stories — HIGAET Academy",
        description:
          "Stories from HIGAET Academy learners building careers in AI engineering, software, and applied technology roles.",
        path,
      }),
      scripts: [
        buildReviewsJsonLd(testimonials),
        ...(trail.length ? [buildBreadcrumbJsonLd(trail)] : []),
      ],
    };
  },
  component: SuccessStoriesPage,
});

function SuccessStoriesPage() {
  return (
    <DivisionDetailPage
      brand="academy"
      eyebrow="Success stories"
      title="Learners turning AI skills into career momentum."
      subtitle="A growing record of learner outcomes across projects, internships, certifications, and placement journeys."
      overviewTitle="Progress shown through real learner journeys."
      overviewBody="Success stories highlight the practical path from enrolment to capability: coursework, capstones, mentoring, interviews, and career movement."
      points={[
        { title: "Project growth", body: "Learners build increasingly complex AI and software projects across their program journey." },
        { title: "Career transitions", body: "Stories focus on skill shifts, interview readiness, and movement into new opportunities." },
        { title: "Mentor impact", body: "Feedback loops help learners refine both technical output and professional communication." },
        { title: "Outcome evidence", body: "Each story connects claims to artifacts, assessments, or career milestones." },
      ]}
      outcomes={[
        "Examples of learning paths for different backgrounds and goals.",
        "Signals of what successful Academy learners consistently practice.",
        "Portfolio and preparation patterns that support placement readiness.",
        "A clearer view of the Academy learner experience.",
      ]}
      ctaTitle="Start building your own success story."
      ctaBody="Talk to admissions about the program route that matches your current level and career goal."
      primaryLabel="Talk to admissions"
      secondaryHref="/academy/placements"
      secondaryLabel="Placement support"
    />
  );
}
