import { getCatalog, getBoards } from "@/lib/api";
import Link from "next/link";
import type { Board, CatalogThread } from "@/lib/types";
import { stripHtml, truncate, formatTimestamp } from "@/lib/utils";
import BoardPageClient from "./BoardPageClient";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ board: string }> }) {
  const { board } = await params;
  return {
    title: `/${board}/ - dvач`,
  };
}

export default async function BoardPage({ params }: { params: Promise<{ board: string }> }) {
  const { board: boardId } = await params;
  let threads: CatalogThread[] = [];
  let boardInfo: Board | null = null;
  let error: string | null = null;

  try {
    const [catalogData, boardsData] = await Promise.all([
      getCatalog(boardId),
      getBoards(),
    ]);
    threads = catalogData.threads || [];
    boardInfo = boardsData.find((b) => b.id === boardId) || null;
  } catch (e) {
    error = "Failed to load board. It may not exist or be temporarily unavailable.";
  }

  if (error || !boardInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 font-display text-6xl font-normal text-text-muted">404</div>
        <p className="text-xl text-text-secondary">{error || "Board not found"}</p>
        <Link href="/" className="mt-4 text-base text-accent hover:underline">
          Back to boards
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Board header */}
      <section className="relative overflow-hidden rounded-2xl border border-border-primary bg-bg-secondary p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 font-display text-xl font-normal text-accent">
            /{boardId}/
          </div>
          <div>
            <h1 className="font-display text-3xl font-normal text-text-primary">
              {boardInfo.name}
            </h1>
            <p className="mt-1 text-base text-text-secondary">{boardInfo.info_outer || boardInfo.info}</p>
            {boardInfo.info && (
              <p className="mt-1 text-sm text-text-muted line-clamp-2">
                {stripHtml(boardInfo.info)}
              </p>
            )}
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          {boardInfo.enable_names && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-sm font-normal text-accent">Names</span>
          )}
          {boardInfo.enable_sage && (
            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-sm font-normal text-danger">Sage</span>
          )}
          {boardInfo.enable_trips && (
            <span className="rounded-full bg-info/10 px-2 py-0.5 text-sm font-normal text-info">Trips</span>
          )}
          {boardInfo.enable_flags && (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-sm font-normal text-success">Flags</span>
          )}
          {boardInfo.enable_icons && (
            <span className="rounded-full bg-sticky-badge/10 px-2 py-0.5 text-sm font-normal text-sticky-badge">Icons</span>
          )}
          {boardInfo.enable_likes && (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-sm font-normal text-success">Likes</span>
          )}
          {boardInfo.enable_shield && (
            <span className="rounded-full bg-info/10 px-2 py-0.5 text-sm font-normal text-info">Shield</span>
          )}
          {boardInfo.enable_oekaki && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-sm font-normal text-accent">Oekaki</span>
          )}
          {boardInfo.enable_thread_tags && (
            <span className="rounded-full bg-sticky-badge/10 px-2 py-0.5 text-sm font-normal text-sticky-badge">Tags</span>
          )}
          {boardInfo.enable_dices && (
            <span className="rounded-full bg-info/10 px-2 py-0.5 text-sm font-normal text-info">Dice</span>
          )}
        </div>

        <div className="relative mt-3 flex flex-wrap gap-3 text-sm text-text-muted">
          <span>Bump limit: {boardInfo.bump_limit}</span>
          <span className="text-border-primary">|</span>
          <span>Pages: {boardInfo.max_pages}</span>
          <span className="text-border-primary">|</span>
          <span>Files: {boardInfo.file_types.join(", ")}</span>
          <span className="text-border-primary">|</span>
          <span>{threads.length} threads</span>
        </div>
      </section>

      <BoardPageClient boardInfo={boardInfo} initialThreads={threads} boardId={boardId} />
    </div>
  );
}
