# Development Guide

## Local development
```bash
bun install
bun run dev        # http://localhost:8080
```
Lovable runs build/typecheck automatically; locally use `bun run build` only when verifying production output.

## Environment variables
Copy `.env.example` to `.env.local` and fill values.

| Variable | Purpose | Required |
|---|---|---|
| `VITE_SITE_URL` | Canonical base URL (e.g. https://higaet.com) | yes (prod) |
| `VITE_GA4_ID` | Google Analytics 4 measurement ID | optional |
| `VITE_GTM_ID` | Google Tag Manager container | optional |
| `VITE_META_PIXEL_ID` | Meta Pixel | optional |
| `VITE_CLARITY_ID` | Microsoft Clarity | optional |
| `VITE_GSC_VERIFICATION` | Google Search Console meta token | optional |
| `VITE_CONTACT_EMAIL` | Public contact email | yes |
| `VITE_API_BASE_URL` | Future Node/Express API | future |
| `VITE_FEATURE_*` | Feature flags | future |

`VITE_SUPABASE_*` are managed automatically — do not edit.

## Build & deploy
- `bun run build` → static + SSR bundle in `.output/`.
- Lovable preview deploys every commit; published deploys via the Publish button.
- Future external hosting: GitHub → MilesWeb / Hostinger via FTP or GitHub Actions.

## Adding content

### New service
1. Append a `Service` entry to `src/content/services.ts`.
2. Create `src/routes/technologies.services.<slug>.tsx` (copy any existing service route).
3. Sitemap and category nav update automatically.

### New industry / technology / engagement model / case study / article / company page
Same pattern: add registry entry in `src/content/<pillar>.ts` → create a thin route file under `src/routes/technologies.<pillar>.<slug>.tsx` that renders the shared `<PillarDetailPage entry={...} />`.

### New top-level page
1. Create `src/routes/<name>.tsx` with `createFileRoute("/<name>")`.
2. Add a unique `head()` (title, description, og:*, canonical).
3. Link it from `Header` / `Footer` as needed.

## Conventions
- No hardcoded color utilities; use semantic tokens.
- One H1 per page, semantic landmarks, alt text on every image.
- All external links: `rel="noopener noreferrer"`.
- No `useEffect + fetch` for initial data — use loaders / server functions.
