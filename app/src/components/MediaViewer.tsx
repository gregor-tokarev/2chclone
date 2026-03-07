"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { BoardFile } from "@/lib/types";
import { getFileUrl } from "@/lib/api";

interface MediaViewerProps {
  files: BoardFile[];
  initialIndex: number;
  onClose: () => void;
}

export default function MediaViewer({ files, initialIndex, onClose }: MediaViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);
  const file = files[index];

  const isVideo = file.type === 6 || file.type === 10;

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : files.length - 1));
  }, [files.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i < files.length - 1 ? i + 1 : 0));
  }, [files.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    // Prevent body scroll while viewer is open
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, goPrev, goNext]);

  const viewer = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={getFileUrl(file.path)}
            controls
            autoPlay
            className="max-h-[90vh] max-w-[90vw] rounded-lg"
          />
        ) : (
          <img
            src={getFileUrl(file.path)}
            alt={file.displayname}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-bg-card border border-border-primary text-text-secondary hover:text-text-primary transition-colors z-10"
          aria-label="Close media viewer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Navigation */}
        {files.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              aria-label="Previous image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              aria-label="Next image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Counter */}
        {files.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-xs text-white">
            {index + 1} / {files.length}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render at document.body level, escaping any parent
  // transforms that would break fixed positioning
  if (!mounted) return null;
  return createPortal(viewer, document.body);
}
