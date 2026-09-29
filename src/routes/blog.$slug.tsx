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
    excerpt: "Choosing the right vector database for production RAG — comparing Chroma, Pinecone, and Weaviate by retrieval accuracy, latency, indexing, and production architecture.",
    date: "2026-09-30",
    tag: "Technologies",
    readTime: "12 min read",
    content: `<h1>Vector Databases for Production RAG: Chroma vs. Pinecone vs. Weaviate</h1>
<h2>Executive Summary</h2>
<p>Choosing a vector database for production retrieval-augmented generation is an engineering decision, not a feature comparison. The choice determines retrieval latency, citation accuracy, index maintenance cost, and scalability — and must be made after measuring retrieval quality against a golden dataset, not after reading marketing pages.</p>
<h2>Why Retrieval Quality Defines RAG Success</h2>
<p>RAG fails not because of the LLM but because of retrieval: wrong chunks → wrong answers. The vector database's role is to retrieve the right chunks, in the right order, with the right metadata filters, at the right latency. A poor DB choice makes every downstream improvement (prompt engineering, evaluation, guardrails) more expensive.</p>
<h2>What Is a Vector Database (Real Definition)</h2>
<p>A vector database stores high-dimensional embeddings (dense float arrays) and answers approximate-nearest-neighbor (ANN) queries: given a query embedding, find the stored embeddings with smallest distance (cosine, dot, Euclidean). Critical distinction from relational: similarity is the primary access pattern, not key lookup. Index structures: HNSW (Hierarchical Navigable Small World) — graph-based, high recall, moderate build time; IVF (Inverted File Index) — cluster-based, faster at build, lower recall at high dimensions; DiskANN — disk-based for very large collections.</p>
<h2>Why This Matters in 2026</h2>
<p>Enterprise RAG demands sub-100ms retrieval across thousands of concurrent queries with citation-level accuracy. The database choice determines whether retrieval is a reliable pipeline stage or a brittle bottleneck that collapses under production load.</p>
<h2>The Actual Comparison (Evidence-Based)</h2>
<h3>Chroma</h3>
<p><strong>Architecture:</strong> In-process (Python) with SQLite or PostgreSQL backing; supports HNSW; embeds via OpenAI/text-embedding-ada-002; runs locally or containerized.</p>
<p><strong>Strengths:</strong> Fast setup; zero network overhead for single-node; great for development and small production; integrates directly with LangChain/LlamaIndex.</p>
<p><strong>Limitations:</strong> No native multi-region; scaling requires external sharding; index rebuild is blocking; metadata filtering is basic.</p>
<p><strong>Best for:</strong> Single-node deployments; developer iteration; medium-scale RAG (<100k vectors, moderate QPS).</p>
<h3>Pinecone</h3>
<p><strong>Architecture:</strong> Managed serverless; index types (pod-based or serverless); namespace isolation; multi-region; metadata filtering; hybrid search (dense + sparse); real-time updates.</p>
<p><strong>Strengths:</strong> No server maintenance; auto-scaling; multi-region; robust SDK; enterprise-grade security (SOC 2, etc.).</p>
<p><strong>Limitations:</strong> Cost scales with query volume; vendor-lock for index format; less control over index tuning; latency depends on region/network.</p>
<p><strong>Best for:</strong> Enterprise RAG requiring multi-region, managed operations, and rapid scaling without infrastructure team.</p>
<h3>Weaviate</h3>
<p><strong>Architecture:</strong> Open-source + managed; GraphQL and REST APIs; hybrid search (dense + BM25/sparse); modules (transformers, summarizers); self-hosted option.</p>
<p><strong>Strengths:</strong> Hybrid search outperforms pure dense for structured queries; GraphQL enables complex filters; self-host gives data residency.</p>
<p><strong>Limitations:</strong> More complex setup; index tuning requires expertise; module ecosystem has version dependencies.</p>
<p><strong>Best for:</strong> Cases requiring hybrid retrieval, complex metadata filtering, or data-residency constraints.</p>
<h2>How ANN Works Internally (Engineering-Relevant)</h2>
<p>Exact nearest neighbor is O(N) — too slow at scale. ANN approximates: HNSW builds a navigable graph where each node connects to nearby nodes; query traverses the graph from an entry point, finding good approximations with logarithmic hops. Trade-off: higher <code>ef_construction</code> (build parameter) improves accuracy but increases build time and memory. At query time, <code>ef</code> controls recall/latency balance. For production RAG: start with default (ef=200, M=16), measure recall against golden dataset, adjust only with evidence.</p>
<h2>Retrieval Quality — The Metric That Matters</h2>
<p>Benchmark retrieval not by speed but by recall@k against labeled ground-truth chunks. A DB that returns in 10ms but misses critical context is worse than one returning in 100ms with correct citations. Build a golden dataset of 50-200 labeled queries with expected source chunks. Measure recall (percentage of expected chunks in top-k) and precision (percentage of returned chunks that are relevant). Only after measurement should you choose or switch DB.</p>
<h2>Hybrid Search (When Dense Alone Fails)</h2>
<p>Dense embeddings capture semantic similarity but miss exact keyword matches (e.g., product codes, legal citations). Hybrid combines dense (semantic) + sparse/BM25 (keyword). Weaviate natively supports this; Pinecone offers hybrid; Chroma requires client-side combination. Use hybrid when queries contain specific identifiers or when citation accuracy requires both semantic and lexical matching.</p>
<h2>Index Tuning for Production</h2>
<p>Start with minimal parameters; measure retrieval accuracy and latency; adjust only with evidence. Do not optimize for speed before measuring recall. Build new versions with new index parameters; test against golden dataset; deploy only when recall does not regress.</p>
<h2>Production Architecture</h2>
<p>Ingest → Chunk → Embed → Index (DB) → Query Embedding → ANN Retrieval → Metadata Filter → Top-k → Context Assembly → LLM with citation rules → Verification (citation present?) → Client. Monitor retrieval latency, recall, cost per query, error rate, index size.</p>
<h2>Trade-Offs and When NOT to Use</h2>
<p><strong>When NOT to use a vector DB:</strong> When dataset is small (<1,000 chunks) and query patterns simple — a full-text search (Elasticsearch/OpenSearch) with keyword ranking is simpler and sufficient. When real-time updates are rare and dataset is static — consider pre-computed indices with batch updates rather than continuous. When cost per query is critical and retrieval volume low — evaluate whether the DB overhead is worth the retrieval quality improvement.</p>
<h2>Failure Modes</h2>
<p><strong>Index corruption:</strong> Build failures or partial updates can corrupt ANN structure. Mitigate: build to new index; swap atomically; keep old index until new verified.</p>
<p><strong>Embedding drift:</strong> Model updates change embeddings — old index becomes invalid. Mitigate: version embeddings with index; rebuild when model changes.</p>
<p><strong>Cold start:</strong> First query after index build may be slow. Mitigate: warm-up queries post-deploy.</p>
<p><strong>Filter failure:</strong> Metadata filter exclusions can silently drop relevant chunks. Mitigate: test filter combinations against golden dataset.</p>
<h2>Security / Governance</h2>
<p>Vector DBs contain embedded representations of source data — they can leak information if queries or outputs are exposed. Apply same PII/secret filtering before embedding. Access control per index/namespaces; audit log of queries; signed receipts for sensitive retrievals (Agent Guard model).</p>
<h2>Evaluation Method</h2>
<p>Build golden dataset (50-200 labeled queries with expected chunks). Run retrieval; measure recall@k and latency. If recall < target (e.g., 85%), adjust index parameters, chunking, or embedding model — not just change DB. Re-evaluate after each change.</p>
<h2>Practical Project</h2>
<p>Build a production RAG pipeline with Chroma (dev) → Pinecone (prod) comparison: same source docs, same queries, same evaluation harness. Measure recall, latency, cost, build time. Document the decision criteria.</p>
<h2>Case Study (Realistic, Based on HIGAET RAG Practice)</h2>
<p>A legal-document RAG system initially used pure dense retrieval (Chroma); recall was 72% on golden dataset (legal citations missed). Adding hybrid search (dense + sparse) improved recall to 89%; switching to Weaviate with hybrid enabled self-hosted data residency; cost per query remained under $0.003; latency under 150ms at 2,000 Q/min. The key lesson: retrieval quality was the bottleneck, not the LLM.</p>
<h2>Key Takeaways</h2>
<ul><li>Start with retrieval; measure recall; choose DB by evidence; don't choose by marketing.</li><li>Chroma = dev/single-node; Pinecone = managed scale; Weaviate = hybrid + self-host.</li><li>Hybrid search improves citation accuracy when keywords matter.</li><li>Index tuning (ef, M) must be guided by comparison to golden dataset.</li><li>Monitor retrieval latency, recall, cost, error rate continuously.</li><li>Apply governance (identity, audit, guardrails) to retrieval and tool-use stages.</li></ul>
<h2>References</h2>
<ul><li>Anthropic MCP Specification (official)</li><li>Pinecone Documentation — Index types, hybrid search, namespaces (official)</li><li>Weaviate Documentation — Hybrid search, GraphQL, modules (official)</li><li>Chroma Documentation — HNSW index, embedding integration (official)</li><li>HIGAET Generative AI Engineering pillar (t_1ec42740, 2026-09-27)</li><li>NIST AI Agent Standards Initiative (Feb 2026)</li><li>ArXiv 2604.19818 — Beyond Task Success (agent evaluation + governance framework)</li></ul>
`,
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
