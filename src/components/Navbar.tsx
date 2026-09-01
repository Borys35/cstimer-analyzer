"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useMenu } from "@/components/MenuContext";

export function Navbar() {
  const { mobileOpen, setMobileOpen } = useMenu();

  return (
    <nav className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] text-sm bg-[var(--surface)] shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-1.5 rounded bg-[var(--surface-3)] hover:bg-[var(--surface-2)] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle sessions"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <Link href="/" className="font-bold hover:opacity-80">
          CubeTimer
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/" className="opacity-60 hover:opacity-100">
          Timer
        </Link>
        <Link href="/stats" className="opacity-60 hover:opacity-100">
          Stats
        </Link>
        <Link href="/settings" className="opacity-60 hover:opacity-100">
          Settings
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
