"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { getBoardsClient } from "@/lib/api";
import type { Board } from "@/lib/types";
import { stripHtml } from "@/lib/utils";

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [boards, setBoards] = useState<Board[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const loadBoards = useCallback(async () => {
    if (loaded) return;
    try {
      const data = await getBoardsClient();
      setBoards(data);
      setLoaded(true);
    } catch {
      // ignore — will retry next open
    }
  }, [loaded]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
    if (isCmdK) {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      void loadBoards();
      setQuery("");
      setActiveIndex(0);
      // focus after portal mounts
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, loadBoards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return boards.slice(0, 50);
    const scored = boards
      .map((b) => {
        const id = b.id.toLowerCase();
        const name = b.name.toLowerCase();
        const category = (b.category || "").toLowerCase();
        let score = 0;
        if (id === q) score = 1000;
        else if (id.startsWith(q)) score = 500;
        else if (id.includes(q)) score = 300;
        if (name.startsWith(q)) score = Math.max(score, 200);
        else if (name.includes(q)) score = Math.max(score, 100);
        if (category.includes(q)) score = Math.max(score, 50);
        return { board: b, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map((x) => x.board);
    return scored;
  }, [boards, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const close = () => setOpen(false);

  const selectBoard = useCallback(
    (board: Board) => {
      setOpen(false);
      router.push(`/${board.id}`);
    },
    [router]
  );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[activeIndex];
      if (target) selectBoard(target);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm animate-fade-in pt-[10vh]"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl mx-4 rounded-xl border border-border-primary bg-bg-card shadow-2xl shadow-black/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border-primary/40 px-4 py-3 bg-bg-secondary/50">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search boards..."
            className="flex-1 bg-transparent text-base text-text-primary placeholder:text-text-muted outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="rounded border border-border-primary/60 bg-bg-secondary/80 px-1.5 py-0.5 font-mono text-xs text-text-muted">
            Esc
          </kbd>
        </div>

        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto py-2"
          data-testid="command-palette-list"
        >
          {!loaded && (
            <div className="px-4 py-6 text-center text-sm text-text-muted">
              Loading boards...
            </div>
          )}
          {loaded && filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-text-muted">
              No boards match &quot;{query}&quot;
            </div>
          )}
          {filtered.map((board, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={board.id}
                data-index={i}
                type="button"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => selectBoard(board)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-accent/10 text-text-primary"
                    : "text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                <span
                  className={`flex shrink-0 items-center justify-center rounded-md px-2 py-1 font-display text-sm ${
                    active
                      ? "bg-accent/20 text-accent"
                      : "bg-bg-tertiary text-text-muted"
                  }`}
                >
                  /{board.id}/
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-normal text-text-primary">
                    {board.name}
                  </span>
                  <span className="block truncate text-xs text-text-muted">
                    {board.category}
                    {board.info_outer || board.info
                      ? ` • ${stripHtml(board.info_outer || board.info)}`
                      : ""}
                  </span>
                </span>
                {active && (
                  <kbd className="ml-2 hidden items-center rounded border border-border-primary bg-bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline-flex">
                    ↵
                  </kbd>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border-primary/40 px-4 py-2 bg-bg-secondary/30 text-[11px] text-text-muted">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border-primary bg-bg-secondary px-1 py-0.5 font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="rounded border border-border-primary bg-bg-secondary px-1 py-0.5 font-mono text-[10px]">
                ↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border-primary bg-bg-secondary px-1 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>
              open
            </span>
          </span>
          <span>{filtered.length} boards</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
