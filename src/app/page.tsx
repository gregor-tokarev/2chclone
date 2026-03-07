import { getBoards } from "@/lib/api";
import Link from "next/link";
import type { Board } from "@/lib/types";
import { stripHtml } from "@/lib/utils";

export const revalidate = 60;

export default async function HomePage() {
  let boards: Board[] = [];
  let error: string | null = null;

  try {
    boards = await getBoards();
  } catch {
    error = "Failed to load boards. Please try again later.";
  }

  const formattedDate = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date());

  // Group boards by category
  const categories: Record<string, Board[]> = {};
  for (const board of boards) {
    const cat = board.category || "Other";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(board);
  }

  const sortedCategories = Object.entries(categories)
    .map(([category, categoryBoards]) => [
      category,
      [...categoryBoards].sort((a, b) => a.id.localeCompare(b.id)),
    ] as const)
    .sort(([left], [right]) => left.localeCompare(right));

  return (
    <div className="space-y-10">
      {/* Hero section */}
      <section className="relative overflow-hidden rounded-2xl border border-border-primary bg-bg-secondary p-8 sm:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
        {/* Decorative geometric grid pattern */}
        <svg
          className="absolute right-0 top-0 h-full w-1/2 opacity-[0.04] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="hero-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
        <div className="relative">
          <h1 className="font-display text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            dvач
          </h1>
          <p className="mt-3 max-w-lg text-lg text-text-secondary/80">
            Modern imageboard experience. Fast, clean, and beautiful.
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              {boards.length} boards online
            </span>
            <span className="text-border-primary">|</span>
            <span>Powered by 2ch API</span>
            <span className="text-border-primary">|</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {/* Board categories */}
      {sortedCategories.map(([category, categoryBoards]) => (
        <section key={category} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-text-primary">
              {category}
            </h2>
            <span className="rounded-full bg-bg-tertiary px-2.5 py-0.5 text-xs font-medium text-text-muted">
              {categoryBoards.length}
            </span>
            <div className="h-px flex-1 bg-border-primary" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryBoards.map((board, index) => (
              <div
                key={board.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
              >
                <Link
                  href={`/${board.id}`}
                  prefetch={true}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-border-primary bg-bg-card p-4 transition-all duration-200 hover:border-accent/30 hover:bg-bg-card-hover hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-lg bg-accent/10 px-2 py-1.5 font-display text-sm font-bold text-accent transition-transform group-hover:scale-105">
                        /{board.id}/
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary transition-colors group-hover:text-accent">
                          {board.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
                          {stripHtml(board.info_outer || board.info)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {board.enable_posting && (
                      <span className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                        POSTING
                      </span>
                    )}
                    {board.enable_likes && (
                      <span className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                        LIKES
                      </span>
                    )}
                    {board.enable_thread_tags && (
                      <span className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                        TAGS
                      </span>
                    )}
                    {board.enable_names && (
                      <span className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                        NAMES
                      </span>
                    )}
                    <span className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                      BL:{board.bump_limit}
                    </span>
                  </div>

                  {/* Hover accent line */}
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
