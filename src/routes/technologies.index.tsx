import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  Building2,
  Cloud,
  Code2,
  Cpu,
  Database,
  GraduationCap,
  Heart,
  Landmark,
  Layers,
  Megaphone,
  Rocket,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Truck,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { ServiceHero } from "@/components/site/ServiceHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { StatBand } from "@/components/site/StatBand";
import { TrustedBy } from "@/components/site/TrustedBy";
import { FeatureGrid } from "@/components/site/FeatureGrid";
import { TechStackGrid } from "@/components/site/TechStackGrid";
import { IndustryGrid, type Industry } from "@/components/site/IndustryCard";
import { ProcessTimeline } from "@/components/site/ProcessTimeline";
import { CaseStudyCard, type CaseStudy } from "@/components/site/CaseStudyCard";
import { TestimonialCarousel, type Testimonial } from "@/components/site/TestimonialCarousel";
import { FAQ, faqJsonLd, type QA } from "@/components/site/FAQ";
import { CTASection } from "@/components/site/CTASection";
import { RelatedCluster } from "@/components/site/RelatedCluster";
import { LeadForm } from "@/components/site/LeadForm";
import { jsonLdScript } from "@/components/site/JsonLd";

const FAQS: QA[] = [
  {
    q: "What services does HIGAET Technologies provide?",
    a: "Custom software development, applied AI and machine learning, SaaS product development, cloud and DevOps, data engineering, product design, and ongoing maintenance — delivered as full-team engagements or staff augmentation.",
  },
  {
    q: "Which engagement models do you support?",
    a: "Dedicated development teams, staff augmentation, fixed-scope project delivery, and offshore development centers. Each model is matched to the customer's roadmap, governance, and budget envelope.",
  },
  {
    q: "How do you approach AI projects?",
    a: "We start with use-case discovery, define evaluation criteria, build retrieval and tool layers around a model, then ship a working pilot before scaling. Governance, safety, and cost controls are designed in from day one.",
  },
  {
    q: "Can you integrate with our existing systems?",
    a: "Yes. We work with REST and GraphQL APIs, event streams, data warehouses, identity providers, and legacy databases. Most engagements include an integration plan as part of discovery.",
  },
  {
    q: "Where are your teams located?",
    a: "HIGAET Technologies operates as a globally distributed team across India, the Middle East, and partner hubs in Europe and North America, allowing follow-the-sun delivery and on-site visits when needed.",
  },
  {
    q: "How do you protect our data and IP?",
    a: "All engagements are covered by NDA and a master services agreement that assigns IP to the client. We follow SOC 2 aligned controls, least-privilege access, and secure coding standards.",
  },
];

const INDUSTRIES: Industry[] = [
  { icon: GraduationCap, name: "Education", body: "Learning platforms, admissions workflows, faculty tools, and AI tutors built for measurable student outcomes." },
  { icon: Heart, name: "Healthcare", body: "Patient portals, clinical workflows, and AI-assisted decision support designed around privacy and compliance." },
  { icon: Landmark, name: "Finance & FinTech", body: "Banking workflows, payments, KYC, risk scoring, and embedded finance with strict security baselines." },
  { icon: ShoppingBag, name: "Retail & E-commerce", body: "Storefronts, marketplaces, fulfillment integrations, and AI personalization that improves basket and retention." },
  { icon: Truck, name: "Logistics & Manufacturing", body: "Ops dashboards, IoT telemetry, route optimization, and AI quality inspection for industrial environments." },
  { icon: Building2, name: "Enterprise & SaaS", body: "Internal platforms, partner portals, and multi-tenant SaaS products designed for scale and governance." },
];

export const Route = createFileRoute("/technologies/")({
  head: () => ({
    meta: [
      { title: "HIGAET Technologies — Enterprise AI & Software" },
      {
        name: "description",
        content:
          "HIGAET Technologies delivers intelligent digital solutions for businesses, educational institutions, startups, and enterprises. Specializing in software development, AI solutions, cloud technologies, automation, and digital transformation.",
      },
      { property: "og:title", content: "HIGAET Technologies — Enterprise AI & Software" },
      {
        property: "og:description",
        content:
          "Intelligent digital solutions for businesses, educational institutions, startups, and enterprises. Software development, AI, cloud, automation, and digital transformation.",
      },
      { property: "og:url", content: "https://higaet.com/technologies" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://higaet.com/og-higaet.png" },
    ],
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        name: "HIGAET Technologies",
        url: "/technologies",
        description:
          "Enterprise software, applied AI, SaaS, cloud, and product engineering services.",
        areaServed: "Global",
        parentOrganization: { "@type": "Organization", name: "HIGAET" },
        makesOffer: [
          "Custom Software Development",
          "AI Solutions",
          "SaaS Product Development",
          "Cloud & DevOps",
          "Data Engineering",
          "Digital Marketing",
        ].map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s } })),
      }),
      jsonLdScript(faqJsonLd(FAQS)),
    ],
  }),
  component: TechHome,
});

