import type {
  Board,
  CaptchaResponse,
  CatalogResponse,
  EmojiCaptchaShowResponse,
  LikeResponse,
  MobilePostResponse,
  PasscodeResponse,
  PostingResponse,
  ReportResponse,
  ThreadLastInfoResponse,
  ThreadPostsAfterResponse,
  ThreadResponse,
} from "./types";

const API_BASE = "/api/proxy";
const SERVER_BASE = "https://2ch.org";
const CDN_BASE = "https://2ch.org";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Server-side fetch (for SSR/SSG)
async function fetchJsonServer<T>(path: string): Promise<T> {
  const res = await fetch(`${SERVER_BASE}${path}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ---- Board endpoints ----

export async function getBoards(): Promise<Board[]> {
  return fetchJsonServer<Board[]>("/api/mobile/v2/boards");
}

export async function getBoardsClient(): Promise<Board[]> {
  return fetchJson<Board[]>(`${API_BASE}/api/mobile/v2/boards`);
}

// ---- Catalog (not in API spec, but standard 2ch endpoint) ----

export async function getCatalog(board: string): Promise<CatalogResponse> {
  return fetchJsonServer<CatalogResponse>(`/${board}/catalog.json`);
}

export async function getCatalogClient(board: string): Promise<CatalogResponse> {
  return fetchJson<CatalogResponse>(`${API_BASE}/${board}/catalog.json`);
}

// ---- Thread (full thread JSON) ----

export async function getThread(board: string, thread: number): Promise<ThreadResponse> {
  return fetchJsonServer<ThreadResponse>(`/${board}/res/${thread}.json`);
}

export async function getThreadClient(board: string, thread: number): Promise<ThreadResponse> {
  return fetchJson<ThreadResponse>(`${API_BASE}/${board}/res/${thread}.json`);
}

// ---- Thread posts after ----

export async function getPostsAfter(
  board: string,
  thread: number,
  num: number
): Promise<ThreadPostsAfterResponse> {
  return fetchJson<ThreadPostsAfterResponse>(
    `${API_BASE}/api/mobile/v2/after/${board}/${thread}/${num}`
  );
}

// ---- Thread info ----

export async function getThreadInfo(
  board: string,
  thread: number
): Promise<ThreadLastInfoResponse> {
  return fetchJson<ThreadLastInfoResponse>(
    `${API_BASE}/api/mobile/v2/info/${board}/${thread}`
  );
}

// ---- Single post ----

export async function getPost(board: string, num: number): Promise<MobilePostResponse> {
  return fetchJson<MobilePostResponse>(
    `${API_BASE}/api/mobile/v2/post/${board}/${num}`
  );
}

// ---- Captcha ----

export async function getCaptchaId(board?: string, thread?: number): Promise<CaptchaResponse> {
  const params = new URLSearchParams();
  if (board) params.set("board", board);
  if (thread) params.set("thread", String(thread));
  return fetchJson<CaptchaResponse>(
    `${API_BASE}/api/captcha/emoji/id?${params.toString()}`
  );
}

export async function showEmojiCaptcha(id: string): Promise<EmojiCaptchaShowResponse> {
  return fetchJson<EmojiCaptchaShowResponse>(
    `${API_BASE}/api/captcha/emoji/show?id=${id}`
  );
}

export async function clickEmojiCaptcha(
  captchaTokenID: string,
  emojiNumber: number
): Promise<EmojiCaptchaShowResponse> {
  return fetchJson<EmojiCaptchaShowResponse>(`${API_BASE}/api/captcha/emoji/click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ captchaTokenID, emojiNumber }),
  });
}

// ---- Posting ----

export async function createPost(formData: FormData): Promise<PostingResponse> {
  const res = await fetch(`${API_BASE}/user/posting`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

// ---- Report ----

export async function sendReport(
  board: string,
  thread: number,
  posts: number[],
  comment: string
): Promise<ReportResponse> {
  const formData = new FormData();
  formData.append("board", board);
  formData.append("thread", String(thread));
  for (const p of posts) {
    formData.append("post", String(p));
  }
  formData.append("comment", comment);
  const res = await fetch(`${API_BASE}/user/report`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

// ---- Passcode ----

export async function loginPasscode(passcode: string): Promise<PasscodeResponse> {
  const formData = new FormData();
  formData.append("passcode", passcode);
  const res = await fetch(`${API_BASE}/user/passlogin?json=1`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

// ---- Like / Dislike ----

export async function likePost(board: string, num: number): Promise<LikeResponse> {
  return fetchJson<LikeResponse>(
    `${API_BASE}/api/like?board=${board}&num=${num}`
  );
}

export async function dislikePost(board: string, num: number): Promise<LikeResponse> {
  return fetchJson<LikeResponse>(
    `${API_BASE}/api/dislike?board=${board}&num=${num}`
  );
}

// ---- Helpers ----

export function getFileUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${CDN_BASE}${path}`;
}

export function getThumbnailUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${CDN_BASE}${path}`;
}
