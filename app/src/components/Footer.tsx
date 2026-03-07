import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-border-primary bg-bg-secondary/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span className="font-display font-semibold text-text-secondary">dvач</span>
          <span className="text-border-primary">|</span>
          <span>API powered by 2ch.hk</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <Link
            href="/settings"
            className="transition-colors hover:text-text-secondary"
          >
            Settings
          </Link>
          <span className="text-border-primary">|</span>
          <Link
            href="/"
            className="transition-colors hover:text-text-secondary"
          >
            Boards
          </Link>
        </div>
      </div>
    </footer>
  );
}
