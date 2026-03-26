import ChatClient from './ChatClient';

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// Required for static export (output: 'export') — actual match IDs are
// runtime-generated and handled by client-side routing via Capacitor.
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuidLike(id)) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">找不到這個對話</p>
        <a href="/matches" className="btn-primary !w-auto !px-8 no-underline">返回配對列表</a>
      </div>
    );
  }
  return <ChatClient matchId={id} />;
}
