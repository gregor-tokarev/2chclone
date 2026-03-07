"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { createPost, getCaptchaId, showEmojiCaptcha, clickEmojiCaptcha } from "@/lib/api";
import type { Board, EmojiCaptchaShowResponse } from "@/lib/types";

interface PostingFormProps {
  board: Board;
  threadNum?: number;
  onPostCreated?: (num: number) => void;
  replyTo?: number | null;
  onClearReply?: () => void;
}

export interface PostingFormHandle {
  expand: () => void;
}

const PostingForm = forwardRef<PostingFormHandle, PostingFormProps>(function PostingForm({
  board,
  threadNum,
  onPostCreated,
  replyTo,
  onClearReply,
}, ref) {
  const [comment, setComment] = useState("");
  const [subject, setSubject] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Captcha state
  const [captchaId, setCaptchaId] = useState<string | null>(null);
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [captchaKeyboard, setCaptchaKeyboard] = useState<string[]>([]);
  const [captchaSolved, setCaptchaSolved] = useState<string | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [captchaClickLoading, setCaptchaClickLoading] = useState(false);

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    setError(null);
    try {
      const captchaRes = await getCaptchaId(board.id, threadNum);
      if (captchaRes.result !== 1) {
        if (captchaRes.type === "nocaptcha") {
          setCaptchaSolved("nocaptcha");
          setCaptchaLoading(false);
          return;
        }
        throw new Error(captchaRes.error?.message || "Failed to get captcha");
      }
      setCaptchaId(captchaRes.id);

      const showRes = await showEmojiCaptcha(captchaRes.id);
      if (showRes.success) {
        setCaptchaSolved(showRes.success);
      } else if (showRes.image && showRes.keyboard) {
        setCaptchaImage(showRes.image);
        setCaptchaKeyboard(showRes.keyboard);
      }
    } catch (err) {
      setError("Failed to load captcha. Try again.");
    }
    setCaptchaLoading(false);
  };

  useImperativeHandle(ref, () => ({
    expand: () => {
      if (!expanded) {
        setExpanded(true);
        loadCaptcha();
      }
      setTimeout(() => textareaRef.current?.focus(), 100);
    },
  }));

  // Add reply quote
  const insertReply = useCallback((num: number) => {
    setComment((prev) => prev + `>>${num}\n`);
    if (!expanded) {
      setExpanded(true);
      loadCaptcha();
    }
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [expanded]);

  // When replyTo changes, insert it
  useEffect(() => {
    if (replyTo && replyTo > 0) {
      insertReply(replyTo);
      onClearReply?.();
    }
  }, [replyTo]);

  const handleCaptchaClick = async (emojiIndex: number) => {
    if (!captchaId) return;
    setCaptchaClickLoading(true);
    try {
      const res = await clickEmojiCaptcha(captchaId, emojiIndex);
      if (res.success) {
        setCaptchaSolved(res.success);
        setCaptchaImage(null);
        setCaptchaKeyboard([]);
      } else if (res.image && res.keyboard) {
        setCaptchaImage(res.image);
        setCaptchaKeyboard(res.keyboard);
      }
    } catch {
      setError("Captcha error. Try again.");
    }
    setCaptchaClickLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("board", board.id);
    if (threadNum) formData.append("thread", String(threadNum));
    if (comment) formData.append("comment", comment);
    if (board.enable_subject && subject) formData.append("subject", subject);
    if (board.enable_names && name) formData.append("name", name);
    if (email) formData.append("email", email);

    if (captchaSolved === "nocaptcha") {
      formData.append("captcha_type", "nocaptcha");
    } else if (captchaSolved) {
      formData.append("captcha_type", "emoji_captcha");
      formData.append("emoji_captcha_id", captchaSolved);
    }

    for (const file of files) {
      formData.append("file[]", file);
    }

    try {
      const res = await createPost(formData);
      if (res.result === 1) {
        const newNum = res.num || res.thread;
        setSuccess(`Posted successfully! #${newNum}`);
        setComment("");
        setSubject("");
        setFiles([]);
        setCaptchaSolved(null);
        setCaptchaId(null);
        if (newNum) onPostCreated?.(newNum);
      } else {
        setError(res.error?.message || "Failed to post");
      }
    } catch {
      setError("Network error. Try again.");
    }
    setIsSubmitting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => {
          setExpanded(true);
          loadCaptcha();
        }}
        className="w-full rounded-xl border-2 border-dashed border-transparent bg-gradient-to-r from-accent/5 to-transparent p-4 text-center text-sm font-medium text-text-secondary transition-all hover:border-accent/40 hover:bg-accent-muted hover:text-accent"
        style={{ borderImage: "linear-gradient(to right, rgba(245,158,11,0.3), rgba(245,158,11,0.05)) 1", borderImageSlice: 1 }}
      >
        <span className="inline-flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {threadNum ? "Write a reply..." : "Create new thread..."}
          <kbd className="ml-1 rounded border border-accent/30 bg-accent/5 px-1.5 py-0.5 font-mono text-[10px] text-accent/70">{threadNum ? "R" : "N"}</kbd>
        </span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setExpanded(false);
        }
      }}
      className="rounded-xl border border-border-primary bg-bg-card overflow-hidden animate-fade-in"
    >
      <div className="border-b border-border-primary/40 px-4 py-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-text-primary">
          {threadNum ? "Reply to thread" : "New thread"}
        </h3>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-text-muted hover:text-text-primary transition-colors text-sm"
        >
          Collapse
        </button>
      </div>

      <div className="space-y-3 p-4">
        {/* Optional fields */}
        <div className="flex gap-3">
          {board.enable_subject && (
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
              maxLength={100}
            />
          )}
          {board.enable_names && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
            />
          )}
        </div>

        {board.enable_sage && (
          <input
            type="text"
            placeholder="Email / sage"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
          />
        )}

        {/* Comment */}
        <textarea
          ref={textareaRef}
          placeholder="Your message..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              const form = e.currentTarget.closest("form");
              if (form) form.requestSubmit();
            }
          }}
          className="w-full rounded-lg border border-border-primary bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all resize-y min-h-[120px]"
          maxLength={board.max_comment}
        />
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="text-[11px] text-text-muted">{`Tip: >>number to quote a post`}</span>
          <span>{comment.length}/{board.max_comment}</span>
        </div>

        {/* File upload */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={board.file_types.map((t) => `.${t}`).join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-border-primary px-3 py-2 text-sm text-text-secondary transition-colors hover:border-accent/40 hover:text-accent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
            Attach files ({files.length})
          </button>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${file.size}`}
                  className="flex items-center gap-2 rounded-lg bg-bg-tertiary px-2 py-1 text-xs text-text-secondary"
                >
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-text-muted hover:text-danger transition-colors"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Captcha */}
        {!captchaSolved && (
          <div className="space-y-3 rounded-lg border border-border-primary bg-bg-secondary p-4">
            <div className="text-xs font-medium text-text-secondary">Solve captcha to post</div>
            {captchaLoading && !captchaImage ? (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                Loading captcha...
              </div>
            ) : captchaImage ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-white p-3 inline-block">
                  <img
                    src={`data:image/png;base64,${captchaImage}`}
                    alt="Select matching emoji"
                    className="h-24"
                  />
                </div>
                <div className="relative">
                  {captchaClickLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-bg-secondary/70 backdrop-blur-[1px]">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {captchaKeyboard.map((emoji, idx) => (
                      <button
                        key={`emoji-${idx}`}
                        type="button"
                        disabled={captchaClickLoading}
                        onClick={() => handleCaptchaClick(idx)}
                        className="rounded-lg border border-border-primary bg-white p-2 transition-all hover:scale-110 hover:border-accent disabled:pointer-events-none"
                      >
                        <img
                          src={`data:image/png;base64,${emoji}`}
                          alt={`Emoji option ${idx + 1}`}
                          className="h-12 w-12"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={loadCaptcha}
                className="rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
              >
                Load captcha
              </button>
            )}
          </div>
        )}

        {captchaSolved && (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Captcha solved
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
        )}
        {success && (
          <div className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{success}</div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || (!captchaSolved)}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg-primary transition-all hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" />
              Posting...
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-2">
              {threadNum ? "Post Reply" : "Create Thread"}
              <kbd className="rounded border border-bg-primary/20 bg-bg-primary/10 px-1.5 py-0.5 font-mono text-[10px]">Ctrl+Enter</kbd>
            </span>
          )}
        </button>
      </div>
    </form>
  );
});

export default PostingForm;