function TechHome() {
  return (
    <>
      <ServiceHero
        brand="tech"
        eyebrow="HIGAET Technologies"
        title="Intelligent digital solutions that drive growth."
        subtitle="The technology and innovation division of HIGAET, delivering software development, AI solutions, enterprise applications, cloud technologies, automation, and digital transformation for businesses, institutions, startups, and enterprises worldwide."
        primaryHref="/technologies/contact"
        primaryLabel="Start a project"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
        highlights={[
          "Senior engineers, no churn or staffing roulette",
          "AI delivery with evaluations, guardrails, and ROI",
          "Cloud-native architecture from day one",
          "SOC 2-aligned controls and IP assignment",
        ]}
      />

      <TrustedBy />

      {/* Company overview */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.3fr] lg:items-end">
          <div>
            <Eyebrow brand="tech">About</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              The technology and innovation division of HIGAET.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty max-w-[60ch]">
            HIGAET Technologies is dedicated to delivering intelligent digital solutions for businesses,
            educational institutions, startups, and enterprises. We specialize in software development,
            artificial intelligence solutions, enterprise applications, cloud technologies, automation,
            digital transformation, IT consulting, and custom technology services that help organizations
            innovate, optimize operations, and achieve sustainable growth.
          </p>
        </div>
      </Section>

      {/* Vision & Mission */}
      <Section className="bg-muted/40">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow brand="tech">Vision</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              A globally recognized AI-driven education and technology ecosystem.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-[44ch]">
              To empower individuals and organizations through innovation, intelligent learning, and digital transformation.
            </p>
          </div>
          <div>
            <Eyebrow brand="tech">Mission</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              Connecting education, technology, and careers.
            </h2>
            <ul className="mt-5 space-y-3 text-muted-foreground leading-relaxed max-w-[48ch]">
              <li className="flex gap-3">
                <span className="text-tech mt-1">●</span>
                <span>Deliver high-quality, industry-relevant education enhanced by artificial intelligence.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-tech mt-1">●</span>
                <span>Simplify access to global education opportunities through innovative digital solutions.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-tech mt-1">●</span>
                <span>Develop advanced technology products and AI-powered solutions that address real-world challenges.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-tech mt-1">●</span>
                <span>Connect education, technology, and career development within a unified digital ecosystem.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-tech mt-1">●</span>
                <span>Foster lifelong learning, innovation, collaboration, and professional growth worldwide.</span>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <StatBand
        stats={[
          { value: "60+", label: "Enterprise engagements" },
          { value: "15+", label: "Live SaaS products" },
          { value: "120+", label: "Engineers & researchers" },
          { value: "12", label: "Countries served" },
        ]}
      />

      {/* Core services */}
      <Section id="services">
        <Eyebrow brand="tech">Core services</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[34ch] text-balance">
          A full engineering stack — without the agency tax.
        </h2>
        <FeatureGrid
          brand="tech"
          columns={3}
          features={[
            { icon: Code2, title: "Custom software development", body: "Web, mobile, and platform engineering with senior squads owning architecture, delivery, and quality." },
            { icon: Brain, title: "AI & machine learning", body: "Retrieval systems, agents, evaluations, and AI ops — designed for production reliability, not demo theatre." },
            { icon: Rocket, title: "SaaS product development", body: "Discovery, MVP, billing, multi-tenant architecture, and growth instrumentation for new and scaling SaaS." },
            { icon: Cloud, title: "Cloud & DevOps", body: "AWS, Azure, and GCP foundations with infrastructure as code, CI/CD, observability, and FinOps controls." },
            { icon: Database, title: "Data engineering & BI", body: "Pipelines, warehouses, semantic layers, and dashboards that turn raw data into trustworthy decisions." },
            { icon: Smartphone, title: "Mobile applications", body: "Native iOS, Android, and cross-platform apps with shared design systems and a single release cadence." },
            { icon: Workflow, title: "Digital transformation", body: "Legacy modernization, integration, and workflow automation roadmaps for established enterprises." },
            { icon: ShieldCheck, title: "QA, security & accessibility", body: "Test automation, security review, performance hardening, and WCAG accessibility built into delivery." },
            { icon: Settings, title: "Maintenance & SRE", body: "24/7 monitoring, incident response, and continuous improvement for the systems we — and you — ship." },
          ]}
        />
      </Section>

      {/* AI solutions deep dive */}
      <Section id="ai" className="bg-muted/40">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Eyebrow brand="tech">AI solutions</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              Applied AI that ships, evaluated end-to-end.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-[44ch]">
              We turn AI from prototype into production with the surrounding scaffolding —
              retrieval, tools, guardrails, evaluations, and observability.
            </p>
            <Link
              to="/technologies/ai-solutions"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-tech hover:opacity-80"
            >
              Explore AI solutions <ArrowRight className="size-4" />
            </Link>
          </div>
          <FeatureGrid
            brand="tech"
            columns={2}
            features={[
              { icon: Sparkles, title: "Generative AI products", body: "Copilots, summarization, drafting, and creative tools built around your data and workflows." },
              { icon: Brain, title: "Retrieval & knowledge", body: "RAG pipelines, vector and hybrid search, document workflows, and citation-grade answers." },
              { icon: Workflow, title: "Agents & automation", body: "Multi-step task automation with human-in-the-loop, tool use, and escalation paths." },
              { icon: ShieldCheck, title: "Evaluations & governance", body: "Quality, safety, cost, and drift metrics so teams can trust outputs and improve over time." },
            ]}
          />
        </div>
      </Section>

      {/* Industries */}
      <Section id="industries">
        <Eyebrow brand="tech">Industries</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[32ch] text-balance">
          Engineering grounded in the realities of your industry.
        </h2>
        <IndustryGrid industries={INDUSTRIES} columns={3} />
      </Section>

      {/* Technology stack */}
      <Section id="stack" className="bg-muted/40">
        <Eyebrow brand="tech">Technology stack</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-4 max-w-[40ch] text-balance">
          A modern, carefully selected technology stack built for scale.
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-[60ch] mb-12">
          We choose the right technologies for each project to deliver reliable, future-ready digital solutions. Our stack is built for scalability, performance, security, and long-term maintainability.
        </p>
        <TechStackGrid
          groups={[
            { title: "Frontend Engineering", items: ["React", "Next.js", "Angular", "Vue.js", "TypeScript", "Tailwind CSS", "HTML5", "CSS3", "JavaScript (ES6+)"] },
            { title: "Backend Engineering", items: ["Node.js", "Express.js", "Python", "Java", ".NET", "Go", "PHP"] },
            { title: "Mobile Development", items: ["React Native", "Flutter", "Swift (iOS)", "Kotlin (Android)"] },
            { title: "AI & Machine Learning", items: ["OpenAI", "Anthropic", "PyTorch", "TensorFlow", "Hugging Face", "LangChain", "Pinecone", "Weaviate", "ChromaDB", "RAG Systems", "AI Agents", "Computer Vision", "NLP"] },
            { title: "Data Engineering & Databases", items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "ETL Pipelines", "Data Warehousing", "Analytics", "Business Intelligence"] },
            { title: "Cloud & Infrastructure", items: ["AWS", "Microsoft Azure", "Google Cloud", "Cloudflare", "Vercel", "Serverless Computing", "Object Storage", "CDN", "Load Balancing", "Managed Databases", "Virtual Machines"] },
            { title: "DevOps & Platform Engineering", items: ["Docker", "Kubernetes", "GitHub Actions", "GitLab CI/CD", "Jenkins", "Terraform", "Infrastructure as Code", "Monitoring & Logging"] },
            { title: "API Development & Integration", items: ["REST APIs", "GraphQL", "gRPC", "WebSockets", "OAuth 2.0", "JWT Authentication", "Third-party Integrations", "Payment Gateway Integration"] },
            { title: "Cybersecurity", items: ["Secure Coding", "Identity & Access Management", "Multi-factor Authentication", "Encryption", "OWASP Best Practices", "Vulnerability Assessment", "Security Audits", "Compliance Support"] },
            { title: "Enterprise Solutions", items: ["ERP Systems", "CRM Systems", "HRMS", "Learning Management Systems", "Student Information Systems", "Workflow Automation", "Document Management"] },
            { title: "Quality Engineering & Testing", items: ["Unit Testing", "Integration Testing", "End-to-End Testing", "Performance Testing", "Security Testing", "Test Automation", "Manual QA", "Jest", "Cypress", "Playwright", "Selenium"] },
            { title: "UI / UX Design", items: ["User Research", "Wireframing", "Prototyping", "Design Systems", "Accessibility", "Responsive Design", "Figma", "Adobe XD"] },
            { title: "Analytics & Observability", items: ["Google Analytics", "OpenTelemetry", "Grafana", "Prometheus", "ELK Stack", "Sentry", "Application Performance Monitoring (APM)"] },
            { title: "Emerging Technologies", items: ["Generative AI", "AI Agents", "Internet of Things (IoT)", "Blockchain", "Augmented Reality (AR)", "Virtual Reality (VR)", "Edge Computing", "Low-Code/No-Code Automation"] },
          ]}
        />
      </Section>

      {/* Development process */}
      <Section id="process">
        <Eyebrow brand="tech">Our process</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[32ch] text-balance">
          Discovery to delivery, with visibility at every step.
        </h2>
        <ProcessTimeline
          steps={[
            {
              title: "Discover",
              body: "Workshops, technical audits, and user research to size the opportunity and de-risk the build.",
              deliverables: ["Goals & KPIs", "Architecture sketch", "Roadmap"],
            },
            {
              title: "Design",
              body: "Information architecture, UX flows, design system, and prototypes validated with real users.",
              deliverables: ["UX flows", "Design system", "Prototype"],
            },
            {
              title: "Build",
              body: "Senior squads ship in two-week iterations with code review, automated testing, and demos.",
              deliverables: ["Working software", "CI/CD", "Test coverage"],
            },
            {
              title: "Launch",
              body: "Performance, security, and accessibility hardening, plus analytics and observability wired in.",
              deliverables: ["Go-live plan", "SLOs", "Runbooks"],
            },
            {
              title: "Operate",
              body: "Monitoring, incident response, and continuous improvement — measured against the KPIs you set.",
              deliverables: ["24/7 SRE", "Roadmap reviews"],
            },
            {
              title: "Iterate",
              body: "Quarterly planning loops grounded in product analytics, customer interviews, and business goals.",
              deliverables: ["Quarterly review", "Backlog refresh"],
            },
          ]}
        />
      </Section>

      {/* Why HIGAET */}
      <Section id="why" className="bg-muted/40">
        <Eyebrow brand="tech">Why HIGAET Technologies</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-12 max-w-[36ch] text-balance">
          The depth of an institute. The execution of a product team.
        </h2>
        <FeatureGrid
          brand="tech"
          columns={3}
          features={[
            { icon: Users, title: "Senior teams, low churn", body: "We staff with engineers we've trained ourselves through the HIGAET Academy talent pipeline." },
            { icon: Zap, title: "Product-minded delivery", body: "Squads obsess over user outcomes and KPIs, not just ticket throughput or hours billed." },
            { icon: ShieldCheck, title: "Enterprise-grade governance", body: "NDAs, IP assignment, SOC 2-aligned controls, and audit-friendly delivery artifacts on every engagement." },
            { icon: Layers, title: "Full-stack capability", body: "Strategy, design, engineering, AI, data, and SRE under one accountable team — not a chain of vendors." },
            { icon: Cpu, title: "Applied AI from day one", body: "Practical AI is in the DNA: every project considers where intelligent automation creates real leverage." },
            { icon: Rocket, title: "Skin in the game", body: "We co-build SaaS with select partners, sharing both delivery risk and long-term upside." },
          ]}
        />
      </Section>

      {/* Featured case studies */}
      <Section id="case-studies">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <Eyebrow brand="tech">Case studies</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[28ch]">
              Outcomes we've delivered for ambitious teams.
            </h2>
          </div>
          <Link
            to="/technologies/case-studies"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-tech"
          >
            View all case studies <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {CASE_STUDIES.map((cs) => (
            <CaseStudyCard key={cs.title} caseStudy={cs} />
          ))}
        </div>
      </Section>

      {/* Testimonials */}
      <Section className="bg-muted/40">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <Eyebrow brand="tech">Testimonials</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              What partners say about working with us.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              {/* TODO: Replace with verified customer quotes once consent is collected. */}
              Placeholder quotes — replace with verified partners.
            </p>
          </div>
          <TestimonialCarousel items={TESTIMONIALS} />
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Eyebrow brand="tech">FAQ</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              Answers to common questions.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Still curious? Talk to us directly — we'll route you to the right engineering lead.
            </p>
            <Link
              to="/technologies/contact"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-tech"
            >
              Contact the team <ArrowRight className="size-4" />
            </Link>
          </div>
          <FAQ items={FAQS} />
        </div>
      </Section>

      {/* Lead generation */}
      <Section id="contact" className="bg-muted/40">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Eyebrow brand="tech">Start a project</Eyebrow>
            <h2 className="mt-4 max-w-[20ch] font-display text-3xl md:text-4xl font-medium tracking-tight text-ink">
              Tell us what you're building.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed max-w-[48ch]">
              Share a few details and we'll come back within one business day with a recommended
              team shape, scope, and next steps.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><Megaphone className="size-4 mt-0.5 text-tech shrink-0" /> Response within 1 business day</li>
              <li className="flex gap-2"><ShieldCheck className="size-4 mt-0.5 text-tech shrink-0" /> NDA-ready conversations</li>
              <li className="flex gap-2"><Users className="size-4 mt-0.5 text-tech shrink-0" /> Direct line to a senior engineer</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8 [box-shadow:var(--shadow-card)]">
            <LeadForm division="tech" source="technologies_home" />
          </div>
        </div>
      </Section>

      <CTASection
        eyebrow="HIGAET Technologies"
        title="Engineer the next chapter of your product with HIGAET."
        body="A focused conversation. A clear plan. A team that can execute. Let's begin."
        primaryHref="/technologies/contact"
        primaryLabel="Start a project"
        secondaryHref="/technologies/case-studies"
        secondaryLabel="See case studies"
      />
    </>
  );
}

