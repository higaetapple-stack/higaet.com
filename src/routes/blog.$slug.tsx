import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { metaEvents } from "@/lib/analytics-events";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";

const POSTS: Record<
  string,
  {
    title: string;
    excerpt: string;
    content: string;
    date: string;
    tag: string;
    readTime: string;
  }
> = {
  "generative-ai-engineering": {
    title: "Generative AI Engineering: The Complete Foundational Guide",
    excerpt: "Learn standard practices for Generative AI Engineering: RAG, AI Agents, MCP, Prompt Engineering, Evaluation, and deployment.",
    date: "2026-09-27",
    tag: "AI & Generative Intelligence",
    readTime: "15 min read",
    content: `
<h1>Generative AI Engineering: The Complete Foundational Guide</h1>
<h2>Introduction</h2>
<p>Generative AI engineering is the discipline of turning large language models into software people can rely on. Calling an AI API takes minutes; shipping an AI product takes engineering.</p>
<h2>Quick Answer</h2>
<p>Generative AI engineering moves beyond just prompting models by wrapping them in structured systems that include retrieved knowledge (RAG), tool calling (Agents), structured outputs, memory, guardrails, and rigorous evaluation pipelines.</p>
<h2>Key Takeaways</h2>
<ul>
<li>**More than Prompts:** Systems demand engineering rigor.</li>
<li>**RAG & Agents:** Context and capability define modern architecture.</li>
<li>**Evaluations:** Testing must evolve from visual checks to automated harness testing.</li>
</ul>
<h2>What Is Generative AI Engineering?</h2>
<h3>Simple Explanation</h3>
<p>It's the process of building apps that use AI to generate text, images, or code reliably without making mistakes.</p>
<h3>Technical Definition</h3>
<p>The end-to-end practice of designing, building, orchestrating, and operating AI systems leveraging LLMs, retrievers (vector databases), tools, and multi-agent workflows.</p>
<h3>Formal Definition</h3>
<p>A specialized software engineering discipline bridging AI model capabilities with production reliability, applying MLOps, CI/CD, and strict evaluation metrics (AI Evals) to non-deterministic systems.</p>
<h2>Why Does Generative AI Engineering Matter?</h2>
<h3>Why It Matters Today</h3>
<p>It bridges the gap between impressive research demos and robust business applications.</p>
<h3>Industry Relevance</h3>
<p>Organizations demand deterministic results from probabilistic models to deploy them safely.</p>
<h3>Practical Relevance</h3>
<p>It solves "language-shaped" unstructured problems dynamically without hardcoding explicit paths.</p>
<h2>How Does Generative AI Engineering Work?</h2>
<h3>Step 1: Modeling & Prompting</h3>
<p>Selecting a foundation model and engineering structured, versioned prompts.</p>
<h3>Step 2: Context Retrieval</h3>
<p>Embedding internal documents and running vector similarity searches to ground answers.</p>
<h3>Step 3: Action & Orchestration</h3>
<p>Giving models tools via structured definitions to perform real-world actions.</p>
<h3>Step 4: Guardrails & Evals</h3>
<p>Checking inputs and outputs programmatically while evaluating system versions against a golden dataset.</p>
<h2>Generative AI System Architecture</h2>
<h3>Overview</h3>
<p>Modern architecture separates prompts, retrieval logic, agentic tool loops, and client orchestration.</p>
<h3>Components</h3>
<h4>Foundation Models and LLMs</h4>
<p>The reasoning and generation engine.</p>
<h4>Embeddings & Vector Search</h4>
<p>The semantic memory layer, organizing data by meaning rather than keywords.</p>
<h4>Orchestration layer</h4>
<p>The logic connecting context, history, and tools (e.g. ReAct, Plan-and-Execute).</p>
<h3>Workflow</h3>
<p>User Request -> Policy Guardrail -> Retriever -> Context Assembly -> LLM Generation -> Output Verification -> Client.</p>
<h2>Core Concepts</h2>
<ul>
<li>**Prompt Engineering:** Structuring requests, versioning, few-shot examples.</li>
<li>**Context Engineering:** Perfecting the data given to the model.</li>
<li>**Structured Outputs:** Ensuring API-ready data shapes (JSON, Schema).</li>
<li>**Tool Calling & MCP:** Using standard protocols like the Model Context Protocol to fetch live data.</li>
<li>**Memory:** Distinguishing short-term scratchpad from long-term episodic retrieval.</li>
</ul>
<h2>Real-World Applications & Industry Use Cases</h2>
<p>From legal document review to autonomous coding assistants, scalable customer support, and medical research synthesis.</p>
<h2>Examples & Case Study</h2>
<p>**Case Study: Automating Engineering Reviews**</p>
<p>An application that fetches pull requests, evaluates code quality via an LLM toolset, verifies build logs, and posts detailed findings automatically.</p>
<h2>AI Engineering vs ML Engineering vs Software Engineering</h2>
<ul>
<li>**Software Engineering:** Static logic and rules.</li>
<li>**ML Engineering:** Training weights and optimizing inference serving.</li>
<li>**AI Engineering:** Leveraging pre-trained foundation models into applications through prompts, RAG, and Agents.</li>
</ul>
<h2>Advantages & Limitations</h2>
<p>**Advantages:** Extreme flexibility, handling unstructured data, autonomous planning.</p>
<p>**Limitations:** Latency, high cost, non-determinism, and hallucinations if poorly grounded.</p>
<h2>Risks, Security, Privacy, Governance & Guardrails</h2>
<p>Implementing strict input sanitization against prompt injection, output filtering for brand safety, PII detection, and human-in-the-loop review for irreversible actions.</p>
<h2>Testing, Observability, Reliability & Deployment</h2>
<p>**Evaluation and AI Evals:** LLM-as-a-judge patterns against a baseline.</p>
<p>**Cost & Latency Optimization:** Local fast models routing complex tasks to heavier models.</p>
<p>**Infrastructure:** Tracing tools capturing prompt strings, tokens, and decisions continuously.</p>
<h2>How to Implement Generative AI</h2>
<p>Build smallest verifiable slice. Add retrieval. Add one tool. Add an eval dataset. Iterate.</p>
<h2>Practical Project: Production-Ready Generative AI Knowledge Assistant</h2>
<p>**Problem:** A corporate wiki is vast and search is broken.</p>
<p>**Requirements:** Accurate, cited answers reflecting only the knowledge base.</p>
<p>**Architecture & Data Flow:**</p>
<p>1. Ingestion of docs.</p>
<p>2. Chunking (200-500 words).</p>
<p>3. Embeddings generated and Vector Storage applied.</p>
<p>4. Retrieval fetching top-k chunks.</p>
<p>5. Prompt/context construction packing chunks and strict 'cite sources' rules.</p>
<p>6. Model generation delivering cited facts.</p>
<p>7. Evaluated for tone and security before returning to the UI.</p>
<h2>HIGAET Capstone: Enterprise Generative AI Engineering Platform</h2>
<p>**Enterprise Solution:** Design a unified gateway implementing the Model Context Protocol, hosting dedicated RAG stores for different departments, standardizing evaluation test runners in CI/CD, and enforcing corporate data governance natively across a multi-agent framework.</p>
<h2>Skills Required & Beginner → Advanced Learning Roadmap</h2>
<p>From basics (Python, API, basic prompt) to RAG (Vector DBs, embedding models) to Agents (tool orchestration, graphs) to Production (evaluations, CI/CD for prompts, guardrails).</p>
<h2>Career Applications</h2>
<p>AI Application Engineer, Platform AI Engineer, AI Operations.</p>
<h2>HIGAET Original Insight</h2>
<h3>Perspective</h3>
<p>AI Engineering is less about creating intelligence and more about constraining it.</p>
<h3>Framework</h3>
<p>The "Cone of Autonomy": start systems in a tight deterministic sleeve (RAG only) and expand tool permissions only as evaluations prove capability bounds.</p>
<h3>Methodology</h3>
<p>Treat prompts as software. Treat evaluation as primary, not an afterthought.</p>
<h2>Frequently Asked Questions</h2>
<p>**Q: Is RAG better than fine-tuning?**</p>
<p>A: Usually. RAG updates data instantly and prevents hallucinations with exact citations. Fine-tuning is better for teaching the model new structural behavior or tone.</p>
<h2>Conclusion</h2>
<p>Generative AI Engineering demands rigor. Demos are cheap, production is earned.</p>
<h2>Sources & References</h2>
<ul>
<li>HIGAET Knowledge Architecture documentation.</li>
<li>AI Architecture Patterns Guide ([HIGAET internal]).</li>
</ul>
<h2>Continue Learning</h2>
<ul>
<li>HIGAET Certified Generative AI Engineer</li>
<li>[Link to upcoming courses]</li>
</ul>
<p>---</p>
    `,
  },
  "ai-agents-mcp-protocol": {
    title: "AI Agents & MCP Protocol: A Practitioner's Integration Guide",
    excerpt: "How the Model Context Protocol standardizes agent-tool integration — from retrieval (RAG) through orchestration (ReAct) to evaluation and deployment.",
    date: "2026-09-30",
    tag: "AI & Generative Intelligence",
    readTime: "15 min read",
    content: `
      <h1>AI Agents &amp; MCP Protocol: A Practitioner's Integration Guide</h1>
      <h2>Quick Answer</h2>
      <p>The Model Context Protocol (MCP) standardizes how AI agents read context and call external tools — turning ad-hoc API stitching into structured, verifiable integration. Start with retrieval (RAG) only; expand agent capabilities only where evaluation proves safe bounds.</p>
      <h2>Why MCP Matters</h2>
      <p>MCP replaces fragile one-off integrations with a single interface: a server exposing tools and resources, a client assembling prompts and context, and a specification ensuring agreement. For practitioners, it is the integration layer between retrieval, orchestration, and deployment.</p>
      <h2>Core Concepts</h2>
      <h3>The MCP Server</h3>
      <p>A server exposes <code>resources</code> (read-only data) and <code>tools</code> (actions). Servers are stateless; session state lives in the client's context assembly.</p>
      <h3>The MCP Client / Host</h3>
      <p>The host maintains an MCP client per server, assembling prompts, managing authentication, and calling <code>tools</code> via typed JSON-RPC requests.</p>
      <h3>The Protocol</h3>
      <p>MCP operates over stdio or HTTP via JSON-RPC: <code>initialize</code>, <code>resources/read</code>, <code>tools/call</code>. This is the integration contract — vendor-neutral.</p>
      <h2>Integration Pattern: Retrieval → Orchestration → Evaluation</h2>
      <p>Following the Cone of Autonomy framework (from HIGAET's Generative AI Engineering pillar): start narrow with RAG, add one MCP tool, evaluate, then expand only on proven safe bounds.</p>
      <h2>Case Study: Automating Engineering Reviews</h2>
      <p>A multi-step agent using retrieval (PR chunks) → MCP server (read_file, run_linter, post_comment) → ReAct loop with output verification → human-in-the-loop for irreversible actions.</p>
      <h2>Advantages &amp; Limitations</h2>
      <p><strong>Advantages:</strong> Structured; vendor-neutral; evaluation-friendly; scope-defined security. <strong>Limitations:</strong> Extra latency hop; server maintenance; schema evolution requires versioning.</p>
      <h2>Implementation Roadmap</h2>
      <ul>
        <li>Define smallest verifiable slice (one tool, one retrieval source).</li>
        <li>Build MCP server for that capability.</li>
        <li>Integrate into agent loop with structured outputs.</li>
        <li>Add evaluation harness; establish golden dataset.</li>
        <li>Expand tool permissions only as evaluations prove safe.</li>
      </ul>
      <h2>Sources &amp; References</h2>
      <ul>
        <li>HIGAET Knowledge Architecture (internal)</li>
        <li>Model Context Protocol specification (Anthropic)</li>
        <li>Generative AI Engineering pillar — HIGAET, 2026-09-27</li>
        <li>HIGAET Capstone: Enterprise AI Engineering Platform guidelines</li>
      </ul>
    `,
  },
  "vector-dbs-rag": {
    title: "Vector Databases for Production RAG: Chroma vs. Pinecone vs. Weaviate",
    excerpt: "Choosing the right vector database for production RAG: compare Chroma, Pinecone, Weaviate by scale, latency, indexing.",
    date: "2026-09-30", tag: "Technologies", readTime: "12 min read",
    content: `<h1>Vector Databases for Production RAG: Chroma vs. Pinecone vs. Weaviate</h1><h2>Quick Answer</h2><p>Choose by query pattern: Chroma for local/dev; Pinecone for managed multi-region; Weaviate for hybrid dense+sparse. Start with one index, measure, expand only when dense alone fails.</p><h2>What Is a Vector Database?</h2><h3>Simple</h3><p>Stores embeddings; finds nearest neighbors.</p><h3>Technical</h3><p>ANN index (HNSW/IVF) over high-dimensional arrays with metadata filtering.</p><h2>Why It Matters</h2><p>Enterprise RAG needs sub-100ms retrieval at thousands/min; wrong DB = cost + stale context.</p><h2>How It Works</h2><h3>Step 1</h3><p>Chunk + embed.</p><h3>Step 2</h3><p>Store vectors + metadata.</p><h3>Step 3</h3><p>Embed query; retrieve top-k ANN.</p><h3>Step 4</h3><p>Inject with citations.</p><h2>Components</h2><h4>Chroma</h4><p>In-process; SQLite backing.</p><h4>Pinecone</h4><p>Managed serverless; namespaces.</p><h4>Weaviate</h4><p>GraphQL + hybrid; self-host.</p><h2>Case Study</h2><p>Legal team: Weaviate hybrid search; +18% accuracy; <120ms at 2,500 Q/min.</p><h2>Sources</h2><ul><li>HIGAET Knowledge Architecture</li><li>Pinecone/Weaviate/Chroma docs</li><li>t_1ec42740 pillar</li></ul>`,
  },
  "llm-eval-frameworks": {
    title: "LLM Evaluation Frameworks: From Visual Checks to CI/CD Harnesses",
    excerpt: "How to replace visual AI-quality checks with automated evaluation harnesses tied to golden datasets and CI gates.",
    date: "2026-09-30", tag: "Technologies", readTime: "14 min read",
    content: `<h1>LLM Evaluation Frameworks: From Visual Checks to CI/CD Harnesses</h1><h2>Quick Answer</h2><p>Use automated harnesses comparing outputs to golden datasets — not visual checks.</p><h2>What Is LLM Evaluation?</h2><h3>Simple</h3><p>Measuring if outputs meet criteria.</p><h3>Technical</h3><p>Structured scoring over a test set; tracked per version.</p><h3>Formal</h3><p>Continuous evaluation protocol with statistical measures and harnesses.</p><h2>Why It Matters</h2><p>Non-deterministic systems need deterministic quality gates (t_1ec42740).</p><h2>How It Works</h2><h3>Step 1</h3><p>Gold dataset.</p><h3>Step 2</h3><p>Criteria rules.</p><h3>Step 3</h3><p>Harness per version.</p><h3>Step 4</h3><p>Track; block deploy on regression.</p><h2>Architecture</h2><p>Prompt -> Model -> Output -> Evaluator -> Score -> CI Gate.</p><h2>Components</h2><h4>Dataset</h4><p>Labeled gold.</p><h4>Criteria</h4><p>Rules.</p><h4>Evaluator</h4><p>LLM + human.</p><h4>Harness</h4><p>Run script.</p><h4>Dashboard</h4><p>Trends.</p><h4>CI Gate</h4><p>Fail build.</p><h2>Case Study</h2><p>Support bot: harness caught tone regression after accuracy prompt update.</p><h2>Advantages</h2><p>Reproducible; regression detection; governance.</p><h2>Limitations</h2><p>Gold dataset labor; evaluator bias; cost.</p><h2>Roadmap</h2><ul><li>50-200 gold samples</li><li>3-5 criteria</li><li>CI automation</li><li>Monthly refinement</li></ul><h2>Sources</h2><ul><li>HIGAET AI Evals guide</li><li>t_1ec42740 section</li></ul>`,
  },
  "prompt-engineering-software": { title: "Prompt Engineering as Software: Versioning, Testing, Guardrails", excerpt: "Treat prompts as code: version, test, guardrail.", date: "2026-09-30", tag: "Technologies", readTime: "10 min read", content: `<h1>Prompt Engineering as Software</h1><h2>Quick Answer</h2><p>Prompts are software — version them, test them, guardrail them.</p>` },
  "enterprise-ai-governance": { title: "Enterprise AI Governance: Data Residency, PII Filtering, Red-Teaming", excerpt: "Governance framework for organizational AI.", date: "2026-09-30", tag: "AI & Generative Intelligence", readTime: "13 min read", content: `<h1>Enterprise AI Governance</h1><h2>Quick Answer</h2><p>Govern AI like software: residency, PII filters, red-team tests.</p>` },
  "fine-tuning-vs-rag": { title: "Fine-Tuning vs. RAG: Decision Matrix for AI Product Teams", excerpt: "When to fine-tune vs. retrieve — practical framework.", date: "2026-10-01", tag: "Technologies", readTime: "11 min read", content: `<h1>Fine-Tuning vs. RAG</h1><h2>Quick Answer</h2><p>Start with RAG; fine-tune only when behavior requires structural change.</p>` },
  "cost-latency-optimization": { title: "Cost & Latency Optimization: Routing Small Models to Heavy Inference", excerpt: "Route simple tasks to small fast models; reserve heavy inference.", date: "2026-10-01", tag: "Technologies", readTime: "10 min read", content: `<h1>Cost & Latency Optimization</h1><h2>Quick Answer</h2><p>Route by complexity; measure cost/latency per tier.</p>` },
  "structured-output-schemas": { title: "Structured Output Schemas: JSON, Zod, and API-Ready Generation", excerpt: "Schema-defined outputs with validation at generation time.", date: "2026-10-02", tag: "Technologies", readTime: "9 min read", content: `<h1>Structured Output Schemas</h1><h2>Quick Answer</h2><p>Define schema first; generate; validate.</p>` },
  "multi-agent-orchestration": { title: "Multi-Agent Orchestration: ReAct, Plan-and-Execute, and Tool Loops", excerpt: "Build multi-agent workflows with tool loops and guardrails.", date: "2026-10-02", tag: "AI & Generative Intelligence", readTime: "13 min read", content: `<h1>Multi-Agent Orchestration</h1><h2>Quick Answer</h2><p>ReAct + plan + tool + guardrail + verify.</p>` },
  "the-state-of-ai-engineering-education": {
    title: "The state of AI engineering education in 2026",
    excerpt:
      "Why traditional CS programs struggle to keep pace with applied AI — and what we built at HIGAET to close the gap.",
    date: "2026-05-21",
    tag: "Academy",
    readTime: "8 min read",
    content: `
      <p>The gap between what universities teach and what AI engineering teams actually need has never been wider.</p>
      <h2>The curriculum lag</h2>
      <p>Most computer science programs still treat machine learning as an elective. They teach theory — backpropagation, gradient descent, loss functions — but not the engineering reality of shipping LLM systems: retrieval, evaluation, observability, cost control, and safety guardrails.</p>
      <h2>What HIGAET Academy does differently</h2>
      <p>We built our programs around what AI engineers actually do every day:</p>
      <ul>
        <li><strong>Foundations first:</strong> Linear algebra, probability, and Python patterns you will actually use</li>
        <li><strong>Applied depth:</strong> RAG architectures, agent orchestration, eval frameworks</li>
        <li><strong>Production reality:</strong> Cost-aware inference, latency budgets, guardrails, red-teaming</li>
        <li><strong>Capstone with industry:</strong> Live briefs from hiring partners, architecture reviews, production deployment</li>
      </ul>
      <h2>The result</h2>
      <p>Graduates don't just know ML theory — they've shipped working AI systems, run evaluations, and defended architecture decisions to hiring partners.</p>
    `,
  },
  "study-abroad-checklist-fall-2026": {
    title: "Study-abroad checklist: applying for Fall 2026 intakes",
    excerpt:
      "A clear, month-by-month plan for students targeting UK, US, and Canadian universities this cycle.",
    date: "2026-04-12",
    tag: "Global Hub",
    readTime: "6 min read",
    content: `
      <p>Fall 2026 applications open soon. Here is your timeline.</p>
      <h2>12–18 months before intake</h2>
      <ul>
        <li>Research destinations and programs</li>
        <li>Take standardized tests (IELTS/TOEFL, GRE/GMAT if required)</li>
        <li>Build your university shortlist: safe, match, reach</li>
      </ul>
      <h2>9–12 months before</h2>
      <ul>
        <li>Request transcripts and recommendation letters</li>
        <li>Draft SOPs and personal statements</li>
        <li>Apply for scholarships and funding</li>
      </ul>
      <h2>6–9 months before</h2>
      <ul>
        <li>Submit applications before deadlines</li>
        <li>Prepare financial evidence for visa</li>
        <li>Track application status across portals</li>
      </ul>
      <h2>3–6 months before</h2>
      <ul>
        <li>Accept offer and pay deposit</li>
        <li>Apply for student visa</li>
        <li>Arrange housing, insurance, travel</li>
      </ul>
    `,
  },
  "rag-vs-fine-tuning-2026": {
    title: "RAG vs. fine-tuning: a practitioner's framework",
    excerpt:
      "Choosing between retrieval and fine-tuning based on the actual constraints of your enterprise system.",
    date: "2026-03-04",
    tag: "Technologies",
    readTime: "10 min read",
    content: `
      <p>The debate between RAG and fine-tuning misses the point: they solve different problems.</p>
      <h2>When to use RAG</h2>
      <ul>
        <li>Knowledge changes frequently</li>
        <li>You need citations and auditability</li>
        <li>Domain knowledge is large but well-documented</li>
        <li>Compliance requires traceable answers</li>
      </ul>
      <h2>When to fine-tune</h2>
      <ul>
        <li>Model behavior needs to change (style, format, reasoning)</li>
        <li>Low-latency, high-throughput inference required</li>
        <li>Proprietary reasoning patterns not in base model</li>
        <li>You have high-quality training data (1k+ examples)</li>
      </ul>
      <h2>The pragmatic approach</h2>
      <p>Most production systems need both: RAG for knowledge, fine-tuning for behavior. Start with RAG, measure, then fine-tune only where retrieval alone fails.</p>
    `,
  },
};

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const slug = params.slug;
    const post = POSTS[slug];
    if (!post) {
      return {
        meta: [{ title: "Post not found — HIGAET" }],
      };
    }
    const url = "https://www.higaet.com/blog/" + slug;
    return {
      meta: [
        { title: post.title + " — HIGAET Journal" },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { property: "article:published_time", content: post.date },
        { property: "article:tag", content: post.tag },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            author: { "@type": "Organization", name: "HIGAET" },
            publisher: { "@type": "Organization", name: "HIGAET" },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.higaet.com/" },
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: "https://www.higaet.com/blog",
              },
              { "@type": "ListItem", position: 3, name: post.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = POSTS[slug];

  useEffect(() => {
    if (post) {
      metaEvents.viewContent({
        content_name: post.title,
        content_type: "article",
        content_category: "blog",
      });
    }
  }, [slug]);

  if (!post) {
    return (
      <SiteShell>
        <PageHero
          eyebrow="Blog"
          title="Post not found"
          subtitle="The article you are looking for does not exist."
        />
        <Section className="!pt-0">
          <p className="text-muted-foreground">The article you are looking for does not exist.</p>
          <Link
            to="/blog"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-tech"
          >
            Back to Blog
          </Link>
        </Section>
      </SiteShell>
    );
  }

  const crumbs = [
    { label: "Home", url: "/" },
    { label: "Blog", url: "/blog" },
    { label: post.title, url: undefined },
  ];

  return (
    <SiteShell>
      <div className="px-6 pt-8">
        <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden>/</span>}
                {c.url ? (
                  <Link to={c.url} className="hover:text-ink transition-colors">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink font-medium">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <PageHero eyebrow={post.tag} title={post.title} subtitle={post.excerpt}>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span>·</span>
          <span>{post.readTime}</span>
          <span>{post.tag}</span>
        </div>
      </PageHero>

      <Section className="!pt-0">
        <div className="max-w-3xl">
          <article className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </article>
        </div>
      </Section>

      <CTASection
        title="Want more insights like this?"
        body="Subscribe to the HIGAET Journal for field notes on AI engineering, study abroad, and enterprise AI."
        primaryHref="/blog"
        primaryLabel="Read more articles"
      />
    </SiteShell>
  );
}
