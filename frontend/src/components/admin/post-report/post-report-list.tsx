import QueueToolbar from "../queue-toolbar";
import VerifiedBadge from "@/components/verify-post/verified-badge";
import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminReportService,
  reportError,
  reportStatuses,
  type AdminReport,
} from "@/services/adminReportService";
import PostReportDetail from "./post-report-detail";

export default function PostReportList() {
  const [status, setStatus] = useState("CHO_XU_LY");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const key = JSON.stringify([status, page, revision]);
  const [result, setResult] = useState<{
    key: string;
    reports: AdminReport[];
    total: number;
    error: string;
  } | null>(null);
  const current = result?.key === key ? result : null;
  useEffect(() => {
    const controller = new AbortController();
    adminReportService
      .list(status, page, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ ...data, key, error: "" });
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            reports: [],
            total: 0,
            error: reportError(failure),
          });
      });
    return () => controller.abort();
  }, [status, page, key]);
  const pages = Math.max(1, Math.ceil((current?.total ?? 0) / 10));
  return (
    <section className="overflow-hidden rounded-sm bg-white shadow-sm">
      <QueueToolbar
        icon={Flag}
        title="Báo cáo tin đăng"
        summary={!current ? "Đang tải…" : current.error ? "Chưa cập nhật được danh sách" : `${current.total} báo cáo · ${reportStatuses[status] ?? "Tất cả"}`}
        statuses={reportStatuses}
        status={status}
        loading={!current}
        onRefresh={() => setRevision(value => value + 1)}
        onStatus={value => { setStatus(value); setPage(1); }}
      />
      {!current ? (
        <p role="status" className="flex justify-center gap-2 py-12">
          <LoaderCircle className="size-5 animate-spin" />
          Đang tải báo cáo...
        </p>
      ) : current.error ? (
        <div role="alert" className="py-8 text-sm text-red-600">
          {current.error}
          <button
            onClick={() => setRevision((value) => value + 1)}
            className="ml-3 underline"
          >
            Thử lại
          </button>
        </div>
      ) : !current.reports.length ? (
        <div className="rounded border border-dashed py-12 text-center text-sm">
          <Flag className="mx-auto mb-3 size-7" />
          <p>Không có báo cáo phù hợp.</p>
          {page > 1 && (
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => setPage(1)}
            >
              Về trang đầu
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="hidden lg:grid-cols-[minmax(0,2fr)_minmax(100px,1fr)_145px_90px] gap-4 border-y bg-[#eee] px-6 py-3 text-xs font-semibold lg:grid">
            <span>Tin đăng</span><span>Người báo cáo</span><span>Ngày gửi</span><span className="text-right">Xử lý</span>
          </div>
          <ul className="divide-y divide-slate-200">
            {current.reports.map((report) => (
              <li key={report.maBaoCao}>
                <button type="button" onClick={() => setSelected(report.maBaoCao)}
                  className="group grid w-full items-center gap-2 px-4 py-4 text-left hover:bg-[#eee]/30 focus-visible:outline-primary sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(100px,1fr)_145px_90px] lg:gap-4">
                  <span className="flex min-w-0 items-start gap-3">
                    <img src={report.tinDang.hinhAnhTinDangs[0]?.hinhAnhUrl || "/placeholder.png"} alt="" loading="lazy" className="h-14 w-20 shrink-0 rounded-sm bg-slate-100 object-cover" />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-semibold group-hover:text-primary"><VerifiedBadge verified={report.tinDang.daXacThuc} />{report.tinDang.tieuDe}</span>
                      <span className="block mt-1 text-xs text-muted-foreground">Tin #{report.maTinDang} · Báo cáo #{report.maBaoCao}</span>
                    <span className="block mt-1 line-clamp-2 text-sm">{report.noiDung}</span>
                    <span className={`mt-1 inline-flex rounded-sm border px-2 py-0.5 text-xs ${report.trangThai === "CO_VI_PHAM" ? "border-red-200 bg-red-50 text-red-700" : report.trangThai === "KHONG_VI_PHAM" ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{reportStatuses[report.trangThai] ?? report.trangThai}</span>
                    </span>
                  </span>
                  <span className="text-sm"><span className="lg:hidden">Người báo cáo: </span>{report.nguoiBaoCao.hoTen}</span>
                  <time dateTime={report.ngayBaoCao} className="text-sm">{new Date(report.ngayBaoCao).toLocaleDateString("vi-VN")}</time>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary lg:justify-end">Chi tiết <ArrowRight size={15} /></span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {current && !current.error && current.total > 0 && (
        <nav
          aria-label="Phân trang báo cáo"
          className="flex items-center justify-center gap-4 border-t p-4 text-sm"
        >
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Trước
          </Button>
          <span>
            Trang {page} / {pages}
          </span>
          <Button
            variant="outline"
            disabled={page >= pages}
            onClick={() => setPage((value) => value + 1)}
          >
            Sau
          </Button>
        </nav>
      )}
      {selected !== null && (
        <PostReportDetail
          key={selected}
          id={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setSelected(null);
            setRevision((value) => value + 1);
          }}
        />
      )}
    </section>
  );
}
