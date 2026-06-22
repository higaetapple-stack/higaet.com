/**
 * HIGAET documentation registry. Powers /docs landing, category pages,
 * and article pages with TechArticle / FAQPage / BreadcrumbList JSON-LD.
 */
export type DocArticle = {
  slug: string;
  title: string;
  description: string;
  summary?: string; // AI-readable one-paragraph abstract (used in JSON-LD `abstract`)
  body: string; // paragraphs separated by blank line
  faqs?: { q: string; a: string }[];
  mentions?: string[]; // related entity URLs for knowledge graph linkage
  updated: string;
};

export type DocCategory = {
  slug: string;
  name: string;
  description: string;
  articles: DocArticle[];
};

const TODAY = "2026-06-22";
const BASE = "https://higaet-core-engine.lovable.app";

const ACADEMY_MENTIONS = [
  `${BASE}/higaet-academy`,
  `${BASE}/higaet-ai-platform`,
  `${BASE}/academy/programs`,
];

const GLOBAL_MENTIONS = [
  `${BASE}/higaet-global-education-hub`,
  `${BASE}/global-education/study-abroad`,
  `${BASE}/global-education/visa-guidance`,
];

export const DOC_CATEGORIES: DocCategory[] = [
  // ============================================================
  // AI ENGINEERING SERIES — 10 articles
  // ============================================================
  {
    slug: "ai-engineering",
    name: "AI Engineering Guides",
    description: "Practitioner guides covering AI engineering, generative AI, RAG, agentic systems, prompts, and careers.",
    articles: [
      {
        slug: "what-is-ai-engineering",
        title: "What is AI Engineering?",
        description: "AI engineering as a discipline: scope, responsibilities, the modern stack, and how it differs from data science and ML research.",
        summary: "AI engineering is the discipline of building, evaluating, and operating production AI systems — combining ML, software engineering, data, and platform skills around foundation models, RAG, agents, and observability.",
        body: "AI engineering is the discipline of designing, building, and operating production AI systems. It sits between classical software engineering and machine-learning research. Where data scientists explore patterns and ML researchers improve models, AI engineers ship dependable systems that use those models.\n\nThe modern AI engineering stack centers on foundation models accessed through APIs, retrieval-augmented generation (RAG) over private knowledge, agentic workflows that use tools, and an observability layer for evaluations, traces, and cost.\n\nAI engineers own four practical responsibilities: choose the right model and pattern for a task, ground responses in trusted data, evaluate outputs continuously, and instrument the system so regressions are visible. The role rewards engineers who can reason about probability, latency, and cost in the same breath.\n\nHIGAET Academy's AI engineering programs are organized around this scope, with practitioner faculty leading Generative AI, RAG, Agentic AI, and Data Science tracks.",
        faqs: [
          { q: "Is AI engineering the same as machine learning engineering?", a: "They overlap. ML engineering focuses on training and serving models; AI engineering focuses on building applications and platforms on top of models, including those you do not train yourself." },
          { q: "Do I need a research background?", a: "No. Strong software engineering, applied probability, and a clear grasp of evaluation are usually enough for most AI engineering roles." },
          { q: "What does an AI engineer ship?", a: "Production features: chat experiences, retrieval pipelines, agentic workflows, evaluation harnesses, and the dashboards that keep them honest." },
        ],
        mentions: ACADEMY_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "generative-ai-explained",
        title: "Generative AI Explained",
        description: "How generative models work, why transformers won, the role of pre-training and post-training, and where generative AI fits in real products.",
        summary: "Generative AI uses large pre-trained models — usually transformers — to produce text, code, images, audio, and structured outputs. Useful systems combine these models with retrieval, tools, and evaluation.",
        body: "Generative AI refers to models that produce new content rather than only classifying existing inputs. Today's generative systems are dominated by transformer architectures trained on very large corpora, then post-trained with techniques like supervised fine-tuning and preference optimization.\n\nPre-training teaches a model the statistics of language, code, or pixels. Post-training shapes behavior — making models helpful, formatted, safe, and able to follow instructions. The result is a single base capability that many products can specialize.\n\nIn production, raw generation is rarely enough. Generative AI features become reliable when paired with retrieval (so the model has the right facts), tools (so it can act), structured outputs (so downstream code can consume them), and evaluation (so quality is measurable).\n\nHIGAET Academy teaches generative AI as a system, not just a model — covering prompt design, retrieval, agents, evaluation, and operations together.",
        faqs: [
          { q: "Are generative models 'reasoning'?", a: "They produce token sequences that often look like reasoning. Multi-step prompting, tools, and verification dramatically improve task accuracy compared to a single-shot answer." },
          { q: "How big a model do I need?", a: "Start with the smallest model that meets your evaluation bar. Most production tasks can be served by mid-sized models when paired with retrieval and tools." },
          { q: "Where does generative AI fail?", a: "When grounding is missing, when outputs are unverifiable, or when evaluation is missing. Fix those before scaling traffic." },
        ],
        mentions: ACADEMY_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "agentic-ai-systems",
        title: "Agentic AI Systems Guide",
        description: "Designing agentic systems with tool use, planning, memory, and safety. Patterns, failure modes, and evaluation.",
        summary: "Agentic AI extends a model with tools, planning loops, and memory so it can complete multi-step tasks. Successful agents combine narrow tool design, conservative planning, observability, and explicit safety boundaries.",
        body: "An agent is an LLM-driven loop that selects tools, takes actions, observes results, and decides what to do next. Agentic systems unlock tasks that single-shot prompting cannot — like multi-step research, transactional workflows, or operational copilots.\n\nDesign agents around four pillars. First, narrow tools with strict schemas; broad tools amplify mistakes. Second, planning that is explicit and bounded — by steps, by budget, by time. Third, memory that distinguishes durable facts from working scratchpad. Fourth, safety boundaries enforced outside the model: allowlists, rate limits, human review for irreversible actions.\n\nEvaluation matters more than prompts. Track task completion, intermediate decisions, tool error rates, and cost per task. Replay traces to compare versions. Treat agents as systems that drift over time and need regression suites the same way services do.\n\nThe HIGAET AI Platform implements these patterns across tutors, advisors, and copilots in the HIGAET ecosystem.",
        faqs: [
          { q: "When is an agent the right pattern?", a: "When the task is multi-step, the steps are not known in advance, and tools are available to act. For static workflows, a fixed pipeline is usually safer." },
          { q: "How do you keep agents predictable?", a: "Constrain the toolset, cap step counts, prefer structured outputs, and require human review for any action with real-world side effects." },
          { q: "What are common failure modes?", a: "Looping, premature termination, overconfident tool selection, and silent failure when a tool returns malformed output." },
        ],
        mentions: [...ACADEMY_MENTIONS, `${BASE}/docs/ai-platform/overview`],
        updated: TODAY,
      },
      {
        slug: "rag-guide",
        title: "Retrieval-Augmented Generation (RAG) Guide",
        description: "End-to-end RAG: chunking, embeddings, retrieval strategies, ranking, prompt assembly, evaluation, and operations.",
        summary: "RAG grounds a language model in retrieved context. A reliable RAG system depends on good chunking, calibrated embeddings, hybrid retrieval, deliberate ranking, and continuous evaluation — not just a vector database.",
        body: "Retrieval-augmented generation grounds an LLM in external knowledge. At inference time the system retrieves relevant chunks from a corpus, packs them into the prompt, and asks the model to answer using that context.\n\nA reliable RAG pipeline has six stages. Ingestion normalizes and chunks source documents. Embedding turns chunks into vectors. Indexing stores them for fast search. Retrieval combines vector similarity with keyword or metadata filters. Ranking reorders candidates using cross-encoders or business logic. Generation packs context and asks the model to answer, ideally with citations.\n\nMost RAG quality problems are upstream of the model: bad chunking, missing metadata, weak hybrid retrieval, or no ranking. Add evaluations early — answer correctness, citation faithfulness, latency, and cost — and keep a labeled regression set you trust.\n\nHIGAET Academy's RAG Engineering track covers the full pipeline with capstone evaluation harnesses; the HIGAET AI Platform productionizes the same patterns.",
        faqs: [
          { q: "Vector search or hybrid search?", a: "Hybrid almost always wins. Vectors capture meaning; keywords capture exact identifiers, codes, and names that embeddings often miss." },
          { q: "How do I evaluate a RAG system?", a: "Maintain a labeled question set with expected sources. Measure answer correctness, citation faithfulness, latency, and cost on every change." },
          { q: "When is RAG the wrong choice?", a: "When the answer needs reasoning over the entire corpus, when long-lived memory is required, or when fine-tuning addresses the gap more cheaply." },
        ],
        mentions: ACADEMY_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "prompt-engineering-best-practices",
        title: "Prompt Engineering Best Practices",
        description: "Prompt design patterns, structured outputs, evaluation, and how to manage prompts in production.",
        summary: "Effective prompt engineering treats prompts as versioned artifacts: explicit roles, concrete examples, structured outputs, evaluation against a labeled set, and disciplined rollout in production.",
        body: "Prompts are software. Treat them with the same discipline you apply to code: versioned, reviewed, tested, observable.\n\nStrong prompts share a few traits. They name the role and the audience. They state the task in unambiguous terms. They show one or two concrete examples of the desired output. They request structured output when downstream code consumes the response. They specify what to do when information is missing.\n\nEvaluate prompts the way you would evaluate a function. Maintain a labeled set of inputs with expected outputs. Run the prompt across models and versions. Track regressions over time. Use temperature, top-p, and stop conditions deliberately, not as defaults.\n\nIn production, store prompts outside the model call, route by version, log inputs and outputs, and tie rollouts to evaluation deltas — not to vibes.",
        faqs: [
          { q: "How long should a prompt be?", a: "As long as it needs to be specific, no longer. Most production prompts are 200–800 tokens of instructions plus retrieved context." },
          { q: "Do few-shot examples still matter?", a: "Yes, for format and edge cases. Modern instruction-tuned models can often work zero-shot but few-shot still stabilizes output shape." },
          { q: "Should I fine-tune or prompt?", a: "Prompt first. Fine-tune when prompts cannot reach the quality bar or when latency and cost demand a smaller specialized model." },
        ],
        mentions: ACADEMY_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "ai-agent-architecture-patterns",
        title: "AI Agent Architecture Patterns",
        description: "Reusable architectures for AI agents: router, plan-and-execute, ReAct, supervisor, and graph-based multi-agent systems.",
        summary: "Common agent architectures include router, plan-and-execute, ReAct, supervisor, and graph-based multi-agent. Pick the simplest pattern that satisfies the task and add structure only as failures demand it.",
        body: "Different tasks deserve different agent shapes. A router classifies an incoming request and dispatches to a specialized handler. Plan-and-execute breaks a goal into steps, then runs them sequentially with verification. ReAct interleaves reasoning and tool calls in a single loop. A supervisor coordinates several worker agents, each with narrow responsibilities. Graph-based multi-agent systems model the flow explicitly as a directed graph with state.\n\nChoose the simplest pattern that meets the requirement. Routers are cheap and clear. Plan-and-execute helps when steps are independent. ReAct is right when each step depends on the previous result. Supervisor and graph patterns earn their complexity only when single-agent loops break down.\n\nWhatever the pattern, instrument it. Log every decision, tool call, and observation. Replay traces during incident review. Evaluate against task suites, not single examples.",
        faqs: [
          { q: "Single agent or multi-agent?", a: "Start single. Move to multi-agent only when responsibilities are genuinely separable and a single context cannot hold the work." },
          { q: "How do I prevent runaway loops?", a: "Hard caps on steps, tokens, and cost; structured stop conditions; and a supervisor that can terminate." },
          { q: "Does the agent need long-term memory?", a: "Often a vector store of distilled facts plus a short working buffer is enough. Full episodic memory is rarely worth the cost." },
        ],
        mentions: ACADEMY_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "vector-databases-explained",
        title: "Vector Databases Explained",
        description: "What vector databases do, how ANN indexes work, when to use a vector DB vs Postgres pgvector, and how to keep recall honest.",
        summary: "Vector databases store and search embeddings at scale using approximate nearest-neighbor indexes. Choice depends on volume, latency, filtering needs, and whether your relational store can already do the job.",
        body: "A vector database stores numeric embeddings and answers similarity queries quickly using approximate nearest-neighbor (ANN) indexes. ANN trades a small amount of recall for large speed and cost gains over exact search.\n\nCommon index families include HNSW (graph-based, strong default for read-heavy workloads), IVF (inverted file, useful for very large corpora), and product quantization (memory savings for huge collections). Each exposes parameters that trade recall against latency and memory.\n\nYou do not always need a dedicated vector database. Postgres with pgvector is enough for many production systems and keeps your data in one place with one access-control story. Choose a dedicated vector DB when scale, multi-tenant isolation, or specialized filters justify it.\n\nWhatever you choose, measure recall against an exact baseline on real queries, not synthetic ones.",
        faqs: [
          { q: "What embedding dimension is best?", a: "Use the dimension your embedding model produces. Reducing dimension via PCA or matryoshka embeddings is reasonable only if you measure recall after." },
          { q: "How big should a chunk be?", a: "Start with 200–500 tokens for prose, smaller for code, larger for structured documents. Tune against evaluation, not intuition." },
          { q: "Do I need a re-ranker?", a: "Almost always. A cross-encoder re-ranker over the top 20–50 candidates usually beats raising recall in the ANN index." },
        ],
        mentions: ACADEMY_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "llm-application-development",
        title: "LLM Application Development",
        description: "From prototype to production: structuring code, managing prompts, retrieval, evaluation, deployment, and observability.",
        summary: "Productionizing LLM applications means separating prompts, retrieval, and orchestration; adding evaluation as a first-class artifact; and treating cost, latency, and quality as observable metrics from day one.",
        body: "LLM applications fail in predictable ways: ad-hoc prompts buried in code, retrieval that nobody can evaluate, no measurement of quality, and surprise costs. The fix is structure.\n\nSeparate concerns. Keep prompts as versioned artifacts. Put retrieval behind an interface you can swap and evaluate. Keep orchestration — agent loops, tool calls — outside the prompt. Make every model call configurable in one place.\n\nAdd evaluation as a first-class artifact, not a notebook. Maintain labeled datasets, run automated comparisons, and gate releases on evaluation deltas. Surface latency, token cost, error rates, and tool failures alongside business metrics.\n\nDeploy progressively. Shadow new versions, canary to a slice, and roll back on regressions. Make caching, rate limiting, and provider failover routine, not heroic.",
        faqs: [
          { q: "Which framework should I use?", a: "Most production teams use thin orchestration layers and own the prompt and evaluation code. Heavyweight frameworks help prototypes more than they help production." },
          { q: "How do I control cost?", a: "Smaller default model, aggressive caching, structured outputs, and budgets per request. Measure cost per task, not cost per token." },
          { q: "How do I handle provider outages?", a: "Abstract the model client, keep at least one fallback provider, and degrade gracefully — for example serving cached or simpler responses." },
        ],
        mentions: ACADEMY_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "ai-safety-and-governance",
        title: "AI Safety and Governance",
        description: "Practical safety for production AI: input/output controls, evaluations, privacy, abuse prevention, and governance practices.",
        summary: "AI safety in production combines layered controls — input filtering, output checks, retrieval scoping, abuse detection — with governance practices: model approval, documented use cases, and human review for sensitive actions.",
        body: "Safety in production AI is not a single feature. It is a layered set of controls applied across the lifecycle.\n\nAt the boundary, validate inputs, filter known prompt-injection patterns, and limit what untrusted text can do — especially when it is later combined with tools. Scope retrieval and tool access to the user's authorized data, never the union of all data.\n\nAt the output, run lightweight checks for sensitive content, identifiers, and policy violations. For irreversible actions, require human review. For agentic systems, cap steps, cost, and side effects.\n\nGovernance complements technical controls: documented approved use cases, model and provider approval, privacy reviews for data flows, and clear ownership for incident response. Evaluate safety the way you evaluate quality — with labeled sets and regression tracking.",
        faqs: [
          { q: "How do I defend against prompt injection?", a: "Treat retrieved and user-supplied text as untrusted, separate it visually in the prompt, restrict tool permissions, and never let untrusted text issue privileged actions." },
          { q: "Should we use guardrails libraries?", a: "They help for common patterns. The bigger wins usually come from scoping data access, requiring approvals for risky actions, and evaluating safety as a metric." },
          { q: "What logs should we keep?", a: "Inputs, outputs, model and prompt versions, tool calls, and decisions — with retention aligned to your privacy posture and minimum needed for debugging and audit." },
        ],
        mentions: ACADEMY_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "future-careers-in-ai-engineering",
        title: "Future Careers in AI Engineering",
        description: "Emerging AI engineering roles, the skill ladder from junior to staff, and how HIGAET Academy maps to industry hiring tracks.",
        summary: "AI engineering careers branch into application engineering, platform engineering, evaluation/ops, and research engineering. Each rewards a different mix of software craft, ML literacy, and product judgment.",
        body: "AI engineering hiring has split into recognizable tracks. Application AI engineers ship features — chat, retrieval, copilots. Platform AI engineers build the infrastructure those features depend on — gateways, evaluation, observability, deployment. Evaluation and AI operations roles own quality, cost, and reliability across systems. Research engineering bridges modeling work and production.\n\nThe skill ladder is consistent across tracks. Junior engineers ship well-defined components with good tests and clean prompts. Mid-level engineers own a feature end-to-end, including evaluation and rollback. Senior and staff engineers shape architecture, raise the team's quality bar, and connect AI work to business outcomes.\n\nHIGAET Academy maps program tracks to these careers. Generative AI and RAG tracks build application skills. Agentic AI extends into platform work. The data science track strengthens evaluation literacy across all of them.",
        faqs: [
          { q: "Do I need a graduate degree?", a: "Rarely required for application or platform tracks. Research engineering roles often prefer one, but strong open-source work substitutes well." },
          { q: "What portfolio matters most?", a: "End-to-end systems with honest evaluation. A small RAG or agent project with a documented eval set outperforms a long list of tutorials." },
          { q: "Will agents replace engineers?", a: "Agents change the leverage. Engineers who can specify, evaluate, and operate AI systems become more valuable, not less." },
        ],
        mentions: ACADEMY_MENTIONS,
        updated: TODAY,
      },
    ],
  },

  // ============================================================
  // STUDY ABROAD SERIES — articles 11–20
  // ============================================================
  {
    slug: "study-abroad",
    name: "Study Abroad Guides",
    description: "Country guides, application craft, and student preparation for international university admissions.",
    articles: [
      {
        slug: "how-to-study-in-the-usa",
        title: "How to Study in the USA",
        description: "Application timeline, tests, costs, scholarships, and the F-1 visa pathway for studying in the United States.",
        summary: "Studying in the USA typically requires 12–15 months of planning: standardized tests, school shortlisting, applications, financial documentation, the F-1 visa, and pre-departure preparation.",
        body: "The United States remains the largest study-abroad destination by program breadth. A typical timeline runs 12–15 months from research to departure.\n\nStart with course and destination clarity, then standardized testing as required by your target schools — commonly the GRE or GMAT for graduate programs and SAT or ACT for undergraduate. English proficiency through TOEFL or IELTS is standard.\n\nShortlist across ambition, fit, and safety schools. Prepare a strong SOP, recommendation letters, and a financial plan that anticipates tuition, living costs, and proof of funds for the visa. Apply by each program's deadline — many graduate programs use rolling admissions.\n\nAfter admission, complete the I-20, pay the SEVIS fee, file the DS-160, and prepare for the consular interview. HIGAET Global Education Hub supports each stage end-to-end.",
        faqs: [
          { q: "When should I start preparing?", a: "12–15 months before intended intake for graduate programs; longer for undergraduate." },
          { q: "How much funding do I need to show?", a: "First-year tuition plus living costs is the typical baseline; some institutions require more." },
          { q: "Can I work on an F-1 visa?", a: "On-campus work is allowed; off-campus work requires CPT or OPT authorization tied to your program." },
        ],
        mentions: [...GLOBAL_MENTIONS, `${BASE}/docs/visa/usa-f1`],
        updated: TODAY,
      },
      {
        slug: "how-to-study-in-the-uk",
        title: "How to Study in the UK",
        description: "UK application timeline via UCAS and direct apply, CAS issuance, financial requirements, and the UK Student Visa.",
        summary: "Studying in the UK involves UCAS or direct postgraduate applications, English-language evidence, a CAS from the chosen university, and the UK Student Visa with maintenance-fund proof.",
        body: "The United Kingdom offers strong one-year master's programs and a structured admissions process. Undergraduate applications go through UCAS; postgraduate applications are usually direct to each university.\n\nMost programs require English-language evidence through IELTS, TOEFL, or equivalent. Personal statements carry significant weight, especially for competitive courses. Apply early to maximize scholarship eligibility.\n\nAfter receiving an unconditional offer and meeting any conditions, the university issues a CAS — required for the visa application. The UK Student Visa requires financial evidence covering tuition and a defined monthly maintenance amount, held for the qualifying period.\n\nHIGAET Global Education Hub coordinates UCAS submissions, direct applications, scholarship strategy, and visa documentation.",
        faqs: [
          { q: "What is CAS?", a: "Confirmation of Acceptance for Studies, issued by the sponsoring university and required to apply for the UK Student Visa." },
          { q: "Are one-year master's recognized internationally?", a: "Yes — UK one-year master's degrees are well recognized by employers and global universities." },
          { q: "Can dependants join?", a: "Most current student-visa rules restrict dependants to specific program categories; check the latest UK government guidance." },
        ],
        mentions: [...GLOBAL_MENTIONS, `${BASE}/docs/visa/uk-student`],
        updated: TODAY,
      },
      {
        slug: "how-to-study-in-canada",
        title: "How to Study in Canada",
        description: "Designated Learning Institutions, the Study Permit, Provincial Attestation Letters, GIC requirements, and post-study work.",
        summary: "Canada requires admission to a Designated Learning Institution, a Provincial Attestation Letter where applicable, a Study Permit, financial proof often including a GIC, and offers strong post-study work options.",
        body: "Canada combines accessible application processes with strong post-study work pathways. Choose a Designated Learning Institution (DLI), which is required for the Study Permit.\n\nApplication windows vary by intake — fall is largest, followed by winter and summer. Provide academic transcripts, English-language evidence, an SOP, and references where required. Many provinces now require a Provincial Attestation Letter (PAL) before the Study Permit can be issued.\n\nFinancial proof typically includes tuition for one year plus living costs; many students use a Guaranteed Investment Certificate (GIC) to demonstrate funds. After graduation, eligible students may apply for the Post-Graduation Work Permit (PGWP).\n\nHIGAET counsels on DLI selection, PAL coordination, GIC setup, and Study Permit documentation.",
        faqs: [
          { q: "Is a GIC mandatory?", a: "Not universally, but it is the most common way students demonstrate living-cost funds, especially under SDS-style processes." },
          { q: "How long is the PGWP?", a: "Up to three years depending on program length and current regulations — verify the latest rules at application time." },
          { q: "Can I switch institutions?", a: "Yes, with proper notification; the Study Permit must remain valid and your new institution must be a DLI." },
        ],
        mentions: GLOBAL_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "how-to-study-in-australia",
        title: "How to Study in Australia",
        description: "CRICOS programs, the Student Visa (subclass 500), Genuine Student requirement, OSHC, and post-study work rights.",
        summary: "Australian study requires admission to a CRICOS-registered course, the Student Visa subclass 500 with Genuine Student evidence, mandatory OSHC, and offers post-study work rights based on qualification level.",
        body: "Australia hosts CRICOS-registered programs across world-ranked universities. Application is typically direct to each institution.\n\nProvide academic transcripts, English-language evidence such as IELTS or PTE, and any program-specific requirements. After receiving an offer and accepting it, you receive a Confirmation of Enrolment (CoE) — required for the Student Visa application.\n\nThe Student Visa (subclass 500) requires Genuine Student documentation: a personal statement covering circumstances, study choice, and post-study plans. Overseas Student Health Cover (OSHC) is mandatory for the duration of stay. Post-study work rights vary by qualification level and location.\n\nHIGAET coordinates CRICOS course selection, Genuine Student preparation, and visa documentation.",
        faqs: [
          { q: "What is the Genuine Student requirement?", a: "A current Department of Home Affairs requirement evaluating whether the applicant intends to study temporarily in Australia. It replaces the older Genuine Temporary Entrant test." },
          { q: "Is OSHC negotiable?", a: "No. Overseas Student Health Cover is mandatory for the full duration of the visa." },
          { q: "How long can I work during study?", a: "Limits change periodically. Check the current Department of Home Affairs guidance for the per-fortnight cap during semester." },
        ],
        mentions: GLOBAL_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "student-visa-process-explained",
        title: "Student Visa Process Explained",
        description: "A general framework for any student visa: documents, financial evidence, interview readiness, and timing across destinations.",
        summary: "Student visa applications share a common shape across countries: admission proof, financial evidence, identity and academic documents, English-language proof, and an interview or credibility assessment.",
        body: "Although every destination has its own rules, student visa applications share a common shape.\n\nFirst, you need proof of admission to a recognized institution — an I-20, CAS, CoE, Letter of Acceptance, or equivalent. Second, you need financial evidence: enough funds to cover tuition and living costs for the qualifying period, in a recognized form (bank statements, GICs, sponsor affidavits).\n\nThird, you provide identity and academic documents: passport, transcripts, certificates, English-language evidence. Fourth, you complete the destination's online application — DS-160 for the USA, UK Student Visa form, Study Permit application for Canada, subclass 500 for Australia — and pay required fees.\n\nFinally, you prepare for the interview or credibility assessment. Be clear on what you will study, why this country and institution, how it is funded, and your plans after graduation. HIGAET runs structured visa preparation by destination.",
        faqs: [
          { q: "How early should I apply?", a: "As soon as you have admission and financial documents — usually 3–4 months before the program start date." },
          { q: "What is the biggest reason for refusal?", a: "Inconsistent or insufficient financial evidence and unclear answers about study intent and post-study plans." },
          { q: "Can I appeal a refusal?", a: "Some countries allow administrative review; many require a fresh application. Either way, address the original reason for refusal before reapplying." },
        ],
        mentions: [...GLOBAL_MENTIONS, `${BASE}/docs/visa/usa-f1`, `${BASE}/docs/visa/uk-student`],
        updated: TODAY,
      },
      {
        slug: "sop-writing-guide",
        title: "SOP Writing Guide",
        description: "How to write a Statement of Purpose: structure, what admissions readers look for, common mistakes, and an editing process that works.",
        summary: "A strong SOP is a specific, evidenced argument for why a particular program at a particular university fits a candidate's trajectory. Structure, specificity, and revision matter more than literary flair.",
        body: "A Statement of Purpose answers four questions admissions readers always have: who are you, why this field, why this program at this university, and what do you intend to do after.\n\nOpen with a concrete anchor — a moment, project, or problem that signals genuine interest. Build the middle with evidence: academic work, projects, internships, publications, leadership. Make the choice of program specific: which courses, faculty, labs, or initiatives map to your goals. Close with a forward statement of intended work and impact.\n\nAvoid generic openings, exaggerated language, and recycled paragraphs. Admissions readers see thousands of SOPs and notice templates.\n\nRevise in passes: first for structure, then for evidence, then for specificity, then for sentence-level clarity. HIGAET counsellors review SOPs with structured feedback and program-specific guidance.",
        faqs: [
          { q: "How long should an SOP be?", a: "Typically 800–1200 words unless the school specifies a different length. Match the school's instructions exactly." },
          { q: "Should I reuse one SOP across schools?", a: "Reuse the structure and core evidence; rewrite the program-specific section for each school. Generic SOPs underperform." },
          { q: "Can I use AI to draft my SOP?", a: "Use AI to brainstorm and edit, but the voice and specifics must be your own. Admissions teams increasingly screen for generic AI-generated text." },
        ],
        mentions: [...GLOBAL_MENTIONS, `${BASE}/docs/study-abroad/admissions-process`],
        updated: TODAY,
      },
      {
        slug: "lor-writing-guide",
        title: "LOR Writing Guide",
        description: "How recommenders write strong letters: structure, evidence, calibration, and how applicants should support their referees.",
        summary: "Strong LORs combine context, evidence, and calibration: who the recommender is, what they observed, how the candidate compares, and a forward-looking endorsement tied to the target program.",
        body: "A Letter of Recommendation works when it is specific. Generic praise — 'hardworking, sincere, intelligent' — adds nothing.\n\nA strong LOR opens with the recommender's role and the basis of evaluation: courses taught, projects supervised, time worked together. The middle provides 2–3 evidenced examples of the candidate's work — a project, a problem solved, a behavior under pressure. It calibrates the candidate against peers in concrete terms: top decile, comparable to past students who succeeded at similar programs.\n\nIt closes with a forward statement: why this candidate is suited to the specific program and what they will contribute.\n\nApplicants should help their recommenders by sharing CV, transcripts, SOP, program details, and concrete examples of joint work. Give recommenders 3–4 weeks of notice.",
        faqs: [
          { q: "How many recommenders do I need?", a: "Most graduate programs require two or three. Match the mix to the school's instructions — usually two academic and one professional." },
          { q: "Should the recommender know me well?", a: "Yes. A specific letter from a less famous recommender outperforms a generic letter from a senior one." },
          { q: "Can the applicant draft the LOR?", a: "Some recommenders ask for a draft. The final letter must reflect the recommender's genuine view, with their edits, in their voice." },
        ],
        mentions: [...GLOBAL_MENTIONS, `${BASE}/docs/study-abroad/admissions-process`],
        updated: TODAY,
      },
      {
        slug: "scholarship-application-guide",
        title: "Scholarship Application Guide",
        description: "Types of scholarships, eligibility patterns, application craft, and how to plan scholarships into your admissions timeline.",
        summary: "Scholarships fall into merit, need, country, and program-specific categories. Strong applications start early, target a focused list, and reuse evidence across applications without recycling generic essays.",
        body: "Scholarships fall into four broad categories. Merit scholarships reward academic and extracurricular achievement. Need-based scholarships address financial circumstances. Country and identity scholarships target specific groups. Program- and institution-specific scholarships are administered by the school itself.\n\nApplications reward early planning. Identify a focused shortlist of 5–10 scholarships you genuinely qualify for. Build a master evidence pack — transcripts, certificates, achievements, recommenders, essays — and adapt it per application rather than starting from scratch each time.\n\nTreat scholarship essays like SOPs: specific, evidenced, and aligned to the scholarship's stated mission. Submit ahead of deadlines; many scholarships are oversubscribed and review on a rolling basis.\n\nHIGAET integrates scholarship planning into the admissions timeline so students do not miss eligibility windows.",
        faqs: [
          { q: "When should I start applying?", a: "12–18 months before intake. Many scholarships close before university application deadlines." },
          { q: "Can I stack scholarships?", a: "Sometimes. Read each scholarship's terms — some prohibit combining with other awards above a threshold." },
          { q: "Do scholarships affect visa funding proof?", a: "Yes — scholarship awards count toward financial evidence for most student visas, with documentation from the awarding body." },
        ],
        mentions: [...GLOBAL_MENTIONS, `${BASE}/global-education/scholarships`],
        updated: TODAY,
      },
      {
        slug: "university-selection-framework",
        title: "University Selection Framework",
        description: "A repeatable framework for shortlisting universities across ambition, fit, and safety — with the criteria that actually matter.",
        summary: "A practical shortlist balances ambition, fit, and safety options against criteria that matter: program strength, faculty, outcomes, location, cost, and personal constraints — not rankings alone.",
        body: "University selection is a decision under uncertainty. A repeatable framework helps.\n\nGroup universities into three buckets. Ambition schools — strong programs where your profile is at the upper end of acceptable. Fit schools — where your profile is comfortably within the admitted range. Safety schools — where you are confidently above the threshold and would still accept the offer.\n\nWithin each bucket, score against criteria that actually matter for you: program strength and specialization, faculty whose work aligns with your interests, outcomes for graduates, location and cost of living, total cost after scholarships, and any personal constraints.\n\nRankings are signal, not destiny. Two universities with the same overall rank can differ enormously in program strength and outcomes for your specific field. HIGAET counsellors run shortlist reviews against these criteria.",
        faqs: [
          { q: "How many schools should I apply to?", a: "Usually 6–10 for graduate programs: 2–3 ambition, 3–4 fit, 2–3 safety." },
          { q: "Should I optimize for ranking?", a: "Optimize for program strength and outcomes in your field. Rankings often hide the variation that actually affects your career." },
          { q: "What if I only get into safety schools?", a: "A strong outcome from a safety school usually beats deferring a year. Evaluate each offer against your goals before declining." },
        ],
        mentions: GLOBAL_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "international-student-checklist",
        title: "International Student Checklist",
        description: "A pre-departure and arrival checklist covering documents, money, accommodation, travel, health, and first-weeks routines.",
        summary: "A reliable international-student checklist covers documents, money, accommodation, travel, health insurance, and a first-weeks routine — applied consistently, it removes most early-stage stress.",
        body: "Pre-departure preparation collapses into six categories.\n\nDocuments: passport, visa, I-20/CAS/CoE/Letter of Acceptance, admission letter, academic records, ID copies, and digital backups stored securely.\n\nMoney: a primary international bank or fintech account, a backup card, some local currency for arrival, and a plan for tuition and living expense transfers.\n\nAccommodation: confirmed housing for at least the first month, address, contact, and clear arrival instructions.\n\nTravel: flights aligned to housing availability and visa entry rules, transit visas where required, and ground transport on arrival.\n\nHealth: required vaccinations, health insurance valid from arrival, and any ongoing prescriptions with documentation.\n\nFirst weeks: register at the university, attend orientation, set up local SIM and bank account, locate clinic and pharmacy, plan a weekly routine. HIGAET provides destination-specific checklists and pre-departure sessions.",
        faqs: [
          { q: "When should I book flights?", a: "After visa approval and housing confirmation. Arrival windows usually align with orientation week." },
          { q: "Cash on arrival?", a: "Enough for 1–2 days of expenses; rely primarily on cards and bank transfers after." },
          { q: "What if my housing falls through?", a: "Have a backup — short-stay accommodation booked refundable. University housing offices can often help in emergencies." },
        ],
        mentions: GLOBAL_MENTIONS,
        updated: TODAY,
      },
    ],
  },

  // ============================================================
  // Existing supporting categories retained
  // ============================================================
  {
    slug: "academy",
    name: "Academy Documentation",
    description: "Programs, certifications, learning paths, faculty model, and outcomes at HIGAET Academy.",
    articles: [
      {
        slug: "getting-started",
        title: "Getting started with HIGAET Academy",
        description: "How to choose a program, evaluate eligibility, and plan your first term.",
        body: "HIGAET Academy organizes AI engineering education across foundations, career tracks, advanced specializations, and executive programs.\n\nThis guide walks through choosing a program, checking eligibility, and planning your first term.",
        faqs: [
          { q: "How do I choose a program?", a: "Start from your goal — career switch, upskilling, or executive depth — then match level and duration." },
          { q: "Are scholarships available?", a: "Yes, through the HIGAET Aptitude Test (HAT)." },
        ],
        mentions: ACADEMY_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "certifications",
        title: "HIGAET Academy certifications",
        description: "How certifications are awarded, verified, and recognized by industry partners.",
        body: "Certifications are issued on completion of program assessments and capstone reviews. Each certificate carries a verifiable ID and QR.",
        mentions: ACADEMY_MENTIONS,
        updated: TODAY,
      },
    ],
  },
  {
    slug: "visa",
    name: "Visa Guides",
    description: "Destination-specific visa requirements, documentation, and interview preparation.",
    articles: [
      {
        slug: "usa-f1",
        title: "USA F-1 student visa guide",
        description: "Documentation, financial evidence, SEVIS, and interview preparation for the F-1 visa.",
        body: "Covers I-20 issuance, SEVIS payment, DS-160, financial documentation, and consular interview preparation.",
        mentions: GLOBAL_MENTIONS,
        updated: TODAY,
      },
      {
        slug: "uk-student",
        title: "UK Student Visa guide",
        description: "CAS, financial requirements, English language evidence, and biometrics for the UK Student Visa.",
        body: "Walks through CAS issuance, maintenance funds, English-language requirements, and the application timeline.",
        mentions: GLOBAL_MENTIONS,
        updated: TODAY,
      },
    ],
  },
  {
    slug: "ai-platform",
    name: "AI Platform Documentation",
    description: "HIGAET AI Platform reference: tutors, advisors, copilots, RAG, observability, and orchestration.",
    articles: [
      {
        slug: "overview",
        title: "HIGAET AI Platform overview",
        description: "Architecture of the HIGAET AI Platform across RAG, agents, and multi-model orchestration.",
        body: "The platform powers AI tutors, advisors, and copilots across the HIGAET ecosystem with RAG, agentic workflows, and observability.",
        updated: TODAY,
      },
    ],
  },
  {
    slug: "api",
    name: "API Documentation",
    description: "HIGAET API platform: authentication, endpoints, webhooks, and rate limits.",
    articles: [
      {
        slug: "authentication",
        title: "API authentication",
        description: "How to authenticate against the HIGAET API platform using API keys and tokens.",
        body: "Authenticate with API keys via the `Authorization` header. Keys are scoped and revocable.",
        updated: TODAY,
      },
      {
        slug: "webhooks",
        title: "Webhook delivery",
        description: "Webhook signature verification, retries, and event types.",
        body: "Webhook deliveries are signed with HMAC-SHA256. Verify signatures with timing-safe comparison.",
        updated: TODAY,
      },
    ],
  },
  {
    slug: "knowledge-base",
    name: "Knowledge Base",
    description: "Short answers to common questions about HIGAET programs, services, and policies.",
    articles: [
      {
        slug: "what-is-higaet",
        title: "What is HIGAET?",
        description: "A short definition of HIGAET and its three divisions.",
        body: "HIGAET (Helen Institute of Gen AI Engineering & Technology) is a global institute operating HIGAET Academy, HIGAET Global Education Hub, and HIGAET Technologies.",
        updated: TODAY,
      },
    ],
  },
  {
    slug: "faq",
    name: "FAQ Center",
    description: "Frequently asked questions across Academy, Global Education Hub, and Technologies.",
    articles: [
      {
        slug: "general",
        title: "General FAQs",
        description: "Common questions about HIGAET as an organization.",
        body: "Common questions about HIGAET as a global institute.",
        faqs: [
          { q: "Where is HIGAET based?", a: "HIGAET operates globally with online and on-campus programs." },
          { q: "How can I contact HIGAET?", a: "Use the contact page of the relevant division — Academy, Global Education Hub, or Technologies." },
        ],
        updated: TODAY,
      },
    ],
  },
  {
    slug: "policies",
    name: "Policies",
    description: "Privacy, terms, refund, and academic integrity policies.",
    articles: [
      {
        slug: "privacy-overview",
        title: "Privacy overview",
        description: "How HIGAET collects, processes, and protects personal data.",
        body: "Summary of HIGAET's privacy posture. See the full Privacy Policy for binding terms.",
        updated: TODAY,
      },
    ],
  },
];

export function getCategory(slug: string): DocCategory | undefined {
  return DOC_CATEGORIES.find((c) => c.slug === slug);
}

export function getArticle(categorySlug: string, articleSlug: string) {
  const c = getCategory(categorySlug);
  if (!c) return undefined;
  const article = c.articles.find((a) => a.slug === articleSlug);
  if (!article) return undefined;
  return { category: c, article };
}
