import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Table2Map",
  description: "团队 POI 地图",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
