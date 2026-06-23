# Authorization Fixture Specification

Reproducible fixtures consumed by `.github/workflows/authorization-verification.yml`
to prove gate behavior without a live staging environment.

## Fixture invocation

```bash
READINESS_FIXTURE_STATUS=NO-GO bun scripts/check-staging-readiness.ts
READINESS_FIXTURE_STATUS=GO    bun scripts/check-staging-readiness.ts
```

`READINESS_FIXTURE_STATUS` short-circuits live probes and records a single
`Fixture / forced <STATUS>` check, so all downstream report / cache /
history / output logic runs unchanged.

---

## Fixture 1 — NO-GO

| Field | Value |
| --- | --- |
| Input | `READINESS_FIXTURE_STATUS=NO-GO` |
| Expected exit code | `1` (non-zero) |
| Expected `status` output | `NO-GO` |
| Expected `transitioned` output | `false` (unless prior was GO) |
| Expected `deep_links_ok` output | `true` |
| Authorization result | **denied** — gate job exits non-zero |
| Artifact links present | ✅ readiness report, raw evidence, run URL, history file |

### Golden output (excerpt)

```
[FAIL] Fixture / forced NO-GO
Report: docs/infrastructure/phase-2-2-prerequisite-report.md
Cache:  test-results/readiness/cache.json (key=<sha>)
DeepLinks: OK — report=ok, history=ok, run_url=local, ...
Overall: NO-GO (prior: <prior>)
```

```
status=NO-GO
transitioned=false
deep_links_ok=true
```

### Gate failure summary (markdown)

```
## Phase 2.2 Authorization

- Source: `live`
- Status: `NO-GO`

**NO-GO** — readiness `NO-GO`.

Evidence:
- [Readiness Report](../../blob/main/docs/infrastructure/phase-2-2-prerequisite-report.md)
- [Readiness History](../../blob/main/docs/infrastructure/staging-readiness-history.md)
- Workflow run: <run URL>
```

---

## Fixture 2 — GO

| Field | Value |
| --- | --- |
| Input | `READINESS_FIXTURE_STATUS=GO` |
| Expected exit code | `0` |
| Expected `status` output | `GO` |
| Expected gate decision | `GO FOR STAGING SOAK` (authorization permitted) |
| Expected `deep_links_ok` output | `true` |
| Artifact links present | ✅ readiness report, raw evidence, run URL, history file |

### Golden output (excerpt)

```
[PASS] Fixture / forced GO
Report: docs/infrastructure/phase-2-2-prerequisite-report.md
Cache:  test-results/readiness/cache.json (key=<sha>)
DeepLinks: OK — ...
Overall: GO (prior: <prior>)
```

```
status=GO
deep_links_ok=true
cache_key=<16-char sha256>
```

### Gate success summary (markdown)

```
## Phase 2.2 Authorization

- Source: `live`
- Status: `GO`

**GO** — readiness PASS. Dispatch `staging-rollback-validation.yml` to deploy.
```

---

## Sign-off

The authorization gate is verified when both fixture legs of
`authorization-verification.yml` report PASS in the most recent main-branch run.
