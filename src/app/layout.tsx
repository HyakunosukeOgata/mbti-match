import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { PWARegister } from "@/components/PWARegister";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConsentBanner } from "@/components/ConsentBanner";

export const viewport: Viewport = {
  themeColor: "#FF8C6B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://mochi-match.com'),
  title: "Mochi 默契 - AI 智慧配對交友 | 找到最有默契的另一半",
  description: "Mochi 默契 — AI 智慧個性分析配對交友平台。透過 AI 聊天深度了解你的個性，找到最適合你的另一半。台灣最有默契的交友 APP。",
  keywords: ["Mochi", "默契", "AI配對", "AI交友", "性格配對", "個性分析", "智慧配對", "台灣交友", "交友APP"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mochi 默契",
  },
  openGraph: {
    title: "Mochi 默契 - AI 智慧配對，找到對的人",
    description: "Mochi 默契 — 透過 AI 個性分析智慧配對，找到最有默契的另一半",
    type: "website",
    locale: "zh_TW",
    url: "https://mochi-match.com",
    siteName: "Mochi 默契",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mochi 默契 - AI 智慧配對交友",
    description: "透過 AI 個性分析智慧配對，找到最有默契的另一半",
  },
  alternates: {
    canonical: "https://mochi-match.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning style={{ colorScheme: 'light' }}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          <AppProvider>
            <div className="app-container">
              {children}
            </div>
            <PWARegister />
            <ConsentBanner />
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
