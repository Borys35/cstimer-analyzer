import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "cstimer analyzer",
  description: "Strict progress analysis for cstimer exports",
};

const noFlashScript = `(function(){try{var t=localStorage.getItem("cta-theme");if(t!=="dark"&&t!=="light"&&t!=="sticker"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){}})()`;

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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
