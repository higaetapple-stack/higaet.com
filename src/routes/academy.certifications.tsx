import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/academy/certifications")({
  head: () => ({
    meta: [
      { title: "AI Certifications — HIGAET Academy" },
      { name: "description", content: "HIGAET Academy certifications for Generative AI, applied engineering, and job-ready software development skills." },
    ],
    links: [{ rel: "canonical", href: "/academy/certifications" }],
  }),
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