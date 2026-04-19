"use client";

import { useState, useCallback } from "react";
import type { Post as PostType } from "@/lib/types";
import { getFileUrl, getThumbnailUrl, likePost, dislikePost } from "@/lib/api";
import { formatFileSize, formatTimestamp } from "@/lib/utils";
import MediaViewer from "./MediaViewer";

interface PostCardProps {
  post: PostType;
  isOp?: boolean;
  boardId: string;
  threadNum?: number;
  showLikes?: boolean;
  onReply?: (num: number) => void;
  onReport?: (num: number) => void;
  highlighted?: boolean;
}

export default function PostCard({
  post,
  isOp,
  boardId,
  threadNum,
  showLikes,
  onReply,
  onReport,
  highlighted,
}: PostCardProps) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [dislikes, setDislikes] = useState(post.dislikes || 0);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());

  const handleLike = useCallback(async () => {
    try {
      const res = await likePost(boardId, post.num);
      if (res.result === 1) setLikes((l) => l + 1);
    } catch {}
  }, [boardId, post.num]);

  const handleDislike = useCallback(async () => {
    try {
      const res = await dislikePost(boardId, post.num);
      if (res.result === 1) setDislikes((d) => d + 1);
    } catch {}
  }, [boardId, post.num]);

  const toggleFileExpand = (idx: number) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const isVideo = (type: number) => type === 6 || type === 10;
  const isImage = (type: number) => type >= 1 && type <= 5;

  return (
    <>
      <article
        id={`post-${post.num}`}
        className={`group relative rounded-xl border transition-all duration-200 ${
          highlighted
            ? "border-accent/40 bg-accent-muted"
            : isOp
            ? "border-border-primary bg-bg-card"
            : "border-border-primary/60 bg-bg-card/80 hover:border-border-primary hover:bg-bg-card"
        }`}
      >
        {/* Post header */}
        <div className={`flex flex-wrap items-center gap-2 border-b border-border-primary/40 px-4 py-2.5 ${isOp ? "bg-gradient-to-r from-accent/10 to-transparent" : ""}`}>
          {isOp && (
            <span className="rounded bg-op-badge/20 px-1.5 py-0.5 font-mono text-sm font-normal text-op-badge">
              OP
            </span>
          )}
          {post.sticky === 1 && (
            <span className="rounded bg-sticky-badge/20 px-1.5 py-0.5 font-mono text-sm font-normal text-sticky-badge">
              PIN
            </span>
          )}
          {post.closed === 1 && (
            <span className="rounded bg-closed-badge/20 px-1.5 py-0.5 font-mono text-sm font-normal text-closed-badge">
              CLOSED
            </span>
          )}

          <span className="font-normal text-text-primary text-base">
            {post.name || "Anonymous"}
          </span>

          {post.trip && (
            <span
              className="text-sm font-mono text-info"
              style={post.trip_style ? { color: post.trip_style } : {}}
            >
              {post.trip}
            </span>
          )}

          {post.email === "mailto:sage" && (
            <span className="text-sm font-normal text-danger">SAGE</span>
          )}

          {post.subject && (
            <span className="font-display text-base font-normal text-accent">
              {post.subject}
            </span>
          )}

          <span className="text-sm text-text-muted">{post.date}</span>

          <a
            href={`#post-${post.num}`}
            className="font-mono text-sm text-text-secondary hover:text-accent transition-colors"
          >
            #{post.num}
          </a>

          {post.icon && (
            <span className="text-sm text-text-secondary">{post.icon}</span>
          )}

          {post.tags && (
            <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-sm text-text-secondary">
              {post.tags}
            </span>
          )}
        </div>

        {/* Post body */}
        <div className="px-4 py-3">
          {/* Files */}
          {post.files && post.files.length > 0 && (
            <div className={`mb-3 flex flex-wrap gap-2 ${isOp ? "" : ""}`}>
              {post.files.map((file, idx) => (
                <div key={file.path} className="group/file relative">
                  <div className="mb-1 flex items-center gap-1.5 text-sm text-text-secondary">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${isVideo(file.type) ? "bg-info" : "bg-success"}`} />
                    <span className="max-w-[150px] truncate">{file.displayname}</span>
                    <span>({formatFileSize(file.size)}, {file.width}x{file.height})</span>
                  </div>
                  {isVideo(file.type) ? (
                    expandedFiles.has(idx) ? (
                      <video
                        src={getFileUrl(file.path)}
                        controls
                        className="max-h-[500px] max-w-full rounded-lg"
                        onClick={() => toggleFileExpand(idx)}
                      />
                    ) : (
                      <button
                        onClick={() => toggleFileExpand(idx)}
                        className="relative cursor-pointer overflow-hidden rounded-lg border border-border-primary/40 transition-all hover:border-accent/40"
                      >
                        <img
                          src={getThumbnailUrl(file.thumbnail)}
                          alt=""
                          width={file.tn_width}
                          height={file.tn_height}
                          className="max-h-[200px] object-cover transition-all duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                              <polygon points="5,3 19,12 5,21" />
                            </svg>
                          </div>
                        </div>
                        {file.duration && (
                          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-sm text-white">
                            {file.duration}
                          </span>
                        )}
                      </button>
                    )
                  ) : isImage(file.type) ? (
                    expandedFiles.has(idx) ? (
                      <button onClick={() => toggleFileExpand(idx)} className="cursor-pointer">
                        <img
                          src={getFileUrl(file.path)}
                          alt=""
                          className="max-h-[600px] max-w-full rounded-lg"
                          loading="lazy"
                        />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setMediaIndex(idx);
                          setMediaViewerOpen(true);
                        }}
                        className="relative cursor-pointer overflow-hidden rounded-lg border border-border-primary/40 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
                      >
                        <img
                          src={getThumbnailUrl(file.thumbnail)}
                          alt=""
                          width={file.tn_width}
                          height={file.tn_height}
                          className="max-h-[200px] object-cover transition-all duration-300 group-hover/file:scale-[1.02]"
                          loading="lazy"
                        />
                      </button>
                    )
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* Comment */}
          <div
            className="post-comment text-base leading-relaxed text-text-primary"
            dangerouslySetInnerHTML={{ __html: post.comment }}
          />
        </div>

        {/* Post footer */}
        <div className="flex items-center gap-3 border-t border-border-primary/20 px-4 py-2">
          {onReply && (
            <button
              onClick={() => onReply(post.num)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-normal text-text-secondary transition-colors hover:bg-accent-muted hover:text-accent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
              </svg>
              Reply
              <kbd className="ml-1 rounded border border-border-primary/60 bg-bg-secondary/80 px-1 py-px font-mono text-xs text-text-muted">R</kbd>
            </button>
          )}

          {showLikes && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-text-secondary transition-colors hover:bg-success/10 hover:text-success"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
                {likes > 0 && <span>{likes}</span>}
              </button>
              <button
                onClick={handleDislike}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                </svg>
                {dislikes > 0 && <span>{dislikes}</span>}
              </button>
            </div>
          )}

          {onReport && (
            <button
              onClick={() => onReport(post.num)}
              className="ml-auto rounded-md px-2 py-1 text-sm text-text-muted opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
            >
              Report
            </button>
          )}

          {post.banned === 1 && (
            <span className="text-sm font-normal text-danger">USER WAS BANNED</span>
          )}

          {isOp && post.views > 0 && (
            <span className="ml-auto text-sm text-text-muted">
              {post.views.toLocaleString()} views
            </span>
          )}
        </div>
      </article>

      {/* Media viewer */}
      {mediaViewerOpen && post.files && (
        <MediaViewer
          files={post.files}
          initialIndex={mediaIndex}
          onClose={() => setMediaViewerOpen(false)}
        />
      )}
    </>
  );
}
