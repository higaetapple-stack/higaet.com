
-- COUNTRIES
CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  iso_code text,
  summary text,
  description text,
  hero_image_url text,
  flag_emoji text,
  currency text,
  primary_language text,
  visa_info text,
  cost_of_living text,
  avg_tuition_usd numeric,
  popular_intakes text[],
  highlights text[],
  published boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.countries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.countries TO authenticated;
GRANT ALL ON public.countries TO service_role;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "countries_public_read" ON public.countries FOR SELECT USING (published = true);
CREATE POLICY "countries_admin_all" ON public.countries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_countries_updated BEFORE UPDATE ON public.countries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- UNIVERSITIES
CREATE TABLE public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  country_id uuid REFERENCES public.countries(id) ON DELETE SET NULL,
  city text,
  overview text,
  description text,
  hero_image_url text,
  logo_url text,
  website_url text,
  world_ranking int,
  national_ranking int,
  acceptance_rate numeric,
  avg_tuition_usd numeric,
  intakes text[],
  accreditations text[],
  requirements text,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.universities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.universities TO authenticated;
GRANT ALL ON public.universities TO service_role;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "universities_public_read" ON public.universities FOR SELECT USING (published = true);
CREATE POLICY "universities_admin_all" ON public.universities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_universities_updated BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_universities_country ON public.universities(country_id);

-- UNIVERSITY PROGRAMS
CREATE TABLE public.university_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  level text NOT NULL,
  field text,
  duration_months int,
  tuition_usd numeric,
  intakes text[],
  requirements text,
  description text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (university_id, slug)
);
GRANT SELECT ON public.university_programs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.university_programs TO authenticated;
GRANT ALL ON public.university_programs TO service_role;
ALTER TABLE public.university_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uniprograms_public_read" ON public.university_programs FOR SELECT USING (published = true);
CREATE POLICY "uniprograms_admin_all" ON public.university_programs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_uniprograms_updated BEFORE UPDATE ON public.university_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHOLARSHIPS
CREATE TABLE public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  country_id uuid REFERENCES public.countries(id) ON DELETE SET NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  amount_usd numeric,
  coverage text,
  deadline date,
  eligibility text,
  description text,
  apply_url text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scholarships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scholarships TO authenticated;
GRANT ALL ON public.scholarships TO service_role;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scholarships_public_read" ON public.scholarships FOR SELECT USING (published = true);
CREATE POLICY "scholarships_admin_all" ON public.scholarships FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_scholarships_updated BEFORE UPDATE ON public.scholarships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- STUDY ABROAD LEADS
CREATE TABLE public.study_abroad_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country_of_interest text,
  level_of_interest text,
  field_of_interest text,
  intake_year int,
  message text,
  source text,
  status text NOT NULL DEFAULT 'new',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.study_abroad_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_abroad_leads TO authenticated;
GRANT ALL ON public.study_abroad_leads TO service_role;
ALTER TABLE public.study_abroad_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sa_leads_public_insert" ON public.study_abroad_leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "sa_leads_auth_insert" ON public.study_abroad_leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sa_leads_admin_all" ON public.study_abroad_leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_sa_leads_updated BEFORE UPDATE ON public.study_abroad_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- APPLICATIONS (study abroad)
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  program_id uuid REFERENCES public.university_programs(id) ON DELETE SET NULL,
  intake text,
  status text NOT NULL DEFAULT 'lead',
  notes text,
  offer_letter_url text,
  submitted_at timestamptz,
  offer_received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_owner_read" ON public.applications FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "applications_owner_insert" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "applications_owner_update" ON public.applications FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "applications_admin_delete" ON public.applications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_applications_student ON public.applications(student_id);

-- APPLICATION DOCUMENTS
CREATE TABLE public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_url text NOT NULL,
  file_name text,
  version int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'submitted',
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO service_role;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appdocs_owner_read" ON public.application_documents FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "appdocs_owner_insert" ON public.application_documents FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "appdocs_owner_update" ON public.application_documents FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "appdocs_owner_delete" ON public.application_documents FOR DELETE TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_appdocs_updated BEFORE UPDATE ON public.application_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TECHNOLOGIES LEADS
CREATE TABLE public.technologies_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  service_interest text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.technologies_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technologies_leads TO authenticated;
GRANT ALL ON public.technologies_leads TO service_role;
ALTER TABLE public.technologies_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tech_leads_public_insert" ON public.technologies_leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "tech_leads_auth_insert" ON public.technologies_leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tech_leads_admin_all" ON public.technologies_leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_tech_leads_updated BEFORE UPDATE ON public.technologies_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SEED COUNTRIES
INSERT INTO public.countries (slug, name, iso_code, flag_emoji, summary, currency, primary_language, popular_intakes, avg_tuition_usd, display_order) VALUES
('usa','United States','US','🇺🇸','World-leading research universities, STEM-OPT work pathways, vast scholarship landscape.','USD','English',ARRAY['Fall','Spring'],35000,1),
('canada','Canada','CA','🇨🇦','Affordable globally-ranked universities with strong PR pathways for international graduates.','CAD','English / French',ARRAY['Fall','Winter','Summer'],22000,2),
('uk','United Kingdom','GB','🇬🇧','One-year masters, prestigious institutions, two-year graduate route work visa.','GBP','English',ARRAY['September','January'],28000,3),
('australia','Australia','AU','🇦🇺','High-quality teaching, post-study work rights up to four years, vibrant student cities.','AUD','English',ARRAY['February','July'],26000,4),
('germany','Germany','DE','🇩🇪','Low or zero tuition at public universities, strong engineering and research ecosystem.','EUR','German / English',ARRAY['Winter','Summer'],3000,5),
('ireland','Ireland','IE','🇮🇪','English-speaking EU hub for tech and pharma with two-year stay-back option.','EUR','English',ARRAY['September'],20000,6),
('new-zealand','New Zealand','NZ','🇳🇿','Safe study environment, generous post-study work visas, eight globally-ranked universities.','NZD','English',ARRAY['February','July'],24000,7),
('singapore','Singapore','SG','🇸🇬','Asia''s premier business and tech hub with world-class universities and strong industry links.','SGD','English',ARRAY['August','January'],30000,8);

