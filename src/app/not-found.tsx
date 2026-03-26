import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: 'rgba(255, 140, 107, 0.1)' }}>
        <span className="text-4xl">🔍</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">
        <span className="gradient-text">找不到這個頁面</span>
      </h1>
      <p className="text-text-secondary text-sm mb-6 max-w-xs">
        這個頁面可能已被移除或網址輸入錯誤
      </p>
      <Link href="/" className="btn-primary inline-block">
        🏠 回到首頁
      </Link>
    </div>
  );
}
