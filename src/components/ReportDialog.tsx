"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { sendReport } from "@/lib/api";

interface ReportDialogProps {
  board: string;
  thread: number;
  postNum: number;
  onClose: () => void;
}

export default function ReportDialog({ board, thread, postNum, onClose }: ReportDialogProps) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please describe the reason for reporting.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await sendReport(board, thread, [postNum], comment);
      if (res.result === 1) {
        setSuccess(true);
        setTimeout(onClose, 1500);
      } else {
        setError(res.error?.message || "Failed to send report");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  const dialog = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border-primary bg-bg-card p-5 shadow-2xl animate-fade-in cursor-default"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Report post"
      >
        <h3 className="mb-4 font-display text-lg font-semibold text-text-primary">
          Report Post #{postNum}
        </h3>

        {success ? (
          <div className="rounded-lg bg-success/10 p-4 text-center text-sm text-success">
            Report sent successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              placeholder="Reason for reporting..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all resize-y min-h-[100px]"
              autoFocus
            />

            {error && (
              <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-border-primary py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-danger py-2 text-sm font-semibold text-white transition-all hover:bg-danger/90 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(dialog, document.body);
}
