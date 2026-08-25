import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "cstimer analyzer",
  description: "Strict progress analysis for cstimer exports",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
