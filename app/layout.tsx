import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BiteLog - Local Nutrition Tracker",
  description: "A local tool for food recognition, nutrition calculations, and meal tracking.",
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
