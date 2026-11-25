import { useEffect, useState } from "react";
import { adminCensorService } from "@/services/adminCensorService";

import { verifyPostService } from "@/services/verifyPostService";

export default function PendingPostBadge({ verification = false }: { verification?: boolean }) {
  const updateEvent = verification ? "admin-verification-updated" : "admin-censor-updated";
  const [count, setCount] = useState(0);

  useEffect(() => {
    let controller: AbortController | undefined;
    const refresh = () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      const countRequest = verification
        ? verifyPostService.list("CHO_XU_LY", request.signal).then(requests => requests.length)
        : adminCensorService.list({ status: "CHO_KIEM_DUYET", page: 1 }, request.signal).then(result => result.total);
      countRequest.then(total => {
          if (!request.signal.aborted) setCount(total);
        })
        .catch((err) => {
          if (!request.signal.aborted) console.error(err);
        });
    };
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    window.addEventListener(updateEvent, refresh);
    return () => {
      controller?.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(updateEvent, refresh);
    };
  }, [verification, updateEvent]);

  if (count === 0) return null;

  return (
    <span
      role="status"
      aria-label={`${count} tin chờ ${verification ? "xác thực" : "kiểm duyệt"}`}
      aria-live="polite"
      aria-atomic="true"
      className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-md bg-red-600 px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-white"
    >
      {count}
    </span>
  );
}
