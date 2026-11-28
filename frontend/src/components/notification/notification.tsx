import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, Megaphone } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  notificationService,
  type UserNotification,
} from "@/services/notificationService";

export default function Notification() {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [detail, setDetail] = useState<UserNotification | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const [refresh, setRefresh] = useState(0);
  const unread = items.filter((item) => !item.daDoc).length;

  useEffect(() => {
    const request = new AbortController();
    activeRequest.current = request;
    notificationService
      .fetchAll(request.signal)
      .then((rows) => {
        if (!request.signal.aborted) {
          setItems(rows);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!request.signal.aborted) setStatus("error");
      });
    return () => request.abort();
  }, [refresh]);

  async function view(item: UserNotification) {
    activeRequest.current?.abort();
    setDetail(item);
    if (item.daDoc) return;
    try {
      await notificationService.markRead(item.maThongBao);
      setItems((rows) =>
        rows.map((row) =>
          row.maThongBao === item.maThongBao ? { ...row, daDoc: true } : row,
        ),
      );
    } catch {
      toast.error("Không thể đánh dấu thông báo là đã đọc");
    }
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setRefresh((value) => value + 1);
        else setDetail(null);
      }}
    >
      <DropdownMenuTrigger
        aria-label={`Thông báo, ${unread} chưa đọc`}
        className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full"
      >
        <Bell className="size-6" />
        {unread > 0 && (
          <span className="pointer-events-none absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center px-1 rounded-full bg-red-600 text-[10px] font-semibold leading-none tabular-nums text-white ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        alignOffset={0}
        sideOffset={8}
        className="w-80 max-w-[92vw]"
      >
        {detail ? (
          <DropdownMenuGroup>
            <div className="flex items-center gap-2 border-b p-2">
              <DropdownMenuItem
                aria-label="Quay lại danh sách thông báo"
                closeOnClick={false}
                onClick={() => setDetail(null)}
                className="justify-center p-2"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
              </DropdownMenuItem>
              <DropdownMenuLabel>Chi tiết thông báo</DropdownMenuLabel>
            </div>
            <article className="space-y-2 p-3">
              <h3 className="break-words text-sm font-semibold">
                {detail.tieuDe}
              </h3>
              <time className="text-xs" dateTime={detail.createdAt}>
                {new Date(detail.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </time>
              <p className="whitespace-pre-wrap break-words text-sm">
                {detail.noiDung}
              </p>
            </article>
          </DropdownMenuGroup>
        ) : (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
            {status === "error" ? (
              <p className="p-3 text-sm">Không thể tải thông báo.</p>
            ) : (
              items.length === 0 && (
                <p className="p-3 text-sm">
                  {status === "loading"
                    ? "Đang tải…"
                    : "Bạn chưa có thông báo."}
                </p>
              )
            )}
            {items.map((item) => (
              <DropdownMenuItem
                key={item.maThongBao}
                closeOnClick={false}
                onClick={() => view(item)}
              >
                <span className="relative inline-flex size-6 shrink-0 items-center justify-center">
                  <Megaphone aria-hidden="true" className="size-6" />
                  {!item.daDoc && (
                    <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-background">
                      <span className="sr-only">Chưa đọc</span>
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={
                      item.daDoc
                        ? "block text-sm"
                        : "block text-sm font-semibold"
                    }
                  >
                    {item.tieuDe}
                  </span>
                  <time className="text-xs">
                    {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </time>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
