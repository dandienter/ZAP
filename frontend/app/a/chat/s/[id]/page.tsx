import SharedChatView from "@/components/SharedChatView";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function SharedChatPage({ params }: PageProps) {
  const resolved = await params;
  return <SharedChatView shareId={resolved.id} />;
}
