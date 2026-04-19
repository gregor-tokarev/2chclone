"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface Shortcut {
  keys: string;
  description: string;
  scope?: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: "j", description: "Next thread / post", scope: "Navigation" },
  { keys: "k", description: "Previous thread / post", scope: "Navigation" },
  { keys: "Enter", description: "Open selected thread", scope: "Board" },
  { keys: "n", description: "Create new thread", scope: "Board" },
  { keys: "r", description: "Reply to selected post / open reply form", scope: "Thread" },
  { keys: "Esc", description: "Close dialog / deselect", scope: "Global" },
  { keys: "?", description: "Show this help", scope: "Global" },
  { keys: "⌘K / Ctrl+K", description: "Open command palette / search boards", scope: "Global" },
];

export default function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    },
    [open]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  const grouped = SHORTCUTS.reduce<Record<string, Shortcut[]>>((acc, s) => {
    const scope = s.scope || "Other";
    if (!acc[scope]) acc[scope] = [];
    acc[scope].push(s);
    return acc;
  }, {});

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border-primary bg-bg-card shadow-2xl shadow-black/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-primary/40 px-5 py-3.5 bg-bg-secondary/50">
          <h2 className="font-display text-sm font-bold text-text-primary tracking-wide">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="divide-y divide-border-primary/30 px-5 py-3">
          {Object.entries(grouped).map(([scope, shortcuts]) => (
            <div key={scope} className="py-3 first:pt-0 last:pb-0">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                {scope}
              </div>
              <div className="space-y-1.5">
                {shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">{s.description}</span>
                    <kbd className="ml-4 inline-flex items-center rounded-md border border-border-primary bg-bg-secondary px-2 py-0.5 font-mono text-xs font-semibold text-text-primary">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border-primary/40 px-5 py-2.5 text-center">
          <span className="text-[11px] text-text-muted">
            Press <kbd className="rounded border border-border-primary bg-bg-secondary px-1 py-0.5 font-mono text-[10px]">?</kbd> or <kbd className="rounded border border-border-primary bg-bg-secondary px-1 py-0.5 font-mono text-[10px]">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
