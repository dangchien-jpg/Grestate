import { useEffect, useState } from "react";
import { LoaderCircle, Flag } from "lucide-react";
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
    <section className="m-4 rounded bg-white p-4 sm:m-6 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Danh sách báo cáo</h2>
          <p className="mt-1 text-sm text-gray-600">
            {current && !current.error
              ? `${current.total} báo cáo`
              : "Xem xét và xử lý phản ánh về tin đăng"}
          </p>
        </div>
        <select
          aria-label="Trạng thái báo cáo"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded border bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(reportStatuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                {[
                  "Tin đăng",
                  "Người báo cáo",
                  "Nội dung",
                  "Ngày gửi",
                  "Trạng thái",
                  "Thao tác",
                ].map((label) => (
                  <th key={label} className="px-3 py-3 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {current.reports.map((report) => (
                <tr key={report.maBaoCao} className="border-b align-top">
                  <td className="max-w-64 px-3 py-4">
                    <div className="flex gap-3">
                      <img
                        src={
                          report.tinDang.hinhAnhTinDangs[0]?.hinhAnhUrl ||
                          "/placeholder.png"
                        }
                        alt=""
                        className="h-14 w-20 shrink-0 rounded object-cover"
                      />
                      <div>
                        <p className="line-clamp-2 font-semibold">
                          {report.tinDang.tieuDe}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Tin #{report.maTinDang} · Báo cáo #{report.maBaoCao}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">{report.nguoiBaoCao.hoTen}</td>
                  <td className="max-w-56 px-3 py-4">
                    <p className="line-clamp-3 whitespace-pre-wrap break-words">
                      {report.noiDung}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    {new Date(report.ngayBaoCao).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-xs ${report.trangThai === "CO_VI_PHAM" ? "border-red-200 bg-red-50 text-red-700" : report.trangThai === "KHONG_VI_PHAM" ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                    >
                      {reportStatuses[report.trangThai] ?? report.trangThai}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected(report.maBaoCao)}
                    >
                      Xem xét
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {current && !current.error && current.total > 0 && (
        <nav
          aria-label="Phân trang báo cáo"
          className="mt-6 flex items-center justify-center gap-4 text-sm"
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
