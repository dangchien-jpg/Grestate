import { useEffect, useState } from "react";
import { adminReportService } from "@/services/adminReportService";

export default function PendingReportBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let controller: AbortController | undefined;
    const refresh = () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      Promise.all([
        adminReportService.list("CHO_XU_LY", 1, request.signal),
        adminReportService.list("DANG_XU_LY", 1, request.signal),
      ])
        .then(([waiting, processing]) => {
          if (!request.signal.aborted)
            setCount(waiting.total + processing.total);
        })
        .catch((err) => {
          console.error(err);
        });
    };
    refresh();
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    window.addEventListener("admin-report-updated", refresh);
    return () => {
      controller?.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("admin-report-updated", refresh);
    };
  }, []);
  return count > 0 ? (
    <span
      role="status"
      aria-label={`${count} báo cáo chờ xử lý`}
      className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-md bg-red-600 px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-white"
    >
      {count}
    </span>
  ) : null;
}
