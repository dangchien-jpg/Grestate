import VerifiedBadge from "@/components/verify-post/verified-badge";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { Dialog } from "@base-ui/react/dialog";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Backdrop from "@/components/backdrop/backdrop";
import {
  verificationLabels,
  verifyPostService,
  type VerificationDetail,
} from "@/services/verifyPostService";
import EvidenceGallery from "./evidence-gallery";
import { dateTime, errorMessage, reviewPath } from "./review-utils";

export default function VerificationReview({ id }: { id: number }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const back = reviewPath + search;
  const [detail, setDetail] = useState<VerificationDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [reason, setReason] = useState("");
  const [choice, setChoice] = useState<"accept" | "reject" | null>(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  const reasonInput = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    verifyPostService
      .detail(id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setDetail(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(e));
      });
    return () => controller.abort();
  }, [id, revision]);
  function reload() {
    setDetail(null);
    setLoadError("");
    setRevision((n) => n + 1);
  }
  function openDecision(next: "accept" | "reject") {
    setDecisionError("");
    if (next === "reject" && !reason.trim()) {
      setDecisionError(
        "Nhập lý do để người đăng biết cần bổ sung minh chứng nào.",
      );
      reasonInput.current?.focus();
      return;
    }
    setChoice(next);
  }
  async function confirm() {
    if (!choice || lock.current || !detail) return;
    lock.current = true;
    setBusy(true);
    try {
      const response =
        choice === "accept"
          ? await verifyPostService.accept(id, reason.trim() || undefined)
          : await verifyPostService.reject(id, reason.trim());
      if (mounted.current) {
        toast.success(response.message);
        const params = new URLSearchParams(search);
        params.set("tab", response.yeuCau.trangThai);
        navigate(
          { pathname: reviewPath, search: params.toString() },
          { replace: true },
        );
      }
    } catch (e) {
      if (mounted.current) {
        setChoice(null);
        setDecisionError(errorMessage(e));
        if (isAxiosError(e) && [404, 409].includes(e.response?.status ?? 0)) {
          toast.error(errorMessage(e));
          reload();
        }
      }
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <Link
        to={back}
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft size={16} />
        Danh sách hồ sơ
      </Link>
      {loadError ? (
        <div role="alert" className="rounded-lg border bg-white p-6">
          <p>{loadError}</p>
          <Button variant="outline" className="mt-3" onClick={reload}>
            Tải lại hồ sơ
          </Button>
        </div>
      ) : !detail ? (
        <div role="status" className="rounded-lg border bg-white p-8 text-sm ">
          Đang tải hồ sơ và minh chứng…
        </div>
      ) : (
        <>
          <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center gap-3 text-sm ">
              <span>
                Hồ sơ #{detail.maYeuCau} · Tin #{detail.maTinDang}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold ">
                {verificationLabels[detail.trangThai]}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-bold leading-snug  sm:text-2xl">
              <VerifiedBadge verified={detail.tinDang.daXacThuc} />{detail.tinDang.tieuDe}
            </h2>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm ">
              <span className="inline-flex items-center gap-2">
                <UserRound size={16} />
                {detail.nguoiYeuCau.hoTen}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarClock size={16} />
                {dateTime(detail.ngayGui)}
              </span>
              {detail.tinDang.diaChiChiTiet && (
                <span className="inline-flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  {detail.tinDang.diaChiChiTiet}
                </span>
              )}
            </div>
            {detail.ghiChuNguoiGui && (
              <div className="mt-4 rounded-sm border-l-2 border-blue-300 bg-blue-50/60 p-3 text-sm">
                <strong>Ghi chú của người gửi</strong>
                <p className="mt-1 whitespace-pre-wrap break-words">
                  {detail.ghiChuNguoiGui}
                </p>
              </div>
            )}
          </header>
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <EvidenceGallery files={detail.minhChungs} reload={reload} />
            <section className="rounded-lg border bg-white shadow-sm xl:sticky xl:top-5">
              <h2 className="flex items-center gap-2 border-b p-4 font-bold">
                <ShieldCheck size={20} className="text-primary" />
                Quyết định xét duyệt
              </h2>
              {detail.trangThai !== "CHO_XU_LY" ? (
                <div className="space-y-2 p-4 text-sm">
                  <strong>{verificationLabels[detail.trangThai]}</strong>
                  {detail.lyDoXuLy && (
                    <p className="whitespace-pre-wrap break-words">
                      Lý do xử lý: {detail.lyDoXuLy}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {!detail.coTheXacThuc && (
                    <div
                      role="status"
                      className="flex items-start gap-2 rounded-sm bg-amber-50 p-3 text-sm text-amber-900"
                    >
                      <TriangleAlert size={17} className="mt-0.5 shrink-0" />
                      Tin đã thay đổi hoặc ngừng hiển thị. Hãy nêu lý do khi từ
                      chối hồ sơ.
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="review-reason"
                      className="text-sm font-semibold"
                    >
                      Lý do xử lý
                    </label>
                    <textarea
                      id="review-reason"
                      ref={reasonInput}
                      rows={4}
                      maxLength={2000}
                      disabled={busy}
                      value={reason}
                      aria-describedby="reason-hint"
                      onChange={(e) => {
                        setReason(e.target.value);
                        setDecisionError("");
                      }}
                      placeholder="Ví dụ: Vui lòng bổ sung ảnh mặt sau sổ hồng."
                      className="mt-2 block w-full resize-y rounded-sm border border-slate-300 p-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <p id="reason-hint" className="mt-1 text-xs ">
                      Bắt buộc khi từ chối · {reason.length}/2000
                    </p>
                  </div>
                  {decisionError && (
                    <p role="alert" className="text-sm text-red-700">
                      {decisionError}
                    </p>
                  )}
                  <div className="grid gap-2">
                    <Button
                      className="h-11"
                      disabled={busy || !detail.coTheXacThuc}
                      onClick={() => openDecision("accept")}
                    >
                      <Check />
                      Xác thực tin
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 text-red-700 hover:bg-red-50"
                      disabled={busy}
                      onClick={() => openDecision("reject")}
                    >
                      <X />
                      Từ chối hồ sơ
                    </Button>
                  </div>
                </div>
              )}
            </section>
          </div>
          <Dialog.Root
            open={!!choice}
            onOpenChange={(open) => {
              if (!open && !lock.current) setChoice(null);
            }}
          >
            <Dialog.Portal>
              <Dialog.Backdrop render={<Backdrop />} />
              <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-white p-5 shadow-xl">
                <Dialog.Title className="text-lg font-bold">
                  {choice === "reject" ? "Từ chối hồ sơ" : "Xác thực tin đăng"}{" "}
                  #{id}?
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm ">
                  <VerifiedBadge verified={detail.tinDang.daXacThuc} />{detail.tinDang.tieuDe}
                </Dialog.Description>
                {reason.trim() && (
                  <div className="mt-4 rounded-sm bg-slate-50 p-3 text-sm">
                    <strong>Lý do xử lý</strong>
                    <p className="mt-1 whitespace-pre-wrap break-words">
                      {reason.trim()}
                    </p>
                  </div>
                )}
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <Dialog.Close
                    render={<Button variant="outline" disabled={busy} />}
                  >
                    Quay lại
                  </Dialog.Close>
                  <Button
                    className={
                      choice === "reject"
                        ? "bg-red-700 text-white hover:bg-red-800"
                        : ""
                    }
                    disabled={busy}
                    onClick={() => void confirm()}
                  >
                    {busy && <LoaderCircle className="animate-spin" />}
                    {busy
                      ? "Đang lưu…"
                      : choice === "reject"
                        ? "Xác nhận từ chối"
                        : "Xác nhận xác thực"}
                  </Button>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </>
      )}
    </div>
  );
}
