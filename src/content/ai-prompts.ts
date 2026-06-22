// Phase 10B — Starter prompt library for HIGAET AI Hub.
// Each entry is launchable into /ai/chat with ?prompt=<id>.

export interface AiStarterPrompt {
  id: string;
  title: string;
  category: "Career" | "Academy" | "Global Ed" | "Visa" | "Interview" | "Resume" | "Scholarship";
  description: string;
  prompt: string;
  emoji: string;
}

export const AI_STARTER_PROMPTS: AiStarterPrompt[] = [
  {
    id: "career-roadmap",
    title: "Career Roadmap Generator",
    category: "Career",
    emoji: "🧭",
    description: "Build a 6–12 month roadmap from your current skills to a target role.",
    prompt:
      "Act as a senior career coach. Ask me about my current skills, experience, and target role. Then generate a 6–12 month roadmap with monthly milestones, skill targets, project ideas, and recommended HIGAET Academy programs.",
  },
  {
    id: "learning-path",
    title: "Learning Path Planner",
    category: "Academy",
    emoji: "📚",
    description: "Sequence courses and milestones toward a specific outcome.",
    prompt:
      "I want a structured learning path. Ask me my goal (role, domain, or topic) and current level, then propose a sequenced learning plan with HIGAET Academy courses, prerequisites, weekly study load, and capstone project.",
  },
  {
    id: "university-shortlist",
    title: "University Shortlisting",
    category: "Global Ed",
    emoji: "🎓",
    description: "Shortlist universities based on profile, budget, and intent.",
    prompt:
      "Help me shortlist universities. Ask for my country preference, intended program, budget, GPA, test scores, work experience, and constraints. Then recommend 8–12 universities split into reach / target / safe with rationale.",
  },
  {
    id: "visa-checklist",
    title: "Visa Checklist Builder",
    category: "Visa",
    emoji: "🛂",
    description: "Produce a country-specific student visa checklist.",
    prompt:
      "Build me a student-visa checklist. Ask for destination country, program type, intake, and nationality. Output documents, financial proofs, timelines, common rejection reasons, and HIGAET visa support next steps.",
  },
  {
    id: "interview-prep",
    title: "Interview Preparation",
    category: "Interview",
    emoji: "🎤",
    description: "Mock interview with structured feedback.",
    prompt:
      "Run a mock interview with me. Ask the role, company type, and round (HR / technical / behavioural / case). Then ask one question at a time, score my answer on STAR/CARL, and improve it.",
  },
  {
    id: "resume-review",
    title: "Resume Review",
    category: "Resume",
    emoji: "📝",
    description: "Critique my resume for a specific target role.",
    prompt:
      "Review my resume. I'll paste it below. Score it 1–10 on impact, clarity, keywords, ATS friendliness, and role-fit. Then rewrite the weakest 3 bullets and suggest a stronger summary.",
  },
  {
    id: "scholarship-finder",
    title: "Scholarship Finder",
    category: "Scholarship",
    emoji: "💰",
    description: "Discover scholarships matching your profile.",
    prompt:
      "Find scholarships I might qualify for. Ask my nationality, target country, degree level, field, GPA, financial need, and any diversity criteria. Then list 10+ scholarships with eligibility, amount, deadlines, and how to apply through HIGAET.",
  },
];

export function getStarterPrompt(id: string): AiStarterPrompt | undefined {
  return AI_STARTER_PROMPTS.find((p) => p.id === id);
}
