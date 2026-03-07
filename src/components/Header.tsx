"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);

  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border-primary bg-bg-primary/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-all"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-display text-base font-normal text-bg-primary transition-transform group-hover:scale-105">
              2
            </div>
            <span className="font-display text-xl font-normal tracking-tight text-text-primary">
              dvач
            </span>
          </Link>

          {!isHome && (
            <nav className="ml-4 hidden items-center gap-1 sm:flex">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-base font-normal text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              >
                Boards
              </Link>
              {pathname.split("/").filter(Boolean).map((segment, i, arr) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-text-muted">/</span>
                  <Link
                    href={`/${arr.slice(0, i + 1).join("/")}`}
                    className="rounded-md px-2 py-1.5 text-base font-normal text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                  >
                    {segment}
                  </Link>
                </span>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", shiftKey: true }))}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            title="Keyboard shortcuts"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
            </svg>
            <kbd className="rounded border border-border-primary/60 bg-bg-secondary/80 px-1.5 py-0.5 font-mono text-xs text-text-muted">?</kbd>
          </button>
          <Link
            href="/settings"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            title="Settings"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
