import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getConversation } from "@/lib/ai-chat.functions";
import { ChatWindow } from "@/components/ai/ChatWindow";

export const Route = createFileRoute("/_authenticated/assistant/$conversationId")({
  component: ConversationView,
});

function ConversationView() {
  const { conversationId } = Route.useParams();
  const load = useServerFn(getConversation);
  const { data, isLoading } = useQuery({
    queryKey: ["ai-conversation", conversationId],
    queryFn: () => load({ data: { id: conversationId } }),
  });

  if (isLoading || !data) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  const { conversation, messages } = data;
  return (
    <div className="h-full p-4">
      <div className="mb-3">
        <h2 className="text-sm font-medium text-ink">{conversation.title}</h2>
        <p className="text-xs text-muted-foreground capitalize">
          {conversation.context_type} context
        </p>
      </div>
      <ChatWindow
        conversationId={conversation.id}
        contextType={conversation.context_type}
        contextId={conversation.context_id}
        initialMessages={messages}
        placeholder="Type your question…"
      />
    </div>
  );
}
