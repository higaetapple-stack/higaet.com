import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/assistant/")({
  component: AssistantIndex,
});

function AssistantIndex() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <div className="flex justify-center">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="size-6 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-display font-semibold text-ink">HIGAET AI Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Ask about lessons, summarize community discussions, or get study and career guidance.
          Start a new chat from the sidebar.
        </p>
      </div>
    </div>
  );
}
