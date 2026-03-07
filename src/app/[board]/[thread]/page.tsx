import { getThread, getBoards } from "@/lib/api";
import Link from "next/link";
import type { Post, Board } from "@/lib/types";
import ThreadPageClient from "./ThreadPageClient";

export const revalidate = 15;

export async function generateMetadata({ params }: { params: Promise<{ board: string; thread: string }> }) {
  const { board, thread } = await params;
  return {
    title: `Thread #${thread} - /${board}/ - dvач`,
  };
}

export default async function ThreadPage({ params }: { params: Promise<{ board: string; thread: string }> }) {
  const { board: boardId, thread: threadId } = await params;
  const threadNum = parseInt(threadId, 10);

  let posts: Post[] = [];
  let boardInfo: Board | null = null;
  let uniquePosters: number | undefined;
  let error: string | null = null;

  try {
    const [threadData, boardsData] = await Promise.all([
      getThread(boardId, threadNum),
      getBoards(),
    ]);
    posts = threadData.threads?.[0]?.posts || [];
    uniquePosters = threadData.unique_posters;
    boardInfo = boardsData.find((b) => b.id === boardId) || null;
  } catch {
    error = "Failed to load thread.";
  }

  if (error || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 font-display text-6xl font-bold text-text-muted">404</div>
        <p className="text-lg text-text-secondary">{error || "Thread not found"}</p>
        <Link href={`/${boardId}`} className="mt-4 text-sm text-accent hover:underline">
          Back to /{boardId}/
        </Link>
      </div>
    );
  }

  const opPost = posts[0];

  return (
    <div className="space-y-4">
      {/* Thread header */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-primary bg-bg-secondary p-4">
        <Link
          href={`/${boardId}`}
          className="flex items-center gap-1.5 rounded-lg bg-bg-tertiary px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          /{boardId}/
        </Link>

        <h1 className="font-display text-xl font-bold text-text-primary break-words">
          {opPost.subject || `Thread #${threadNum}`}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span>{posts.length} posts</span>
          {uniquePosters && <span>{uniquePosters} unique posters</span>}
          {opPost.closed === 1 && (
            <span className="rounded bg-closed-badge/20 px-1.5 py-0.5 font-bold text-closed-badge">
              CLOSED
            </span>
          )}
          {opPost.sticky === 1 && (
            <span className="rounded bg-sticky-badge/20 px-1.5 py-0.5 font-bold text-sticky-badge">
              PINNED
            </span>
          )}
        </div>
      </div>

      <ThreadPageClient
        initialPosts={posts}
        boardInfo={boardInfo}
        boardId={boardId}
        threadNum={threadNum}
      />
    </div>
  );
}
