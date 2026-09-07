-- HIGAET Global Education: public read access to published directory rows.
--
-- Root cause (2026-09-08 audit): the study-abroad tables
-- (countries, universities, university_programs, scholarships) had RLS
-- enabled with published-only SELECT policies, but the anon/authenticated
-- roles were never GRANTed table-level SELECT. Every public read therefore
-- failed with "permission denied for table ...", leaving
-- /global-education/countries, /universities and /scholarships rendering
-- empty "Loading..." shells for crawlers and users (verified live via the
-- _serverFn responses).
--
-- Fix: least-privilege table GRANTs. Row visibility is still governed by
-- the pre-existing published-only RLS policies
-- (countries_public_read, universities_public_read,
-- uniprograms_public_read, scholarships_public_read), so draft rows stay
-- hidden. Service-role server paths are unaffected (bypasses RLS).
-- Fully reversible via REVOKE.

GRANT SELECT ON public.countries TO anon, authenticated;
GRANT SELECT ON public.universities TO anon, authenticated;
GRANT SELECT ON public.university_programs TO anon, authenticated;
GRANT SELECT ON public.scholarships TO anon, authenticated;

-- The production server functions query through the service role, which
-- bypasses RLS but still requires table-level GRANTs on these tables.
GRANT SELECT ON public.countries TO service_role;
GRANT SELECT ON public.universities TO service_role;
GRANT SELECT ON public.university_programs TO service_role;
GRANT SELECT ON public.scholarships TO service_role;