/* TODO: Replace placeholder case studies with real engagements once approved. */
const CASE_STUDIES: CaseStudy[] = [
  {
    industry: "EdTech",
    title: "AI tutor lifts learner completion by 34% across 12 cohorts.",
    summary:
      "Retrieval-grounded tutor with adaptive practice and faculty review tooling, deployed across an EMEA education network.",
    metrics: [
      { value: "+34%", label: "Completion" },
      { value: "−42%", label: "Support load" },
      { value: "12", label: "Cohorts" },
    ],
    stack: ["React", "Node.js", "Postgres", "OpenAI"],
    href: "/technologies/case-studies",
  },
  {
    industry: "FinTech",
    title: "KYC automation cuts onboarding time from 4 days to 9 minutes.",
    summary:
      "Document AI, risk scoring, and rules engine integrated into the bank's core platform, with full audit trails for regulators.",
    metrics: [
      { value: "9 min", label: "Onboarding" },
      { value: "99.4%", label: "Match rate" },
      { value: "SOC 2", label: "Compliance" },
    ],
    stack: ["Python", "AWS", "Postgres", "ML"],
    href: "/technologies/case-studies",
  },
  {
    industry: "SaaS",
    title: "Multi-tenant platform launched in 14 weeks with global day-one.",
    summary:
      "Greenfield SaaS with billing, RBAC, observability, and AI copilot — handed over to the customer's product team at launch.",
    metrics: [
      { value: "14 wks", label: "To launch" },
      { value: "8", label: "Regions" },
      { value: "99.95%", label: "Uptime" },
    ],
    stack: ["Next.js", "Node.js", "Kubernetes", "Postgres"],
    href: "/technologies/case-studies",
  },
];

/* TODO: Replace placeholder testimonials with verified customer quotes. */
const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "HIGAET Technologies operated like an extension of our product team. We shipped a multi-tenant platform on a timeline most agencies wouldn't have committed to.",
    name: "Avery Kapoor",
    role: "VP Engineering",
    org: "Confidential SaaS partner",
  },
  {
    quote:
      "Their applied AI team is the difference between a clever demo and a system we trust in production. Evaluations, guardrails, and observability were there from day one.",
    name: "Dr. Linh Tran",
    role: "Head of AI",
    org: "Global EdTech network",
  },
  {
    quote:
      "Senior engineers, sensible architecture, and a partner who actually owns delivery. We've consolidated three vendors into HIGAET.",
    name: "Marc Eliasson",
    role: "CTO",
    org: "European FinTech",
  },
];
