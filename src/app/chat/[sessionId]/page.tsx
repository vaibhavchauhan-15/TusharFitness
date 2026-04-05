import { ChatPageContent } from "@/app/chat/chat-page-content";

export const dynamic = "force-dynamic";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <ChatPageContent sessionId={sessionId} />;
}
