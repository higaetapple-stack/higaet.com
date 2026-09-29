# HIGAET AI Engineering Knowledge Hub — Conceptual Structure (from actual articles)
# Based on authoritative mapping from src/routes/blog.$slug.tsx (10 POST entries verified live)

PHASE 1: AUTHORITATIVE MAPPING (verified from source + live URLs)
t_1ec42740 → /blog/generative-ai-engineering → Generative AI Engineering (FOUNDATION / PILLAR)
t_blog_20260930_01 → /blog/ai-agents-mcp-protocol → AI Agents & MCP Protocol (AGENT ENGINEERING)
t_blog_20260930_02 → /blog/vector-dbs-rag → Vector Databases for Production RAG (RETRIEVAL / RAG ENGINEERING)
t_blog_20260930_03 → /blog/llm-eval-frameworks → LLM Evaluation Frameworks (EVALUATION / QUALITY)
t_blog_20260930_04 → /blog/prompt-engineering-software → Prompt Engineering as Software (LLM APPLICATION)
t_blog_20260930_05 → /blog/enterprise-ai-governance → Enterprise AI Governance (PRODUCTION SAFETY / GOVERNANCE)
t_blog_20260930_06 → /blog/fine-tuning-vs-rag → Fine-Tuning vs RAG (ADVANCED DECISION / MODEL CHOICE)
t_blog_20260930_07 → /blog/cost-latency-optimization → Cost & Latency Optimization (PRODUCTION PERFORMANCE)
t_blog_20260930_08 → /blog/multi-agent-orchestration → Multi-Agent Orchestration (AGENT SYSTEMS / ORCHESTRATION)
t_blog_20260930_09 → /blog/multi-agent-orchestration → Multi-Agent Orchestration (AGENT SYSTEMS — structural verification entry; same URL as 08, separate ID)

PHASE 2: KNOWLEDGE-HUB STRUCTURE (conceptual — derived from actual content)

GENERATIVE AI ENGINEERING (PILLAR)
├── LLM ENGINEERING
│   ├── t_04 Prompt Engineering as Software (application layer — prompts as code)
│   ├── t_06 Fine-Tuning vs RAG (model decision: behavior vs retrieval)
│   └── (t_01 / t_08 extend into agent orchestration)
├── RAG ENGINEERING
│   ├── t_02 Vector Databases for Production RAG (retrieval architecture, vector DB selection)
│   ├── t_07 Cost & Latency Optimization (retrieval performance, routing)
│   └── connects to t_01 (MCP retrieval integration), t_03 (evaluation of retrieval quality)
├── AGENT ENGINEERING
│   ├── t_01 AI Agents & MCP Protocol (agent-tool integration, MCP spec, protocol)
│   ├── t_08 Multi-Agent Orchestration (ReAct, plan-and-execute, tool loops, guardrails)
│   └── connects to t_05 (governance / identity / audit for agents), t_03 (evaluation of agent outputs)
├── AI PRODUCTION ENGINEERING
│   ├── t_03 LLM Evaluation Frameworks (harness, golden dataset, CI gate — evaluation is primary)
│   ├── t_05 Enterprise AI Governance (data residency, PII, identity/auth, red-team, audit, guardrail proof)
│   ├── t_07 Cost & Latency Optimization (production economics, routing, inference optimization)
│   └── connects to all (production is where pillar meets reality)
└── FOUNDATIONS / CROSS-CUTTING
    ├── t_01 connects to all (MCP is integration layer for retrieval + agents + evaluation)
    ├── t_03 connects to all (evaluation must cover every stage)
    └── t_05 connects to all (governance applies to all agent actions)

LEARNING PATH (actual sequence based on content, not forced):
FOUNDATIONS → t_1ec42740 (Generative AI Engineering pillar — what, why, how)
→ APPLICATION → t_04 (Prompt Engineering) + t_06 (Fine-Tuning vs RAG decision)
→ RETRIEVAL → t_02 (Vector DBs for RAG — architecture + selection)
→ EVALUATION → t_03 (LLM Evaluation — harness + measurement)
→ AGENT SYSTEMS → t_01 (AI Agents / MCP) → t_08 (Multi-Agent Orchestration)
→ PRODUCTION → t_05 (Governance) + t_07 (Cost/Latency)
→ ADVANCED → revisit t_06 (model selection) + t_03 (evaluation refinement)

PHASE 3: INTERNAL LINK STATUS (current — needs improvement)
- t_1ec42740: references Anthropic MCP, HIGAET pillar — but no internal link to t_01, t_02, t_03, t_05, t_08 in content
- t_01 (ai-agents): references Anthropic MCP spec, HIGAET pillar (t_1ec42740), NIST 2026, arXiv 2604.19818, Agent Guard — needs cross-links to t_02 (retrieval), t_03 (evaluation), t_08 (orchestration)
- t_02 (vector-dbs-rag): references Chroma/Pinecone/Weaviate docs, HIGAET pillar — needs links to t_01 (MCP retrieval), t_03 (retrieval quality eval), t_07 (cost/latency)
- t_03 (llm-eval-frameworks): references IBM, NIST, arXiv, LangSmith — needs links to t_05 (governance), t_01 (agent evaluation context)
- t_05 (enterprise-ai-governance): references NIST, Agent Guard, arXiv — needs links to t_01 (agent identity/auth), t_08 (multi-agent security)
- t_08 (multi-agent-orchestration): references Anthropic MCP, NIST, arXiv — needs links to t_01 (MCP protocol), t_02 (retrieval feeding agents)

PHASE 4: NAVIGATION / LEARNING PATH (existing template — blog.index.tsx + blog.$slug.tsx)
- Blog index (blog.index.tsx) lists articles by slug; can add "Related" links in each POST content (already present as References; will strengthen)
- Article navigation can be added via content links (descriptive anchor text) rather than new UI elements — keeps template clean
