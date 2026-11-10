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
  censorStatusClasses,
  type CensorDetail,
} from "@/services/adminCensorService";
import PostCensorGallery from "./post-censor-gallery";
import { formatPrice } from "@/lib/format-price";

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
  const fields = post
    ? [
        ["Loại bất động sản", post.loaiBatDongSan.tenLoai],
        ["Giá", formatPrice(post.giaNiemYet)],
        ["Diện tích", `${post.dienTich.toLocaleString("vi-VN")} m²`],
        ["Pháp lý", post.giayToPhapLy?.tenGiayTo],
        ["Phòng ngủ", post.soPhongNgu],
        ["Phòng tắm", post.soPhongTam],
        ["Số tầng", post.soTang],
        ["Hướng nhà", post.huongNha],
        ["Hướng ban công", post.huongBanCong],
        ["Nội thất", post.noiThat],
        ["Mặt tiền", post.matTien == null ? null : `${post.matTien} m`],
        [
          "Đường trước nhà",
          post.matDuong == null ? null : `${post.matDuong} m`,
        ],
      ]
    : [];
  const contactFields = post
    ? [
        ["Người đăng", post.nguoiDang.hoTen],
        ["Người liên hệ", post.nguoiLienHe],
        ["Số điện thoại", post.soDienThoaiLienHe || post.nguoiDang.soDienThoai],
        ["Ngày gửi", new Date(post.updatedAt).toLocaleString("vi-VN")],
      ]
    : [];
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
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-sm border px-2 py-1 text-xs font-semibold ${censorStatusClasses[post.trangThai] ?? "border-gray-200 bg-gray-50"}`}
                >
                  {censorStatuses[post.trangThai] ?? post.trangThai}
                </span>
              </div>
              <section aria-labelledby="censor-images" className="mt-5">
                <h3 id="censor-images" className="text-base font-bold">
                  Hình ảnh bất động sản
                </h3>
                <PostCensorGallery key={post.maTinDang} post={post} />
              </section>
              <section
                aria-labelledby="censor-location"
                className="mt-6 border-t border-gray-200 pt-4"
              >
                <h3 id="censor-location" className="text-base font-bold">
                  Vị trí
                </h3>
                <p className="mt-2 text-sm leading-6">
                  {[
                    post.diaChiChiTiet,
                    post.phuongXa.tenPhuongXa,
                    post.phuongXa.tinhThanh.tenTinhThanh,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {(post.viDo !== null || post.kinhDo !== null) && (
                  <p className="mt-1 text-xs">
                    Vĩ độ: {post.viDo ?? "Chưa có"} · Kinh độ:{" "}
                    {post.kinhDo ?? "Chưa có"}
                  </p>
                )}
              </section>
              {[
                {
                  id: "censor-features",
                  title: "Đặc điểm bất động sản",
                  values: fields,
                },
                {
                  id: "censor-contact",
                  title: "Thông tin liên hệ",
                  values: contactFields,
                },
              ].map((section) => (
                <section
                  key={section.id}
                  aria-labelledby={section.id}
                  className="mt-6 border-t border-gray-200 pt-4"
                >
                  <h3 id={section.id} className="text-base font-bold">
                    {section.title}
                  </h3>
                  <dl className="mt-3 grid grid-cols-1 gap-4 rounded-sm border border-gray-200 p-4 text-sm sm:grid-cols-2">
                    {section.values
                      .filter(
                        ([, value]) =>
                          value !== null && value !== undefined && value !== "",
                      )
                      .map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-xs">{label}</dt>
                          <dd className="mt-1 font-semibold wrap-break-word">
                            {value}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </section>
              ))}
              <h3 className="mt-6 border-t border-gray-200 pt-4 text-base font-bold">
                Tiêu đề tin đăng
              </h3>
              <p className="mt-2 text-sm leading-6 font-semibold wrap-break-word">
                {post.tieuDe}
              </p>
              <h3 className="mt-5 text-base font-bold">Mô tả tin đăng</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 wrap-break-word">
                {post.moTa}
              </p>

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
