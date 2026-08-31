import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { STORAGE_KEY, THEMES } from "@/lib/theme";
import { SessionProvider } from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "cstimer analyzer",
  description: "Strict progress analysis for cstimer exports",
};

const noFlashScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(${JSON.stringify(
  THEMES,
)}.indexOf(t)<0){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        {process.env.VERCEL_GIT_COMMIT_SHA ? (
          <meta name="git-sha" content={process.env.VERCEL_GIT_COMMIT_SHA} />
        ) : null}
      </head>
      <body className="min-h-screen antialiased">
        <SessionProvider>
          <nav className="flex items-center gap-4 px-4 py-2 border-b border-base text-sm bg-surface">
            <Link href="/" className="font-bold hover:opacity-80">
              Timer
            </Link>
            <Link href="/stats" className="opacity-60 hover:opacity-100">
              Stats
            </Link>
            <Link href="/settings" className="opacity-60 hover:opacity-100">
              Settings
            </Link>
          </nav>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
