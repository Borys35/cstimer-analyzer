import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { STORAGE_KEY, THEMES } from "@/lib/theme";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MenuProvider } from "@/components/MenuContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CubTimer",
  description: "Strict progress analysis for cstimer exports",
};

const noFlashScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(${JSON.stringify(
  THEMES,
)}.indexOf(t)<0){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        {process.env.VERCEL_GIT_COMMIT_SHA ? (
          <meta name="git-sha" content={process.env.VERCEL_GIT_COMMIT_SHA} />
        ) : null}
      </head>
      <body className="h-full flex flex-col antialiased">
        <MenuProvider>
          <ThemeProvider>
            <SessionProvider>
              <Navbar />
              <div className="flex-1 overflow-auto">
                {children}
              </div>
            </SessionProvider>
          </ThemeProvider>
        </MenuProvider>
        <Analytics />
      </body>
    </html>
  );
}
