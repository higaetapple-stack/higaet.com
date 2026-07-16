# Phase 2.2 — Execution Runbook

Ordered execution procedure for the first authorized Phase 2.2 staging deployment. Each step lists inputs, outputs, failure conditions, and rollback actions.

## 1. Prerequisite Verification

- **Input:** `phase-2-2-prerequisite-report.md` + `phase-2-2-evidence-requirements.md`.
- **Output:** Every row marked PASS with command output attached.
- **Failure:** Any FAIL → STOP. Do not advance.
- **Rollback:** None (no changes made).

## 2. Deployment Workflow

- **Input:** `.github/workflows/staging-rollback-validation.yml`, manual dispatch, branch `main`, optional `sha` input.
- **Output:** Workflow run with green `Activate release` step.
- **Failure:** Workflow non-zero exit before health probe → no rollback needed (symlink not swapped or previous-release marker still valid).
- **Rollback:** If symlink swung but downstream steps fail, the workflow's `Rollback on failure` job triggers automatically (covered in step 8).

## 3. Boot Validation

- **Input:** `STAGING_BASE_URL`.
- **Command:** `for i in $(seq 10); do curl -fsS "$STAGING_BASE_URL/api/public/health" && break; sleep 5; done`
- **Output:** JSON with `status: "ok"` within 50 s.
- **Failure:** No 200 after 10 retries → trigger rollback step.
- **Rollback:** Workflow's auto-rollback step.

## 4. Smoke Suite

- **Input:** `SMOKE_BASE_URL=$STAGING_BASE_URL`.
- **Command:** `bun scripts/run-smoke-tests.ts`
- **Output:** `test-results/smoke/summary.json` with `ok: true`, `unexpected: 0`.
- **Failure:** `ok: false` → trigger rollback.
- **Rollback:** Workflow's auto-rollback step.

## 5. Provider Validation

- **Input:** Authenticated admin session.
- **Action:** Open `/dashboard/admin/provider-health`; click each provider's live probe.
- **Output:** All four providers (OpenAI, Gemini, Groq, OpenRouter) return latency + status; chat lanes show ≥1 successful sample each.
- **Failure:** Any provider returns hard error AND no fallback path documented → file finding in `phase-2-2-smoke-report.md`.
- **Rollback:** None unless smoke suite also fails.

## 6. Embedding Validation

- **Action:** Insert a test row into `ai_documents`; wait for cron tick (≤5 min); check `ai_chunks` count > 0 and queue row → `completed`.
- **Output:** 1536-dim vectors present.
- **Failure:** Queue row stays `pending` past 10 min → inspect cron logs; check `OPENAI_API_KEY` and OpenRouter fallback per Phase 1.12.
- **Rollback:** Delete test row + chunks; embedding pipeline failure does not require deploy rollback.

## 7. RAG Validation

- **Action:** Run the 5-query accuracy spreadsheet from `phase-2-2-rag-report.md`.
- **Output:** Top-3 contains the seed doc for all 5 queries; p95 retrieval ≤ 1.5 s.
- **Failure:** <4/5 hits → record as risk, continue (does not block deploy).
- **Rollback:** None.

## 8. Rollback Validation

- **Action:** Deploy a deliberately failing build (debug flag flips a smoke spec) to trigger the auto-rollback path.
- **Output:** `current` symlink restored to baseline SHA; health probe green within 60 s.
- **Failure:** Symlink not restored OR health red after rollback → manual SSH per `staging-recovery-playbook.md`.
- **Rollback:** Manual symlink restore: `ssh ... 'cd ~/apps/higaet && ln -sfn "$(cat .previous-release)" current && touch tmp/restart.txt'`.

## 9. Final Gate

- **Input:** Steps 1–8 results.
- **Output:** Updated `phase-2-2-final-gate.md` with PASS/FAIL per row.
- **Decision:** All categories PASS → **GO FOR STAGING SOAK (Phase 2.3)**. Otherwise → NO-GO with remediation.
