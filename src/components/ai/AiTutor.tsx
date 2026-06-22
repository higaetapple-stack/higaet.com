// Phase 7.1 — Lesson-grounded AI Tutor embed.
// Usage: <AiTutor lessonId={lesson.id} />

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getOrCreateLessonConversation,
  getConversation,
} from "@/lib/ai-chat.functions";
import { ChatWindow } from "./ChatWindow";
import { GraduationCap } from "lucide-react";

interface Props {
  lessonId: string;
  compact?: boolean;
}

export function AiTutor({ lessonId, compact = true }: Props) {
  const ensure = useServerFn(getOrCreateLessonConversation);
  const load = useServerFn(getConversation);

  const { data: conv, isLoading } = useQuery({
    queryKey: ["ai-tutor-conversation", lessonId],
    queryFn: () => ensure({ data: { lessonId } }),
  });

  const { data: full } = useQuery({
    queryKey: ["ai-conversation", conv?.id],
    enabled: !!conv?.id,
    queryFn: () => load({ data: { id: conv!.id } }),
  });

  if (isLoading || !conv) {
    return (
      <div className="border border-border rounded-lg p-4 text-sm text-muted-foreground">
        Loading tutor…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <GraduationCap className="size-4 text-primary" />
        AI Tutor
        <span className="text-xs text-muted-foreground font-normal">
          Grounded in this lesson + peer discussion
        </span>
      </div>
      <ChatWindow
        conversationId={conv.id}
        contextType="lesson"
        contextId={lessonId}
        initialMessages={full?.messages}
        placeholder="Ask about this lesson…"
        compact={compact}
      />
    </div>
  );
}
