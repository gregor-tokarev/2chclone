"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const REPLY_HREF = /\/([a-z0-9]+)\/res\/(\d+)\.html(?:#(\d+))?$/i;

export default function PostLinkHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;

      const anchor = (e.target as HTMLElement | null)?.closest?.(
        ".post-comment a"
      );
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href") || "";

      const hashOnly = href.match(/^#(\d+)$/);
      if (hashOnly) {
        const el = document.getElementById(`post-${hashOnly[1]}`);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }

      const dataNum = anchor.dataset.num;
      const dataThread = anchor.dataset.thread;
      const match = href.match(REPLY_HREF);
      if (!match && !(dataNum && dataThread)) return;

      const board = match ? match[1] : pathname.split("/").filter(Boolean)[0];
      const thread = match ? match[2] : dataThread!;
      const postNum = match ? match[3] ?? dataNum ?? thread : dataNum ?? thread;

      if (!board) return;

      e.preventDefault();

      const onSameThread =
        pathname === `/${board}/${thread}` ||
        pathname.startsWith(`/${board}/${thread}/`);

      if (onSameThread) {
        const el = document.getElementById(`post-${postNum}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          history.replaceState(null, "", `#post-${postNum}`);
        }
        return;
      }

      router.push(`/${board}/${thread}#post-${postNum}`);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname, router]);

  return null;
}
