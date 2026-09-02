"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] text-sm bg-[var(--surface)] shrink-0">
      <div className="flex items-center gap-3">
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
