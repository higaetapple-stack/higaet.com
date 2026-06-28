import { createFileRoute } from "@tanstack/react-router";
import { DivisionDetailPage } from "@/components/site/DivisionDetailPage";

export const Route = createFileRoute("/academy/offline-training")({
  head: () => ({
    meta: [
      { title: "Offline AI Training — HIGAET Academy" },
      { name: "description", content: "Campus-based AI engineering bootcamps and intensive workshops with labs, instructors, and placement-oriented support." },
    ],
    links: [{ rel: "canonical", href: "https://higaet.com/academy/offline-training" }],
  }),
  component: OfflineTrainingPage,
});

function OfflineTrainingPage() {
  return (
    <DivisionDetailPage
      brand="academy"
      eyebrow="Offline training"
      title="Immersive AI training on campus."
      subtitle="Focused classroom and lab programs for learners who want daily structure, direct instructor access, and intensive hands-on practice."
      overviewTitle="A practical campus environment for deep skill building."
      overviewBody="Offline tracks combine instructor-led teaching, supervised labs, assessments, and career preparation in a high-accountability learning setting."
      points={[
        { title: "Instructor-led labs", body: "Daily guided practice with immediate support from trainers and mentors." },
        { title: "Bootcamp structure", body: "Condensed learning cycles designed for fast progress and strong discipline." },
        { title: "Peer collaboration", body: "Team exercises, reviews, and capstone work that mirrors engineering workflows." },
        { title: "Campus support", body: "Counselling, attendance tracking, and structured progress checkpoints." },
      ]}
      outcomes={[
        "Faster practical confidence through in-person repetition and review.",
        "Hands-on lab record suitable for portfolio development.",
        "Clear transition into certification or placement tracks.",
        "Improved interview readiness through regular coaching.",
      ]}
      ctaTitle="Join a campus-based AI training track."
      ctaBody="Speak with our admissions team about schedules, eligibility, and upcoming batches."
      primaryLabel="Talk to admissions"
      secondaryHref="/academy/placements"
      secondaryLabel="Placement support"
    />
  );
}