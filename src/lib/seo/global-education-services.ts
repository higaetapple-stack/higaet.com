import type { ServiceSchemaInput } from "@/lib/seo/service-schema";

const baseCrumbs = (last: { name: string; url: string }) => [
  { name: "Home", url: "/" },
  { name: "Global Education Hub", url: "/global-education" },
  last,
];

export const SERVICE_SCHEMAS: Record<string, ServiceSchemaInput> = {
  "visa-guidance": {
    path: "/global-education/visa-guidance",
    name: "Student Visa Guidance",
    description:
      "Documentation, financial readiness, mock interviews, and pre-departure preparation for student visas.",
    serviceType: "Visa Guidance",
    areaServed: ["USA", "UK", "Canada", "Australia", "Europe"],
    howTo: {
      name: "How to prepare a student visa file",
      steps: [
        { name: "Document checklist", text: "Organize admission letters, IDs, financial evidence, academic records, and supporting files." },
        { name: "Financial readiness", text: "Review funds, deposits, sponsors, and country-specific proof requirements." },
        { name: "Mock interview", text: "Practice clear answers around study intent, funding, and future plans." },
        { name: "Pre-departure", text: "Coordinate travel, accommodation, insurance, and arrival preparation." },
      ],
    },
    faqs: [
      { q: "Do you guide visas for all destinations?", a: "Yes — primarily USA, UK, Canada, Australia, and Europe, with destination-specific document rules." },
      { q: "When should I start visa prep?", a: "Begin as soon as conditional offers arrive; financial documents often need 3–6 months of history." },
    ],
    breadcrumbs: baseCrumbs({ name: "Visa Guidance", url: "/global-education/visa-guidance" }),
  },
  "admission-process": {
    path: "/global-education/admission-process",
    name: "International Admissions Process",
    description:
      "Step-by-step counselling for shortlisting, applications, scholarships, offers, visa support, and pre-departure planning.",
    serviceType: "Application Support",
    howTo: {
      name: "How HIGAET runs the international admissions process",
      steps: [
        { name: "Profile & goal review", text: "Clarify destination, course, budget, academic fit, and timeline." },
        { name: "Shortlisting", text: "Create ambition, fit, and safety university options across regions." },
        { name: "Applications", text: "Prepare documents, SOPs, recommendations, and submissions with deadline control." },
        { name: "Offer to visa", text: "Support offer decisions, deposits, visa documentation, and pre-departure planning." },
      ],
    },
    faqs: [
      { q: "How long is the typical admissions cycle?", a: "Plan 9–12 months from shortlisting to departure for most destinations." },
      { q: "Do you support scholarship applications?", a: "Yes — scholarship planning is integrated into the application timeline." },
    ],
    breadcrumbs: baseCrumbs({ name: "Admission Process", url: "/global-education/admission-process" }),
  },
  "student-services": {
    path: "/global-education/student-services",
    name: "International Student Services",
    description:
      "Pre-departure orientation, accommodation guidance, travel readiness, and transition support for international students.",
    serviceType: "Student Support",
    howTo: {
      name: "How HIGAET supports students after admission",
      steps: [
        { name: "Pre-departure session", text: "Prepare for academics, culture, finances, travel, and campus expectations." },
        { name: "Accommodation", text: "Compare housing options, deposits, timelines, and location trade-offs." },
        { name: "Travel planning", text: "Coordinate arrival windows, documents, insurance, and airport readiness." },
        { name: "Transition", text: "Organize early on-ground steps after landing and starting university." },
      ],
    },
    faqs: [
      { q: "Is student support available after travel?", a: "Yes — transition support continues into the first weeks on campus." },
    ],
    breadcrumbs: baseCrumbs({ name: "Student Services", url: "/global-education/student-services" }),
  },
  "study-abroad": {
    path: "/global-education/study-abroad",
    name: "Study Abroad Counselling",
    description:
      "Counselling, university shortlisting, applications, scholarships, and visa guidance for students pursuing global education.",
    serviceType: "University Counseling",
    howTo: {
      name: "How to plan a study abroad application with HIGAET",
      steps: [
        { name: "Profile review", text: "Assess academics, goals, budget, timelines, and destination preferences." },
        { name: "Program matching", text: "Map student profiles to practical university and course options." },
        { name: "Application support", text: "Coordinate documentation, SOPs, recommendations, and submission timelines." },
        { name: "Visa planning", text: "Prepare financial, academic, and personal documentation for the visa stage." },
      ],
    },
    faqs: [
      { q: "Which destinations does HIGAET support?", a: "USA, UK, Canada, Australia, and selected European destinations." },
      { q: "Do you help with SOP and LOR?", a: "Yes — SOP and LOR coaching is included in application support." },
    ],
    breadcrumbs: baseCrumbs({ name: "Study Abroad", url: "/global-education/study-abroad" }),
  },
  universities: {
    path: "/global-education/universities",
    name: "University Selection & Shortlisting",
    description:
      "Curated university selection across destinations with ranking, fit, tuition, and outcome considerations.",
    serviceType: "University Selection",
    faqs: [
      { q: "How are universities shortlisted?", a: "By academic fit, budget, destination, ranking band, and program strength." },
    ],
    breadcrumbs: baseCrumbs({ name: "Universities", url: "/global-education/universities" }),
  },
  scholarships: {
    path: "/global-education/scholarships",
    name: "Scholarship Guidance",
    description: "Scholarship discovery, eligibility checks, and application coordination for international study.",
    serviceType: "Scholarship Guidance",
    breadcrumbs: baseCrumbs({ name: "Scholarships", url: "/global-education/scholarships" }),
  },
};
