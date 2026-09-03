export interface CountryData {
  name: string;
  slug: string;
  flag: string;
  summary: string;
  avgTuitionUsd: number;
  primaryLanguage: string;
  popularIntakes: string[];
  visaTypes: string[];
  workRights: string;
  postStudyWork: string;
  costOfLivingUsd: number;
  topUniversities: string[];
  scholarships: string[];
  featured: boolean;
  visaProcess?: string[];
}

export const COUNTRIES: Record<string, CountryData> = {
  "usa": {
    name: "United States",
    slug: "usa",
    flag: "🇺🇸",
    summary: "The USA remains the world's top destination for international students, offering unparalleled research opportunities, diverse campuses, and the Optional Practical Training (OPT) program for post-study work.",
    avgTuitionUsd: 45000,
    primaryLanguage: "English",
    popularIntakes: ["Fall (Aug/Sep)", "Spring (Jan)", "Summer (May)"],
    visaTypes: ["F-1 Student Visa", "J-1 Exchange Visitor"],
    workRights: "On-campus 20 hrs/week; OPT up to 12 months (24 months STEM extension)",
    postStudyWork: "OPT: 12 months standard, 36 months for STEM graduates",
    costOfLivingUsd: 15000,
    topUniversities: ["MIT", "Stanford", "Harvard", "Caltech", "UC Berkeley", "CMU", "Georgia Tech", "UIUC", "UT Austin", "University of Washington"],
    scholarships: ["Fulbright-Nehru", "AAUW International Fellowships", "Inlaks Shivdasani", "University-specific merit aid"],
    visaProcess: [
      "Get accepted by a SEVP-certified school and receive Form I-20",
      "Pay the SEVIS I-901 fee",
      "Complete the DS-160 online visa application",
      "Schedule and attend a visa interview at a U.S. embassy or consulate",
      "Provide financial evidence, academic records, and proof of ties to home country",
      "Receive F-1 visa and travel to the U.S. up to 30 days before program start"
    ],
    featured: true
  },
  "canada": {
    name: "Canada",
    slug: "canada",
    flag: "🇨🇦",
    summary: "Canada offers world-class education, welcoming immigration policies, and the Post-Graduation Work Permit (PGWP) — making it a top choice for students seeking long-term career opportunities.",
    avgTuitionUsd: 30000,
    primaryLanguage: "English / French",
    popularIntakes: ["Fall (Sep)", "Winter (Jan)", "Summer (May)"],
    visaTypes: ["Study Permit", "SDS (Student Direct Stream)"],
    workRights: "Off-campus 20 hrs/week during term; full-time during breaks",
    postStudyWork: "PGWP: up to 3 years (program length dependent)",
    costOfLivingUsd: 12000,
    topUniversities: ["University of Toronto", "UBC", "McGill", "Waterloo", "McMaster", "Alberta", "Ottawa", "Western", "Calgary", "Queen's"],
    scholarships: ["Vanier CGS", "Banting Postdoctoral", "University-specific entrance scholarships", "Provincial awards"],
    visaProcess: [
      "Get accepted by a Designated Learning Institution (DLI)",
      "Gather documents: acceptance letter, proof of funds, passport, photos",
      "Apply for study permit online or at a Visa Application Centre (VAC)",
      "Provide proof of funds (tuition + living expenses + return transport)",
      "Complete biometrics and medical exam if required",
      "Receive Port of Entry Letter of Introduction and travel to Canada"
    ],
    featured: true
  },
  "uk": {
    name: "United Kingdom",
    slug: "uk",
    flag: "🇬🇧",
    summary: "The UK offers world-leading universities, shorter master's programs (1 year), and the Graduate Route visa for 2-year post-study work — combining academic excellence with career opportunities.",
    avgTuitionUsd: 28000,
    primaryLanguage: "English",
    popularIntakes: ["September/October", "January/February"],
    visaTypes: ["Student Route (Tier 4)", "Graduate Route"],
    workRights: "20 hrs/week during term; full-time during vacations",
    postStudyWork: "Graduate Route: 2 years (3 years for PhD graduates)",
    costOfLivingUsd: 18000,
    topUniversities: ["Oxford", "Cambridge", "Imperial", "UCL", "LSE", "Edinburgh", "Manchester", "King's College", "Bristol", "Warwick"],
    scholarships: ["Chevening", "Commonwealth", "GREAT Scholarships", "University-specific awards", "Rhodes Scholarship"],
    visaProcess: [
      "Get an unconditional offer from a licensed student sponsor",
      "Receive a Confirmation of Acceptance for Studies (CAS)",
      "Prove English language proficiency (IELTS/TOEFL)",
      "Apply for Student Route visa online up to 6 months before course start",
      "Pay Immigration Health Surcharge and visa fee",
      "Attend biometric appointment and submit documents",
      "Receive visa vignette and travel to UK"
    ],
    featured: true
  },
  "australia": {
    name: "Australia",
    slug: "australia",
    flag: "🇦🇺",
    summary: "Australia combines world-class education with a high quality of life, generous post-study work rights, and a clear pathway to permanent residency for skilled graduates.",
    avgTuitionUsd: 30000,
    primaryLanguage: "English",
    popularIntakes: ["Semester 1 (Feb)", "Semester 2 (Jul)"],
    visaTypes: ["Subclass 500 Student Visa", "Graduate Visa (Subclass 485)"],
    workRights: "48 hrs/fortnight during term; unlimited during breaks",
    postStudyWork: "Graduate Visa: 2-4 years (by qualification level and location)",
    costOfLivingUsd: 20000,
    topUniversities: ["Melbourne", "Sydney", "ANU", "UNSW", "Monash", "UQ", "UWA", "Adelaide", "UTS", "Macquarie"],
    scholarships: ["Australia Awards", "Destination Australia", "University-specific scholarships", "Research Training Program (RTP)"],
    featured: true
  },
  "germany": {
    name: "Germany",
    slug: "germany",
    flag: "🇩🇪",
    summary: "Germany offers tuition-free education at public universities for international students, world-class engineering programs, and an 18-month job-seeker visa after graduation.",
    avgTuitionUsd: 0,
    primaryLanguage: "German / English (many master's programs)",
    popularIntakes: ["Winter Semester (Oct)", "Summer Semester (Apr)"],
    visaTypes: ["Student Visa", "Language Course Visa", "Job Seeker Visa (post-study)"],
    workRights: "120 full days / 240 half days per year",
    postStudyWork: "18-month Job Seeker Visa; EU Blue Card pathway",
    costOfLivingUsd: 12000,
    topUniversities: ["TU Munich", "LMU Munich", "Heidelberg", "RWTH Aachen", "KIT", "Humboldt Berlin", "Freiburg", "Tübingen", "Bonn", "Göttingen"],
    scholarships: ["DAAD Scholarships", "Deutschlandstipendium", "Erasmus+", "University-specific scholarships", "Heinrich Böll Foundation"],
    featured: true
  },
  "ireland": {
    name: "Ireland",
    slug: "ireland",
    flag: "🇮🇪",
    summary: "Ireland is Europe's tech hub with a 2-year post-study work visa, English-speaking environment, and home to European HQs of Google, Meta, Apple, and Microsoft.",
    avgTuitionUsd: 18000,
    primaryLanguage: "English",
    popularIntakes: ["September", "January"],
    visaTypes: ["Stamp 2 Student Visa", "Third Level Graduate Scheme"],
    workRights: "20 hrs/week during term; 40 hrs/week during holidays",
    postStudyWork: "Third Level Graduate Scheme: 2 years (Level 9/10 awards)",
    costOfLivingUsd: 15000,
    topUniversities: ["Trinity College Dublin", "UCD", "UCC", "NUIG", "DCU", "UL", "Maynooth", "TU Dublin"],
    scholarships: ["Government of Ireland Scholarship", "Walsh Fellowships", "University-specific awards", "Claddagh Scholarship"],
    featured: true
  },
  "singapore": {
    name: "Singapore",
    slug: "singapore",
    flag: "🇸🇬",
    summary: "Singapore offers world-class education in Asia's financial and tech hub, with generous scholarships, a safe environment, and strong industry connections.",
    avgTuitionUsd: 25000,
    primaryLanguage: "English",
    popularIntakes: ["August", "January"],
    visaTypes: ["Student's Pass", "Training Employment Pass"],
    workRights: "16 hrs/week during term; full-time during vacations",
    postStudyWork: "Long-Term Visit Pass for job search; Employment Pass for skilled roles",
    costOfLivingUsd: 18000,
    topUniversities: ["NUS", "NTU", "SMU", "SUTD", "SUSS"],
    scholarships: ["ASEAN Undergraduate Scholarship", "SIA Youth Scholarship", "NUS/NTU Research Scholarships", "ASEAN Graduate Scholarship"],
    featured: true
  },
  "netherlands": {
    name: "Netherlands",
    slug: "netherlands",
    flag: "🇳🇱",
    summary: "The Netherlands offers English-taught programs at research universities, a 1-year orientation year visa after graduation, and a highly international student community.",
    avgTuitionUsd: 15000,
    primaryLanguage: "English / Dutch",
    popularIntakes: ["September", "February"],
    visaTypes: ["Student Residence Permit", "Orientation Year Visa"],
    workRights: "16 hrs/week or full-time June-August",
    postStudyWork: "Orientation Year Visa (1 year) to find work",
    costOfLivingUsd: 14000,
    topUniversities: ["TU Delft", "University of Amsterdam", "Leiden", "Utrecht", "Erasmus Rotterdam", "Wageningen", "VU Amsterdam", "Twente", "Eindhoven", "Groningen"],
    scholarships: ["Holland Scholarship", "Erasmus Mundus", "University-specific talent grants", "Orange Tulip Scholarship"],
    featured: true
  },
  "france": {
    name: "France",
    slug: "france",
    flag: "🇫🇷",
    summary: "France combines world-class grandes écoles and public universities with affordable tuition, a rich cultural experience, and strong programs in business, engineering, fashion, and gastronomy.",
    avgTuitionUsd: 2850,
    primaryLanguage: "French / English (many master's programs)",
    popularIntakes: ["September", "January"],
    visaTypes: ["VLS-TS Student Visa", "Talent Passport (post-study)"],
    workRights: "964 hours/year (part-time)",
    postStudyWork: "APS (Temporary Residence Permit): 1 year non-renewable, extendable with Talent Passport",
    costOfLivingUsd: 12000,
    topUniversities: ["École Polytechnique", "Sorbonne University", "PSL University", "HEC Paris", "INSA Lyon", "Grenoble INP", "CentraleSupélec", "Sciences Po"],
    scholarships: ["Eiffel Excellence Scholarship", "Charpak Scholarship", "Erasmus+", "Region-specific grants", "University-specific awards"],
    featured: true
  },
  "new-zealand": {
    name: "New Zealand",
    slug: "new-zealand",
    flag: "🇳🇿",
    summary: "New Zealand offers world-class education with a focus on sustainability, Maori culture, and work-life balance. Generous 3-year post-study work visa and clear path to residency.",
    avgTuitionUsd: 32000,
    primaryLanguage: "English / Maori",
    popularIntakes: ["Semester 1 (Feb)", "Semester 2 (Jul)"],
    visaTypes: ["Student Visa", "Post-Study Work Visa (Open)"],
    workRights: "20 hrs/week during term; full-time during scheduled breaks",
    postStudyWork: "Post-Study Work Visa: 3 years open (any employer, any field)",
    costOfLivingUsd: 15000,
    topUniversities: ["University of Auckland", "University of Otago", "Victoria University of Wellington", "University of Canterbury", "Massey University", "AUT", "Lincoln University", "Waikato"],
    scholarships: ["NZIDRS (Doctoral)", "NZISRS (Research)", "University-specific Vice-Chancellor Scholarships", "Education New Zealand Scholarships", "Commonwealth Scholarships"],
    featured: true
  },
};

export const KB_COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
];

export function getCountryData(slug: string): CountryData | undefined {
  return COUNTRIES[slug];
}
