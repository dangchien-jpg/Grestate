import VerifiedBadge from "@/components/verify-post/verified-badge";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowRight,
  CheckCheck,
  FileSearch,
  Inbox,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  verificationLabels,
  verifyPostService,
  type PendingVerification,
} from "@/services/verifyPostService";
import { dateTime, errorMessage, reviewPath } from "./review-utils";

const fold = (s: string) =>
  s
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

export default function VerificationQueue() {
  const [params] = useSearchParams();
  const tab = params.get("tab");
  const status = tab === "DA_XAC_THUC" || tab === "TU_CHOI" ? tab : "CHO_XU_LY";
  return <QueueList key={status} status={status} />;
}

function QueueList({ status }: { status: keyof typeof verificationLabels }) {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const newest = params.get("sort") === "new";
  const [rows, setRows] = useState<PendingVerification[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    verifyPostService
      .list(status, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setRows(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision, status]);
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  function refresh() {
    setError("");
    setLoading(true);
    setRevision((n) => n + 1);
  }
  const search = fold(query.trim()).replace(/^#/, "");
  const matches = rows.filter((item) =>
    [
      String(item.maYeuCau),
      String(item.maTinDang),
      item.tinDang.tieuDe,
      item.nguoiYeuCau.hoTen,
    ].some((text) => fold(text).includes(search)),
  );
  if (newest) matches.reverse();
  return (
    <section className="overflow-hidden rounded-sm bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ccc] p-4 sm:p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-sm bg-blue-50 text-primary">
            <Inbox size={22} />
          </span>
          <div>
            <h2 className="text-lg font-bold ">Hồ sơ xác thực tin đăng</h2>
            <p role="status" className="text-sm ">
              {loading
                ? "Đang tải hồ sơ…"
                : error
                  ? "Chưa cập nhật được danh sách"
                  : rows.length + " hồ sơ · " + verificationLabels[status]}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="h-10 bg-white border-[#ccc]"
          disabled={loading}
          onClick={refresh}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Làm mới
        </Button>
      </div>
      <nav
        aria-label="Trạng thái xác thực"
        className="flex flex-wrap gap-2 border-b border-[#ccc] px-4 py-3 sm:px-6"
      >
        {Object.entries(verificationLabels).map(([key, label]) => (
          <Button
            key={key}
            variant={status === key ? "default" : "outline"}
            aria-pressed={status === key}
            onClick={() => update("tab", key)}
            className="rounded-sm border border-[#ccc]"
          >
            {label}
          </Button>
        ))}
      </nav>
      <div className="flex flex-wrap gap-3 p-4 sm:px-6">
        <div className="relative min-w-[180px] flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-3 "
          />
          <Input
            className="h-10 pl-10"
            aria-label="Tìm hồ sơ"
            placeholder="Tên tin, người gửi hoặc mã hồ sơ…"
            value={query}
            onChange={(e) => update("q", e.target.value)}
          />
        </div>
        <Select
          value={newest ? "new" : "old"}
          items={{ old: "Chờ lâu nhất", new: "Mới gửi nhất" }}
          onValueChange={(v) => update("sort", v === "new" ? "new" : "")}
        >
          <SelectTrigger
            aria-label="Thứ tự hồ sơ"
            className="h-10 w-40 rounded-sm px-3"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="old">Chờ lâu nhất</SelectItem>
            <SelectItem value="new">Mới gửi nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && (
        <p
          role="alert"
          className="mx-4 mb-4 rounded-sm bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {loading && !rows.length ? (
        <div aria-hidden="true" className="space-y-3 px-6 pb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-sm bg-slate-100 motion-safe:animate-pulse"
            />
          ))}
        </div>
      ) : matches.length ? (
        <>
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(100px,1fr)_145px_80px] gap-4 border-y bg-[#eee] px-6 py-3 text-xs font-semibold  lg:grid">
            <span>Tin đăng</span>
            <span>Người gửi</span>
            <span>Ngày gửi</span>
            <span className="text-right">Xử lý</span>
          </div>
          <ul className="divide-y divide-slate-200">
            {matches.map((item) => (
              <li key={item.maYeuCau}>
                <Link
                  to={{
                    pathname: reviewPath + "/" + item.maYeuCau,
                    search: params.toString(),
                  }}
                  className="group grid items-center gap-2 px-4 py-4 hover:bg-[#eee]/30 focus-visible:outline-primary sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(100px,1fr)_145px_80px] lg:gap-4"
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold  group-hover:text-primary">
                      <VerifiedBadge verified={item.tinDang.daXacThuc} />
                      {item.tinDang.tieuDe}
                    </h3>
                    <p className="mt-1 text-sm ">
                      Pháp lý:{" "}
                      {item.minhChungs[0]?.giayTo?.tenGiayTo ??
                        "Chưa có thông tin"}
                    </p>
                  </div>
                  <span className="text-sm ">
                    <span className="lg:hidden">Người gửi: </span>
                    {item.nguoiYeuCau.hoTen}
                  </span>
                  <time dateTime={item.ngayGui} className="text-sm ">
                    {dateTime(item.ngayGui)}
                  </time>
                  <span className="flex items-center gap-1 text-sm font-semibold text-primary lg:justify-end">
                    {status === "CHO_XU_LY" ? "Xét duyệt" : "Chi tiết"}{" "}
                    <ArrowRight size={15} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {query && (
            <p className="border-t px-6 py-3 text-xs ">
              Hiển thị {matches.length}/{rows.length} hồ sơ
            </p>
          )}
        </>
      ) : (
        !error && (
          <div className="flex flex-col items-center gap-3 border-t p-10 text-center ">
            {rows.length ? <FileSearch size={30} /> : <CheckCheck size={30} />}
            <p>
              {rows.length
                ? "Không có hồ sơ khớp với từ khóa."
                : "Chưa có hồ sơ trong mục này."}
            </p>
            {!!query && (
              <Button variant="outline" onClick={() => update("q", "")}>
                Xóa tìm kiếm
              </Button>
            )}
          </div>
        )
      )}
    </section>
  );
}
