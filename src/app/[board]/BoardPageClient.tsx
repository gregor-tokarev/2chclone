"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Board, CatalogThread } from "@/lib/types";
import { getThumbnailUrl } from "@/lib/api";
import { stripHtml, truncate, formatTimestamp, formatFileSize } from "@/lib/utils";
import PostingForm, { type PostingFormHandle } from "@/components/PostingForm";

interface BoardPageClientProps {
  boardInfo: Board;
  initialThreads: CatalogThread[];
  boardId: string;
}

type ViewMode = "feed" | "grid";
type SortMode = "bump" | "date" | "replies" | "views";

export default function BoardPageClient({ boardInfo, initialThreads, boardId }: BoardPageClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [sortMode, setSortMode] = useState<SortMode>("bump");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const formRef = useRef<PostingFormHandle>(null);
  const visibleIndicesRef = useRef<Set<number>>(new Set());
  const programmaticScrollLockRef = useRef(false);
  const programmaticScrollTimeoutRef = useRef<number | null>(null);
  const viewportSyncEnabledRef = useRef(true);

  const sortedThreads = useMemo(() => {
    let filtered = initialThreads;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.subject && t.subject.toLowerCase().includes(q)) ||
          stripHtml(t.comment).toLowerCase().includes(q)
      );
    }

    return [...filtered].sort((a, b) => {
      switch (sortMode) {
        case "date":
          return b.timestamp - a.timestamp;
        case "replies":
          return (b.posts_count || 0) - (a.posts_count || 0);
        case "views":
          return (b.views || 0) - (a.views || 0);
        case "bump":
        default:
          return b.lasthit - a.lasthit;
      }
    });
  }, [initialThreads, sortMode, searchQuery]);
  const observerVersion = `${viewMode}:${sortedThreads.length}`;

  // Track which threads are fully visible via IntersectionObserver
  useEffect(() => {
    void observerVersion;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.threadIndex);
          if (isNaN(idx)) continue;
          if (entry.intersectionRatio >= 1) {
            visibleIndicesRef.current.add(idx);
          } else {
            visibleIndicesRef.current.delete(idx);
          }
        }
      },
      { threshold: 1 }
    );
    const elements = document.querySelectorAll("[data-thread-index]");
    elements.forEach((el) => {
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [observerVersion]);

  const getFirstVisibleIndex = useCallback(() => {
    const visible = Array.from(visibleIndicesRef.current).sort((a, b) => a - b);
    return visible.length > 0 ? visible[0] : 0;
  }, []);

  const ensureThreadInView = useCallback((index: number) => {
    const el = document.querySelector(`[data-thread-index="${index}"]`);
    if (!(el instanceof HTMLElement)) return;

    const rect = el.getBoundingClientRect();
    const isAboveViewport = rect.top < 0;
    const isBelowViewport = rect.bottom > window.innerHeight;

    if (isAboveViewport || isBelowViewport) {
      if (programmaticScrollTimeoutRef.current !== null) {
        window.clearTimeout(programmaticScrollTimeoutRef.current);
      }
      programmaticScrollLockRef.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      programmaticScrollTimeoutRef.current = window.setTimeout(() => {
        programmaticScrollLockRef.current = false;
        programmaticScrollTimeoutRef.current = null;
      }, 250);
    }
  }, []);

  const silenceViewportSync = useCallback(() => {
    viewportSyncEnabledRef.current = false;
  }, []);

  useEffect(() => {
    const resumeViewportSync = () => {
      viewportSyncEnabledRef.current = true;
    };

    window.addEventListener("wheel", resumeViewportSync, { passive: true });
    window.addEventListener("touchmove", resumeViewportSync, { passive: true });
    window.addEventListener("mousedown", resumeViewportSync);

    return () => {
      window.removeEventListener("wheel", resumeViewportSync);
      window.removeEventListener("touchmove", resumeViewportSync);
      window.removeEventListener("mousedown", resumeViewportSync);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (programmaticScrollLockRef.current || !viewportSyncEnabledRef.current) return;
      window.requestAnimationFrame(() => {
        const next = getFirstVisibleIndex();
        setSelectedIndex((prev) => (prev === next ? prev : next));
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [getFirstVisibleIndex]);

  useEffect(() => {
    return () => {
      if (programmaticScrollTimeoutRef.current !== null) {
        window.clearTimeout(programmaticScrollTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts: j/k to navigate threads, Enter to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === "j") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev === -1
            ? getFirstVisibleIndex()
            : Math.min(prev + 1, sortedThreads.length - 1);
          silenceViewportSync();
          ensureThreadInView(next);
          return next;
        });
      } else if (e.key === "k") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev === -1
            ? getFirstVisibleIndex()
            : Math.max(prev - 1, 0);
          silenceViewportSync();
          ensureThreadInView(next);
          return next;
        });
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const thread = sortedThreads[selectedIndex];
        if (thread) router.push(`/${boardId}/${thread.num}`);
      } else if (e.key === "n") {
        e.preventDefault();
        formRef.current?.expand();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sortedThreads, selectedIndex, boardId, router, getFirstVisibleIndex, ensureThreadInView, silenceViewportSync]);

  return (
    <div className="space-y-6">
      {/* Posting form */}
      {boardInfo.enable_posting && (
        <PostingForm ref={formRef} board={boardInfo} />
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            className="w-full rounded-lg border border-border-primary bg-bg-input pl-10 pr-3 py-2 text-base text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border-primary bg-bg-card p-0.5">
          {(["bump", "date", "replies", "views"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setSortMode(mode);
                setSelectedIndex(-1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-normal transition-all ${
                sortMode === mode
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border-primary bg-bg-card p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("feed")}
            className={`rounded-md p-1.5 transition-all ${
              viewMode === "feed" ? "bg-accent/10 text-accent" : "text-text-secondary hover:text-text-primary"
            }`}
            title="Feed view"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="7" rx="1" />
              <rect x="3" y="14" width="18" height="7" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-1.5 transition-all ${
              viewMode === "grid" ? "bg-accent/10 text-accent" : "text-text-secondary hover:text-text-primary"
            }`}
            title="Grid view"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Thread count + shortcut hints */}
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>
          {sortedThreads.length} threads
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
        <span className="hidden items-center gap-2 sm:flex">
          <kbd className="rounded border border-border-primary/60 bg-bg-secondary/80 px-1.5 py-0.5 font-mono text-xs text-text-muted">J</kbd>
          <kbd className="rounded border border-border-primary/60 bg-bg-secondary/80 px-1.5 py-0.5 font-mono text-xs text-text-muted">K</kbd>
          <span className="text-text-muted">navigate</span>
          <kbd className="rounded border border-border-primary/60 bg-bg-secondary/80 px-1.5 py-0.5 font-mono text-xs text-text-muted">Enter</kbd>
          <span className="text-text-muted">open</span>
        </span>
      </div>

      {/* Thread views */}
      {viewMode === "feed" ? (
        <div className="space-y-4">
          {sortedThreads.map((thread, idx) => (
            <div
              key={thread.num}
              data-thread-index={idx}
              className={`animate-fade-in rounded-xl transition-shadow duration-150 ${selectedIndex === idx ? "ring-2 ring-accent/60 ring-offset-1 ring-offset-bg-primary" : ""}`}
              style={{ animationDelay: `${Math.min(idx * 30, 400)}ms`, opacity: 0 }}
            >
              <ThreadFeedCard thread={thread} boardId={boardId} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sortedThreads.map((thread, idx) => (
            <div
              key={thread.num}
              data-thread-index={idx}
              className={`animate-fade-in rounded-xl transition-shadow duration-150 ${selectedIndex === idx ? "ring-2 ring-accent/60 ring-offset-1 ring-offset-bg-primary" : ""}`}
              style={{ animationDelay: `${Math.min(idx * 30, 500)}ms`, opacity: 0 }}
            >
              <ThreadGridCard thread={thread} boardId={boardId} />
            </div>
          ))}
        </div>
      )}

      {sortedThreads.length === 0 && (
        <div className="py-20 text-center text-text-muted">
          {searchQuery ? "No threads match your search." : "No threads on this board."}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feed view – large rows, images on top, text below (like 2ch.hk)  */
/* ------------------------------------------------------------------ */
function ThreadFeedCard({ thread, boardId }: { thread: CatalogThread; boardId: string }) {
  const files = thread.files || [];
  const commentText = truncate(stripHtml(thread.comment), 500);

  return (
    <Link
      href={`/${boardId}/${thread.num}`}
      prefetch={true}
      className="group relative block overflow-hidden rounded-xl border border-border-primary bg-bg-card transition-all duration-200 hover:border-accent/30 hover:bg-bg-card-hover hover:shadow-lg hover:shadow-accent/5"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-primary/40 px-4 py-2.5 bg-bg-secondary/50">
        <span className="font-mono text-sm font-normal text-accent">#{thread.num}</span>

        {thread.subject && (
          <span className="font-display text-base font-normal text-text-primary">
            {thread.subject}
          </span>
        )}

        {thread.sticky === 1 && (
          <span className="rounded bg-sticky-badge/20 px-1.5 py-0.5 text-sm font-normal text-sticky-badge">
            PIN
          </span>
        )}
        {thread.closed === 1 && (
          <span className="rounded bg-closed-badge/20 px-1.5 py-0.5 text-sm font-normal text-closed-badge">
            CLOSED
          </span>
        )}

        <div className="ml-auto flex items-center gap-3 text-sm text-text-muted">
          <span>{thread.posts_count || 0} posts</span>
          <span>{thread.files_count || 0} files</span>
          {thread.views > 0 && <span>{thread.views.toLocaleString()} views</span>}
          <span>{formatTimestamp(thread.lasthit)}</span>
        </div>
      </div>

      {/* Images row – all file thumbnails displayed horizontally */}
      {files.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto px-4 py-3 bg-bg-primary/30">
          {files.map((file) => {
            const isVideo = file.type === 6 || file.type === 10;
            return (
              <div key={file.path} className="relative flex-shrink-0">
                <div className="overflow-hidden rounded-lg border border-border-primary/30">
                  <img
                    src={getThumbnailUrl(file.thumbnail)}
                    alt={file.displayname}
                    width={file.tn_width}
                    height={file.tn_height}
                    className="h-[180px] w-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                {/* Video duration badge */}
                {isVideo && file.duration && (
                  <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-xs text-white">
                    {file.duration}
                  </span>
                )}
                {/* File info */}
                <div className="mt-0.5 text-xs text-text-muted truncate max-w-[140px]">
                  {formatFileSize(file.size)} · {file.width}x{file.height}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comment text */}
      <div className="px-4 py-3">
        <p className="text-base leading-relaxed text-text-secondary line-clamp-4">
          {commentText}
        </p>
      </div>

      {/* Bottom accent line on hover */}
      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

/* ---------------------------------------- */
/*  Grid view – compact thumbnail cards     */
/* ---------------------------------------- */
function ThreadGridCard({ thread, boardId }: { thread: CatalogThread; boardId: string }) {
  const thumbnail = thread.files?.[0]?.thumbnail;
  const commentText = truncate(stripHtml(thread.comment), 120);

  return (
    <Link
      href={`/${boardId}/${thread.num}`}
      prefetch={true}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border-primary bg-bg-card transition-all duration-200 hover:border-accent/30 hover:bg-bg-card-hover hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-secondary">
        {thumbnail ? (
          <img
            src={getThumbnailUrl(thumbnail)}
            alt={thread.subject || "Thread thumbnail"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-text-muted/20 font-display font-normal">
            /{boardId}/
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute left-1.5 top-1.5 flex gap-1">
          {thread.sticky === 1 && (
            <span className="rounded bg-sticky-badge/90 px-1 py-0.5 text-xs font-normal text-white backdrop-blur-sm">
              PIN
            </span>
          )}
          {thread.closed === 1 && (
            <span className="rounded bg-closed-badge/90 px-1 py-0.5 text-xs font-normal text-white backdrop-blur-sm">
              CLOSED
            </span>
          )}
        </div>

        {/* Stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <span>{thread.posts_count || 0} posts</span>
            <span>{thread.files_count || 0} files</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-2">
        {thread.subject && (
          <h3 className="mb-0.5 text-sm font-normal text-text-primary line-clamp-1">
            {thread.subject}
          </h3>
        )}
        <p className="text-xs leading-snug text-text-secondary line-clamp-2">
          {commentText}
        </p>
        <div className="mt-1 text-xs text-text-muted">
          {formatTimestamp(thread.lasthit)}
        </div>
      </div>

      {/* Hover line */}
      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}
