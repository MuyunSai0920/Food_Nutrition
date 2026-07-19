import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "食刻 · 本地营养记录",
  description: "本地图片识别、营养计算与饮食记录工具。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