-- SEED SAMPLE UNIVERSITIES (2-3 per country)
INSERT INTO public.universities (slug, name, country_id, city, overview, world_ranking, avg_tuition_usd, intakes, featured)
SELECT s.slug, s.name, c.id, s.city, s.overview, s.world_ranking, s.tuition, s.intakes, s.featured
FROM (VALUES
  ('mit','Massachusetts Institute of Technology','usa','Cambridge, MA','Premier STEM and research institution shaping technology, science, and entrepreneurship globally.',1,57000,ARRAY['Fall'],true),
  ('stanford','Stanford University','usa','Stanford, CA','Silicon Valley powerhouse known for engineering, business, and a startup-driven culture.',3,58000,ARRAY['Fall'],true),
  ('cmu','Carnegie Mellon University','usa','Pittsburgh, PA','Top-ranked computer science and AI programs with strong industry connections.',28,59000,ARRAY['Fall','Spring'],false),
  ('toronto','University of Toronto','canada','Toronto','Canada''s top research university, ranked #1 in the country across multiple disciplines.',21,42000,ARRAY['Fall','Winter'],true),
  ('ubc','University of British Columbia','canada','Vancouver','Globally ranked, scenic west-coast campus with strengths in CS, engineering, and life sciences.',34,40000,ARRAY['Fall','Winter'],false),
  ('mcgill','McGill University','canada','Montreal','Historic English-language university with global reputation in medicine, law, and engineering.',30,38000,ARRAY['Fall','Winter'],false),
  ('oxford','University of Oxford','uk','Oxford','One of the oldest and most prestigious universities in the world, renowned across disciplines.',2,45000,ARRAY['September'],true),
  ('cambridge','University of Cambridge','uk','Cambridge','World-leading research university with exceptional programs in STEM and humanities.',5,46000,ARRAY['September'],true),
  ('imperial','Imperial College London','uk','London','Specialist science, engineering, medicine, and business university in central London.',6,42000,ARRAY['September'],false),
  ('melbourne','University of Melbourne','australia','Melbourne','Top-ranked Australian university with strong global research output.',14,38000,ARRAY['February','July'],true),
  ('sydney','University of Sydney','australia','Sydney','Australia''s oldest university with comprehensive programs and iconic harbourside campus.',19,40000,ARRAY['February','July'],false),
  ('unsw','UNSW Sydney','australia','Sydney','Renowned for engineering, business, and technology research.',19,37000,ARRAY['February','July'],false),
  ('tum','Technical University of Munich','germany','Munich','Germany''s leading technical university with global research excellence and strong industry ties.',37,1500,ARRAY['Winter','Summer'],true),
  ('rwth','RWTH Aachen University','germany','Aachen','Top engineering and applied sciences university in Europe.',106,1500,ARRAY['Winter','Summer'],false),
  ('tcd','Trinity College Dublin','ireland','Dublin','Ireland''s top university, internationally renowned across arts, sciences, and business.',81,28000,ARRAY['September'],true),
  ('ucd','University College Dublin','ireland','Dublin','Largest Irish university with strong programs in business, engineering, and computer science.',171,26000,ARRAY['September'],false),
  ('auckland','University of Auckland','new-zealand','Auckland','New Zealand''s top-ranked university with comprehensive programs and global research strength.',68,32000,ARRAY['February','July'],true),
  ('otago','University of Otago','new-zealand','Dunedin','Historic New Zealand university known for health sciences, business, and humanities.',206,28000,ARRAY['February','July'],false),
  ('nus','National University of Singapore','singapore','Singapore','Asia''s top-ranked university with global research leadership and dynamic campus life.',8,38000,ARRAY['August','January'],true),
  ('ntu','Nanyang Technological University','singapore','Singapore','Young, fast-rising research-intensive university especially strong in engineering and business.',15,36000,ARRAY['August','January'],true)
) AS s(slug, name, country_slug, city, overview, world_ranking, tuition, intakes, featured)
JOIN public.countries c ON c.slug = s.country_slug;
