import ChatClient from './ChatClient';

// Required for static export (output: 'export') — actual match IDs are
// runtime-generated and handled by client-side routing via Capacitor.
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatClient matchId={id} />;
}
