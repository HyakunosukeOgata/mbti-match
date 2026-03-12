import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "MBTI Match - 用性格找到對的人",
  description: "基於 MBTI 人格特質的交友配對 APP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AppProvider>
          <div className="app-container">
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
