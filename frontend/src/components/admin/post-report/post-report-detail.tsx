import { Link } from "react-router";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import {
  adminReportService,
  reportError,
  reportStatuses,
  type ReportDetail,
} from "@/services/adminReportService";

export default function PostReportDetail({
  id,
  onClose,
  onUpdated,
}: {
  id: number;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [retry, setRetry] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    adminReportService
      .detail(id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setReport(data);
          setError("");
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(reportError(failure));
      });
    return () => controller.abort();
  }, [id, retry]);
  async function resolve(violation: boolean) {
    if (lock.current) return;
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do xử lý.");
      return;
    }
    if (violation && !confirming) {
      setConfirming(true);
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await adminReportService.resolve(id, violation, reason.trim());
      toast.success(
        violation ? "Đã xác nhận vi phạm" : "Đã xác nhận không vi phạm",
      );
      onUpdated();
    } catch (failure) {
      setError(reportError(failure));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const pending =
    report && ["CHO_XU_LY", "DANG_XU_LY"].includes(report.trangThai);
  const post = report?.tinDang;
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !lock.current) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Popup
          aria-busy={busy}
          className="fixed top-1/2 left-1/2 z-[61] max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-5 font-sans shadow-xl outline-none sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="text-lg font-bold">
              Chi tiết báo cáo #{id}
            </Dialog.Title>
            <button
              aria-label="Đóng chi tiết"
              disabled={busy}
              onClick={onClose}
              className="rounded p-2 hover:bg-gray-100"
            >
              <X className="size-5" />
            </button>
          </div>
          <Dialog.Description className="mt-1 text-sm text-gray-600">
            Đối chiếu phản ánh với nội dung tin trước khi xác nhận kết quả.
          </Dialog.Description>
          {!report && !error && (
            <p role="status" className="flex items-center gap-2 py-8">
              <LoaderCircle className="size-5 animate-spin" />
              Đang tải báo cáo...
            </p>
          )}
          {report && post && (
            <>
              <section className="mt-5 rounded border bg-gray-50 p-4 text-sm">
                <p className="font-semibold">
                  {reportStatuses[report.trangThai] ?? report.trangThai}
                </p>
                <p className="mt-2">
                  Người báo cáo: {report.nguoiBaoCao.hoTen}
                </p>
                <p>
                  Ngày gửi:{" "}
                  {new Date(report.ngayBaoCao).toLocaleString("vi-VN")}
                </p>
                <p className="mt-3 whitespace-pre-wrap break-words">
                  {report.noiDung}
                </p>
              </section>
              <section className="mt-5 flex flex-col gap-4 rounded border p-4 text-sm sm:flex-row">
                <img
                  src={
                    post.hinhAnhTinDangs[0]?.hinhAnhUrl || "/placeholder.png"
                  }
                  alt={post.tieuDe}
                  className="aspect-video w-full shrink-0 rounded object-cover sm:h-24 sm:w-36"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <h2 className="line-clamp-2 font-bold">{post.tieuDe}</h2>
                  <p className="text-xs text-gray-500">
                    Mã tin: {post.maTinDang} · Trạng thái: {post.trangThai}
                    {post.deletedAt ? " · Đã xóa" : ""}
                  </p>
                  <p className="font-semibold text-red-600">
                    {formatPrice(Number(post.giaNiemYet))} ·{" "}
                    {Number(post.dienTich).toLocaleString("vi-VN")} m²
                  </p>
                  <p>Người đăng: {post.nguoiDang.hoTen}</p>
                  {post.trangThai === "DA_DUYET" && !post.deletedAt ? (
                    <Link
                      to={`/detail/${post.maTinDang}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded border px-3 py-2 text-sm font-semibold hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      Xem chi tiết
                    </Link>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Tin không còn hiển thị trên trang công khai.
                    </p>
                  )}
                </div>
              </section>
              {pending ? (
                <section className="mt-6 border-t pt-4">
                  <label
                    htmlFor="report-reason"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Lý do xử lý <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="report-reason"
                    value={reason}
                    onChange={(event) => {
                      setReason(event.target.value);
                      setConfirming(false);
                    }}
                    maxLength={500}
                    disabled={busy}
                    rows={3}
                    placeholder="Nhập lý do xác nhận của admin"
                    className="w-full rounded border p-3 text-sm"
                  />
                  <p className="text-right text-xs text-gray-500">
                    {reason.length}/500
                  </p>
                  {confirming ? (
                    <div className="mt-3 rounded border border-red-200 bg-red-50 p-4 text-sm">
                      <p className="font-semibold">
                        Xác nhận vi phạm: {post.tieuDe}
                      </p>
                      <p className="mt-2">
                        {post.trangThai === "BI_GO"
                          ? "Tin đã bị gỡ. Báo cáo này sẽ được đóng với kết quả có vi phạm, không gửi lại thông báo."
                          : "Tin sẽ bị gỡ khỏi trang công khai và người đăng sẽ nhận thông báo."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => setConfirming(false)}
                        >
                          Quay lại
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={busy}
                          onClick={() => resolve(true)}
                        >
                          {busy ? "Đang xử lý..." : "Xác nhận vi phạm"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap justify-end gap-3">
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => resolve(false)}
                      >
                        Không vi phạm
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={
                          busy ||
                          !!post.deletedAt ||
                          !["DA_DUYET", "BI_GO"].includes(post.trangThai)
                        }
                        onClick={() => resolve(true)}
                      >
                        {post.trangThai === "BI_GO"
                          ? "Xác nhận vi phạm"
                          : "Xác nhận vi phạm và gỡ tin"}
                      </Button>
                    </div>
                  )}
                </section>
              ) : (
                <section className="mt-6 rounded border p-4 text-sm">
                  <h2 className="font-semibold">Kết quả xử lý</h2>
                  <p className="mt-2 whitespace-pre-wrap break-words">
                    {report.ghiChu || "Không có ghi chú"}
                  </p>
                  {report.ngayXuLy && (
                    <p className="mt-2">
                      Ngày xử lý:{" "}
                      {new Date(report.ngayXuLy).toLocaleString("vi-VN")}
                    </p>
                  )}
                </section>
              )}
            </>
          )}
          {error && (
            <div role="alert" className="mt-4 text-sm text-red-600">
              {error}
              {!report && (
                <button
                  className="ml-3 underline"
                  onClick={() => {
                    setError("");
                    setRetry((value) => value + 1);
                  }}
                >
                  Thử lại
                </button>
              )}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
