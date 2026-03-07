"use client";

import { useState } from "react";
import { loginPasscode } from "@/lib/api";
import Link from "next/link";

export default function SettingsPage() {
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await loginPasscode(passcode);
      if (res.result === 1) {
        setResult(
          `Passcode activated! Type: ${res.passcode?.type}, Expires: ${
            res.passcode?.expires
              ? new Date(res.passcode.expires * 1000).toLocaleDateString()
              : "N/A"
          }`
        );
      } else {
        setError(res.error?.message || "Invalid passcode");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg bg-bg-secondary px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Link>
        <h1 className="font-display text-2xl font-bold text-text-primary">Settings</h1>
      </div>

      {/* Passcode authentication */}
      <section className="rounded-xl border border-border-primary bg-bg-card overflow-hidden">
        <div className="border-b border-border-primary/40 px-5 py-3">
          <h2 className="font-display text-sm font-semibold text-text-primary">
            Passcode Authentication
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Enter your passcode to skip captcha when posting.
          </p>
        </div>

        <form onSubmit={handlePasscodeLogin} className="p-5 space-y-4">
          <div>
            <label htmlFor="passcode-input" className="block text-xs font-medium text-text-secondary mb-1.5">
              Passcode
            </label>
            <input
              id="passcode-input"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter your passcode..."
              className="w-full rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
          )}
          {result && (
            <div className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{result}</div>
          )}

          <button
            type="submit"
            disabled={loading || !passcode.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-primary transition-all hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Authenticate"}
          </button>
        </form>
      </section>

      {/* About */}
      <section className="rounded-xl border border-border-primary bg-bg-card overflow-hidden">
        <div className="border-b border-border-primary/40 px-5 py-3">
          <h2 className="font-display text-sm font-semibold text-text-primary">About</h2>
        </div>
        <div className="p-5 text-sm text-text-secondary space-y-2">
          <p>
            <span className="font-display font-semibold text-accent">dvач</span> is a modern imageboard client with a clean, fast interface.
          </p>
          <p>
            Built with Next.js, featuring server-side rendering, prefetched navigation, and auto-refresh threads.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-muted">
            <span className="rounded bg-bg-tertiary px-2 py-1">Next.js 15</span>
            <span className="rounded bg-bg-tertiary px-2 py-1">React 19</span>
            <span className="rounded bg-bg-tertiary px-2 py-1">Tailwind CSS 4</span>
            <span className="rounded bg-bg-tertiary px-2 py-1">TypeScript</span>
          </div>
        </div>
      </section>
    </div>
  );
}
