import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
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
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    if (detail) dialog.current?.showModal();
  }, [detail]);

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
    <>
      <DropdownMenu
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setRefresh((value) => value + 1);
        }}
      >
        <DropdownMenuTrigger
          ref={trigger}
          aria-label={`Thông báo, ${unread} chưa đọc`}
          className="relative inline-grid size-8 place-items-center rounded-sm"
        >
          <Bell className="size-6" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 rounded-md bg-red-600 px-1 text-[10px] font-semibold text-white">
              {unread}
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
                onClick={() => view(item)}
              >
                {!item.daDoc && (
                  <span
                    aria-label="Chưa đọc"
                    className="size-2 shrink-0 rounded-sm bg-primary"
                  />
                )}
                <span className="min-w-0">
                  <span
                    className={
                      item.daDoc ? "block text-sm" : "block font-semibold"
                    }
                  >
                    {item.tieuDe}
                  </span>
                  <time className="text-sm">
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </time>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <dialog
        ref={dialog}
        aria-labelledby="notification-title"
        onClose={() => {
          setDetail(null);
          trigger.current?.focus();
        }}
        className="fixed inset-0 m-auto max-h-[80vh] w-96 max-w-[92vw] rounded-sm p-5 shadow-lg backdrop:bg-black/40"
      >
        {detail && (
          <>
            <h2 id="notification-title" className="text-lg font-semibold">
              {detail.tieuDe}
            </h2>
            <time className="text-xs">
              {new Date(detail.createdAt).toLocaleString("vi-VN")}
            </time>
            <p className="my-4 whitespace-pre-wrap break-words">
              {detail.noiDung}
            </p>
            <button
              onClick={() => dialog.current?.close()}
              className="rounded-sm  border border-[#ccc] px-3 py-1"
            >
              Đóng
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
