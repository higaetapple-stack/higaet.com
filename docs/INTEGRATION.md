# Backend Integration Guide

The frontend is API-agnostic. Each `src/content/*.ts` registry is the contract that the future Node.js + Express.js + MySQL backend must fulfil.

## Expected endpoints (REST)
| Method | Path | Returns |
|---|---|---|
| GET | `/api/services` | `Service[]` |
| GET | `/api/services/:slug` | `Service` |
| GET | `/api/industries` / `:slug` | `Industry` |
| GET | `/api/technologies` / `:slug` | `Technology` |
| GET | `/api/engagement-models` / `:slug` | `EngagementModel` |
| GET | `/api/case-studies` / `:slug` | `CaseStudy` |
| GET | `/api/insights` / `:slug` | `Insight` |
| GET | `/api/company/:slug` | `CompanyPage` |
| POST | `/api/leads` | `{ id }` — contact form submissions |
| POST | `/api/newsletter` | `{ id }` |

## DTOs
The TypeScript interfaces in `src/content/*.ts` are the canonical DTOs. Mirror them in the API and MySQL schema.

## Registry replacement strategy
1. Create `src/lib/<pillar>.functions.ts` exporting `createServerFn` wrappers around the REST endpoints.
2. Replace each registry's `getBySlug` / `getAll` with the server-fn equivalents.
3. Route loaders call the server fn via `ensureQueryData`; component code is unchanged.
4. Delete the in-code registry array once parity is verified.

## Auth integration
- Lovable Cloud (Supabase) is wired in `src/integrations/supabase/`.
- For the external Node API, add JWT issuance on Express and verify in a `requireApiAuth` middleware mirroring the existing `requireSupabaseAuth` shape.
- Protected pages should live under `src/routes/_authenticated/`.

## Lead form integration
- `src/components/site/LeadForm.tsx` posts to a single endpoint (currently mocked).
- Wire it to `POST /api/leads`; persist to MySQL `leads` table; trigger transactional email.

## CMS integration
Registries are flat typed records — drop-in compatible with headless CMS (Strapi, Directus, Sanity). Keep the same field names to avoid mapping code.
