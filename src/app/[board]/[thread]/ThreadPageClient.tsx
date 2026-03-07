"use client";

import { useState, useCallback, useEffect, useRef, useMemo, type FormEvent } from "react";
import type { Post as PostType, Board } from "@/lib/types";
import { getPostsAfter } from "@/lib/api";
import PostCard from "@/components/PostCard";
import PostingForm, { type PostingFormHandle } from "@/components/PostingForm";
import ReportDialog from "@/components/ReportDialog";

interface ThreadPageClientProps {
  initialPosts: PostType[];
  boardInfo: Board | null;
  boardId: string;
  threadNum: number;
}

export default function ThreadPageClient({
  initialPosts,
  boardInfo,
  boardId,
  threadNum,
}: ThreadPageClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [reportNum, setReportNum] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newPostCount, setNewPostCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [jumpToPost, setJumpToPost] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<PostingFormHandle>(null);
  const initialPostCount = useMemo(() => initialPosts.length, [initialPosts]);

  // Auto-refresh for new posts
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(async () => {
      try {
        const lastNum = posts[posts.length - 1]?.num;
        if (!lastNum) return;
        const res = await getPostsAfter(boardId, threadNum, lastNum);
        if (res.posts && res.posts.length > 0) {
          // Filter out posts we already have
          const existingNums = new Set(posts.map((p) => p.num));
          const newPosts = res.posts.filter((p) => !existingNums.has(p.num));
          if (newPosts.length > 0) {
            setPosts((prev) => [...prev, ...newPosts]);
            setNewPostCount((c) => c + newPosts.length);
          }
        }
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, boardId, threadNum, posts]);

  // Scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleReply = useCallback((num: number) => {
    setReplyTo(num);
    // Scroll to posting form
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, []);

  const handlePostCreated = useCallback(() => {
    // Refresh thread
    setNewPostCount(0);
  }, []);

  const handleJumpToPost = useCallback((e: FormEvent) => {
    e.preventDefault();
    const num = jumpToPost.trim();
    if (!num) return;
    const el = document.getElementById('post-' + num);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setJumpToPost("");
  }, [jumpToPost]);

  // Keyboard shortcuts: j/k navigate posts, r focuses reply
  const [selectedPostIndex, setSelectedPostIndex] = useState(-1);
  const visiblePostIndicesRef = useRef<Set<number>>(new Set());
  const postObserverVersion = posts.length;
  const programmaticScrollLockRef = useRef(false);
  const programmaticScrollTimeoutRef = useRef<number | null>(null);
  const viewportSyncEnabledRef = useRef(true);

  // Track which posts are fully visible via IntersectionObserver
  useEffect(() => {
    void postObserverVersion;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.postIndex);
          if (isNaN(idx)) continue;
          if (entry.intersectionRatio >= 1) {
            visiblePostIndicesRef.current.add(idx);
          } else {
            visiblePostIndicesRef.current.delete(idx);
          }
        }
      },
      { threshold: 1 }
    );
    const elements = document.querySelectorAll("[data-post-index]");
    elements.forEach((el) => {
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [postObserverVersion]);

  const getFirstVisiblePostIndex = useCallback(() => {
    const visible = Array.from(visiblePostIndicesRef.current).sort((a, b) => a - b);
    return visible.length > 0 ? visible[0] : 0;
  }, []);

  const ensurePostInView = useCallback((index: number) => {
    const el = document.querySelector(`[data-post-index="${index}"]`);
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
        const next = getFirstVisiblePostIndex();
        setSelectedPostIndex((prev) => (prev === next ? prev : next));
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [getFirstVisiblePostIndex]);

  useEffect(() => {
    return () => {
      if (programmaticScrollTimeoutRef.current !== null) {
        window.clearTimeout(programmaticScrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === "j") {
        e.preventDefault();
        setSelectedPostIndex((prev) => {
          const next = prev === -1
            ? getFirstVisiblePostIndex()
            : Math.min(prev + 1, posts.length - 1);
          silenceViewportSync();
          ensurePostInView(next);
          return next;
        });
      } else if (e.key === "k") {
        e.preventDefault();
        setSelectedPostIndex((prev) => {
          const next = prev === -1
            ? getFirstVisiblePostIndex()
            : Math.max(prev - 1, 0);
          silenceViewportSync();
          ensurePostInView(next);
          return next;
        });
      } else if (e.key === "r") {
        e.preventDefault();
        if (selectedPostIndex >= 0 && posts[selectedPostIndex]) {
          setReplyTo(posts[selectedPostIndex].num);
        }
        formRef.current?.expand();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [posts, selectedPostIndex, getFirstVisiblePostIndex, ensurePostInView, silenceViewportSync]);

  const opPost = posts[0];
  const isClosedThread = opPost?.closed === 1;

  return (
    <div className="space-y-3">
      {/* Thread controls */}
      <div className="flex items-center gap-3 rounded-lg border border-border-primary bg-bg-card px-4 py-2">
        <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded border-border-primary accent-accent"
          />
          Auto-refresh
          {autoRefresh && (
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          )}
        </label>

        {newPostCount > 0 && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            +{newPostCount} new
          </span>
        )}

        <form onSubmit={handleJumpToPost} className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Post #"
            value={jumpToPost}
            onChange={(e) => setJumpToPost(e.target.value)}
            className="w-20 rounded border border-border-primary bg-bg-input px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-accent/10 px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
          >
            Go
          </button>
        </form>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-xs text-text-secondary hover:text-accent transition-colors"
        >
          Back to top
        </button>

        <button
          type="button"
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="ml-auto text-xs text-text-secondary hover:text-accent transition-colors"
        >
          Go to bottom
        </button>
      </div>

      {/* Posts */}
      <div className="space-y-2">
        {posts.map((post, idx) => (
          <div
            key={post.num}
            data-post-index={idx}
            className={`animate-fade-in rounded-lg transition-shadow duration-150 ${idx === 0 ? "border-l-4 border-l-accent rounded-l-sm" : ""} ${idx >= initialPostCount ? "border-l-2 border-l-accent/50 animate-new-post-highlight" : ""} ${selectedPostIndex === idx ? "ring-2 ring-accent/60 ring-offset-1 ring-offset-bg-primary" : ""}`}
            style={{ animationDelay: `${Math.min(idx * 20, 300)}ms` }}
          >
            <PostCard
              post={post}
              isOp={idx === 0}
              boardId={boardId}
              threadNum={threadNum}
              showLikes={boardInfo?.enable_likes}
              onReply={!isClosedThread ? handleReply : undefined}
              onReport={(num) => setReportNum(num)}
            />
          </div>
        ))}
      </div>

      {/* Posting form */}
      {boardInfo && !isClosedThread && (
        <div className="sticky bottom-0 z-30 pt-4 pb-2">
          <PostingForm
            ref={formRef}
            board={boardInfo}
            threadNum={threadNum}
            onPostCreated={handlePostCreated}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
          />
        </div>
      )}

      {/* Scroll to top button */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-20 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border-primary bg-bg-card text-text-secondary shadow-lg transition-all duration-300 hover:bg-bg-card-hover hover:text-accent ${showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
        aria-label="Scroll to top"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      <div ref={bottomRef} />

      {/* Report dialog */}
      {reportNum !== null && (
        <ReportDialog
          board={boardId}
          thread={threadNum}
          postNum={reportNum}
          onClose={() => setReportNum(null)}
        />
      )}
    </div>
  );
}
