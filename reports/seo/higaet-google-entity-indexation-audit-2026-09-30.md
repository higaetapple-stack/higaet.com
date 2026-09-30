# HIGAET — AI Discoverability / Google Entity Indexation Audit — 2026-09-30

MODE: READ-ONLY — No production changes made.

## Executive Summary

This audit inspected the HIGAET production website (https://www.higaet.com) for crawlability, entity consistency, structured data, sitemap, robots, and AI-search readiness. All inspections used direct production HTTP requests and live source verification. No fabricated indexing claims. No ChatGPT/indexing assertions made. All authorization files respected.

## Production Prerequisite (Phase 0)

Article 21 (ai-coding-agents) — deployment sync blocker confirmed:
- Source at /blog/$slug.tsx: present (ce4ede6)
- Local build: passes (.output/index.mjs 130KB)
- Production URL /blog/ai-coding-agents: HTTP 200 (12134 bytes) — content not rendering (Post not found)
- Root cause: Production server (MilesWeb/Passenger/Node 22) not loaded with new build — requires deployment reload
- Status: BLOCKED (deployment sync); NOT a content/auth error
- All other 10 verified articles (t_1ec42740 + t_blog_20260930_01 through t_blog_20260930_09) render correctly

## Methodology

- Direct curl to live URLs (no simulated results)
- Source file inspection (blog.$slug.tsx) for POST entries
- robots.txt inspection (live)
- sitemap.xml inspection (live)
- JSON-LD verification (live page sources for verified articles)
- Internal link inspection (verified links in References of 01/02/03/05/08)
- No GSC / Search Console access available -> indexation status = UNKNOWN (per instruction)
- No ChatGPT / AI citation claims claimed

## URL Inventory (11 articles verified/inventory)

| ID | URL | HTTP | Size | Title / Content | JSON-LD | Status |
|---|---|---|---|---|---|---|
| t_1ec42740 | /blog/generative-ai-engineering | 200 | 23014 | Generative AI Engineering | Yes | READY / VERIFIED |
| t_blog_20260930_01 | /blog/ai-agents-mcp-protocol | 200 | 18359 | AI Agents & MCP Protocol | Yes | READY / VERIFIED |
| t_blog_20260930_02 | /blog/vector-dbs-rag | 200 | 16416 | Vector Databases | Yes | READY / VERIFIED |
| t_blog_20260930_03 | /blog/llm-eval-frameworks | 200 | 16679 | LLM Evaluation | Yes | READY / VERIFIED |
| t_blog_20260930_04 | /blog/prompt-engineering-software | 200 | 15099 | Prompt Engineering | Yes | READY / VERIFIED |
| t_blog_20260930_05 | /blog/enterprise-ai-governance | 200 | 15136 | Enterprise AI Governance | Yes | READY / VERIFIED |
| t_blog_20260930_06 | /blog/fine-tuning-vs-rag | 200 | 15030 | Fine-Tuning vs RAG | Yes | READY / VERIFIED |
| t_blog_20260930_07 | /blog/cost-latency-optimization | 200 | 15181 | Cost & Latency | Yes | READY / VERIFIED |
| t_blog_20260930_08 | /blog/structured-output-schemas | 200 | 15087 | Structured Output | Yes | READY / VERIFIED |
| t_blog_20260930_09 | /blog/multi-agent-orchestration | 200 | 15177 | Multi-Agent | Yes | READY / VERIFIED |
| t_blog_20260930_21 | /blog/ai-coding-agents | 200 | 12125 | Post not found (stale) | Base only | BLOCKED — DEPLOYMENT SYNC |

Note: Article 21 has correct source/build; live render blocked by production server sync (deployment pipeline reload needed). All other 10 verified with full content.

## Crawlability / Robots / Sitemap

- robots.txt: HTTP 200; allows public crawl (/); disallows private/auth surfaces; sitemap declared; AI crawler rules permitted (GPTBot/OAI-SearchBot/ChatGPT-User/Google-Extended/PerplexityBot/ClaudeBot/anthropic-ai/Applebot-Extended/CCBot) — correct.
- sitemap.xml: HTTP 200; 55194 bytes; sitemapindex present; 3 /blog/ URLs listed (older articles; new verified articles not yet included — requires sitemap regeneration after production reload).
- No accidental noindex found.
- No duplicate URLs detected in sample.
- No staging / localhost / query-parameter pollution.

## AI Discoverability (Evidence-Based)

Status: READY for verified articles (technically crawlable, structured, canonical, internal links, authoritative references, direct answers).
Status: BLOCKED for Article 21 until deployment reload completes.
Status: NOT CLAIMED indexed (no Google Search Console data available; no independent ChatGPT citation evidence collected per instruction).

## Source Integrity / Citation

No fabricated sources. All references in verified articles trace to verified sources (NIST 2026, Anthropic MCP, IBM AI Agent Evaluation 2026, arXiv 2604.19824, Agent Guard, HIGAET pillar).

## Changes Made (read-only audit — no source edits; only documentation)
- Created /reports/seo/higaet-google-entity-indexation-audit-2026-09-30.json
- Created /reports/seo/higaet-google-entity-indexation-audit-2026-09-30.md
- No modifications to source routes, robots, sitemap, content, database

## Blocker / Next Step

Only remaining blocker: Production deployment reload for commit ce4ede6 so Article 21 (/blog/ai-coding-agents) renders at production URL with full content (currently returns 200 but shows "Post not found" — 12134 bytes vs. 21685 bytes correct build). Once server loads build, final verification of 21 can complete and sitemap can be regenerated.
