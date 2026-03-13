import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { PWARegister } from "@/components/PWARegister";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConsentBanner } from "@/components/ConsentBanner";

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Mochi 默契 - 用MBTI性格找到對的人 | 免費MBTI配對交友",
  description: "Mochi 默契 — 基於 MBTI 人格特質的智慧配對交友平台。透過16型人格測試與情境題，找到最適合你的另一半。台灣最有默契的性格交友 APP。",
  keywords: ["Mochi", "默契", "MBTI配對", "MBTI交友", "性格配對", "人格測試", "16型人格", "INFP配對", "ENFJ交友", "台灣交友"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mochi 默契",
  },
  openGraph: {
    title: "Mochi 默契 - 用性格找到對的人",
    description: "Mochi 默契 — 透過MBTI人格特質智慧配對，找到最有默契的另一半",
    type: "website",
    locale: "zh_TW",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
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
