import { useEffect, useState } from "react";
import { adminCensorService } from "@/services/adminCensorService";

export default function PendingPostBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let controller: AbortController | undefined;
    const refresh = () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      adminCensorService
        .list({ status: "CHO_KIEM_DUYET", page: 1 }, request.signal)
        .then(({ total }) => {
          if (!request.signal.aborted) setCount(total);
        })
        .catch(() => {
          // Keep the last known count when a refresh fails.
        });
    };
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    window.addEventListener("admin-censor-updated", refresh);
    return () => {
      controller?.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("admin-censor-updated", refresh);
    };
  }, []);

  if (count === 0) return null;

  return (
    <span
      role="status"
      aria-label={`${count} tin chờ kiểm duyệt`}
      aria-live="polite"
      aria-atomic="true"
      className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-md bg-red-600 px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-white"
    >
      {count}
    </span>
  );
}
