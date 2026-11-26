import PostReviewContent from "@/components/property/post-review-content";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Check, LoaderCircle, X } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import Backdrop from "@/components/backdrop/backdrop";
import {
  adminCensorService,
  censorError,
  censorStatuses,
  type CensorDetail,
} from "@/services/adminCensorService";

export default function PostCensorDetail({
  id,
  onClose,
  onUpdated,
}: {
  id: number;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [post, setPost] = useState<CensorDetail | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    adminCensorService
      .detail(id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setPost(data);
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(censorError(failure));
      });
    return () => controller.abort();
  }, [id, retry]);

  async function moderate(reject: boolean) {
    if (lock.current) return;
    if (reject && !reason.trim()) {
      setActionError("Vui lòng nhập lý do từ chối.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setActionError("");
    try {
      if (reject) await adminCensorService.reject(id, reason.trim());
      else await adminCensorService.accept(id);
      toast.success(reject ? "Đã từ chối tin đăng" : "Đã duyệt tin đăng");
      onUpdated();
    } catch (failure) {
      if (
        isAxiosError(failure) &&
        [404, 409].includes(failure.response?.status ?? 0)
      ) {
        toast.error(censorError(failure));
        onUpdated();
      } else setActionError(censorError(failure));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const button =
    "rounded-sm border border-gray-300 px-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !lock.current) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop render={<Backdrop />} />
        <Dialog.Popup
          aria-busy={busy}
          className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sm border border-gray-200 bg-white p-5 font-sans shadow-lg outline-none sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="text-lg font-bold">
              Chi tiết kiểm duyệt · #{id}
            </Dialog.Title>
            <button
              type="button"
              aria-label="Đóng chi tiết"
              disabled={busy}
              onClick={onClose}
              className="rounded-sm p-1 disabled:opacity-50"
            >
              <X className="size-5" />
            </button>
          </div>
          {error ? (
            <div role="alert" className="mt-5 text-sm text-red-600">
              {error}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setRetry((v) => v + 1);
                }}
                className="ml-3 underline"
              >
                Thử lại
              </button>
            </div>
          ) : !post ? (
            <p
              role="status"
              className="flex items-center justify-center gap-2 py-12 text-sm"
            >
              <LoaderCircle className="size-5 animate-spin" />
              Đang tải chi tiết...
            </p>
          ) : (
            <>
              <PostReviewContent post={post} />

              <h3 className="mt-6 border-t border-gray-200 pt-4 text-base font-bold">
                Lịch sử kiểm duyệt
              </h3>
              {post.lichSuKiemDuyets.length === 0 ? (
                <p className="mt-2 text-sm">Chưa có lịch sử kiểm duyệt.</p>
              ) : (
                <ol className="mt-3 space-y-3">
                  {post.lichSuKiemDuyets.map((item) => (
                    <li
                      key={item.maKiemDuyet}
                      className="rounded-sm border border-gray-200 p-3 text-sm"
                    >
                      <p className="font-semibold">
                        {censorStatuses[item.ketQua] ?? item.ketQua} ·{" "}
                        {item.nguoiDung.hoTen}
                      </p>
                      <p className="mt-1 text-xs">
                        {new Date(item.ngayKiemDuyet).toLocaleString("vi-VN")}
                      </p>
                      {item.lyDoTuChoi && (
                        <p className="mt-2 whitespace-pre-wrap wrap-break-word">
                          Lý do: {item.lyDoTuChoi}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}

              {actionError && !rejecting && (
                <p role="alert" className="mt-4 text-sm text-red-600">
                  {actionError}
                </p>
              )}
              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onClose}
                  className={button}
                >
                  Đóng
                </button>
                {post.trangThai === "CHO_KIEM_DUYET" && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setActionError("");
                        setRejecting(true);
                      }}
                      className={`${button} text-red-600`}
                    >
                      Từ chối
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void moderate(false)}
                      className={`${button} inline-flex items-center gap-2 border-primary bg-primary font-semibold text-white`}
                    >
                      {busy ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      {busy ? "Đang xử lý..." : "Duyệt tin"}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
          <Dialog.Root
            open={rejecting}
            onOpenChange={(open) => {
              if (!lock.current) setRejecting(open);
            }}
          >
            <Dialog.Portal>
              <Dialog.Backdrop render={<Backdrop />} />
              <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-sm border border-gray-200 bg-white p-5 font-sans shadow-lg outline-none">
                <Dialog.Title className="text-lg font-bold">
                  Từ chối tin đăng
                </Dialog.Title>
                <form
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    void moderate(true);
                  }}
                >
                  <label
                    htmlFor="rejection-reason"
                    className="mt-4 block text-sm font-semibold"
                  >
                    Lý do từ chối <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="rejection-reason"
                    required
                    maxLength={5000}
                    rows={5}
                    disabled={busy}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="mt-2 w-full resize-y rounded-sm border border-input p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  />
                  {actionError && (
                    <p role="alert" className="mt-2 text-sm text-red-600">
                      {actionError}
                    </p>
                  )}
                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setRejecting(false)}
                      className={button}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className={`${button} inline-flex items-center gap-2 border-red-600 bg-red-600 font-semibold text-white`}
                    >
                      {busy && <LoaderCircle className="size-4 animate-spin" />}
                      {busy ? "Đang xử lý..." : "Xác nhận từ chối"}
                    </button>
                  </div>
                </form>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
