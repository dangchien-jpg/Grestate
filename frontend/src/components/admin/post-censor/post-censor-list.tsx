import QueueToolbar from "../queue-toolbar";
import VerifiedBadge from "@/components/verify-post/verified-badge";
import { useEffect, useState } from "react";
import { ArrowRight, ListChecks, LoaderCircle } from "lucide-react";
import {
  adminCensorService,
  censorError,
  censorStatuses,
  censorStatusClasses,
} from "@/services/adminCensorService";
import type { TinDangDanhSach } from "@/types/post";
import { formatPrice } from "@/lib/format-price";
import PostCensorDetail from "./post-censor-detail";

export default function PostCensorList() {
  const [status, setStatus] = useState("CHO_KIEM_DUYET");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{
    key: string;
    posts: TinDangDanhSach[];
    total: number;
    error: string;
  } | null>(null);
  const key = JSON.stringify([status, page, revision]);
  const current = result?.key === key ? result : null;
  useEffect(() => {
    const controller = new AbortController();
    adminCensorService
      .list({ status, page }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ ...data, key, error: "" });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setResult({ key, posts: [], total: 0, error: censorError(error) });
      });
    return () => controller.abort();
  }, [status, page, revision, key]);
  const pages = Math.max(1, Math.ceil((current?.total ?? 0) / 9));
  return (
    <section className="overflow-hidden rounded-sm bg-white shadow-sm">
      <QueueToolbar
        icon={ListChecks}
        title="Kiểm duyệt tin đăng"
        summary={!current ? "Đang tải…" : current.error ? "Chưa cập nhật được danh sách" : `${current.total} tin đăng · ${censorStatuses[status] ?? "Tất cả"}`}
        statuses={censorStatuses}
        status={status}
        loading={!current}
        onRefresh={() => setRevision(value => value + 1)}
        onStatus={value => { setStatus(value); setPage(1); }}
      />
      {!current ? (
        <p
          role="status"
          className="flex items-center justify-center gap-2 py-16 text-sm"
        >
          <LoaderCircle className="size-5 animate-spin" />
          Đang tải tin đăng...
        </p>
      ) : current.error ? (
        <div
          role="alert"
          className="rounded-sm border border-red-200 bg-white p-5 text-sm text-red-600"
        >
          {current.error}
          <button
            type="button"
            onClick={() => setRevision((v) => v + 1)}
            className="ml-3 underline"
          >
            Thử lại
          </button>
        </div>
      ) : current.posts.length === 0 ? (
        <div className="rounded-sm border border-dashed border-gray-300 bg-white py-16 text-center">
          <ListChecks className="mx-auto mb-3 size-8" />
          <p>Không có tin đăng phù hợp.</p>
          {page > 1 && (
            <button
              type="button"
              onClick={() => setPage(1)}
              className="mt-3 text-sm underline"
            >
              Về trang đầu
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="hidden lg:grid-cols-[minmax(0,2fr)_minmax(100px,1fr)_145px_90px] gap-4 border-y bg-[#eee] px-6 py-3 text-xs font-semibold lg:grid">
            <span>Tin đăng</span><span>Người đăng</span><span>Ngày gửi</span><span className="text-right">Xử lý</span>
          </div>
          <ul className="divide-y divide-slate-200">
            {current.posts.map((post) => (
              <li key={post.maTinDang}>
                <button type="button" onClick={() => setSelected(post.maTinDang)}
                  className="group grid w-full items-center gap-2 px-4 py-4 text-left hover:bg-[#eee]/30 focus-visible:outline-primary sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(100px,1fr)_145px_90px] lg:gap-4">
                  <span className="flex min-w-0 items-start gap-3">
                    <img src={post.anhDaiDienUrl || "/placeholder.png"} alt="" loading="lazy" className="h-14 w-20 shrink-0 rounded-sm bg-slate-100 object-cover" />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-semibold group-hover:text-primary"><VerifiedBadge verified={post.daXacThuc} />{post.tieuDe}</span>
                      <span className="block mt-1 text-xs text-muted-foreground">Tin #{post.maTinDang} · {post.loaiBatDongSan.tenLoai}</span>
                    <span className="block mt-1 text-sm">{formatPrice(post.giaNiemYet)} · {post.dienTich.toLocaleString("vi-VN")} m²</span>
                    <span className="block line-clamp-1 text-xs">{[post.diaChiChiTiet, post.phuongXa.tenPhuongXa, post.phuongXa.tinhThanh.tenTinhThanh].filter(Boolean).join(", ")}</span>
                    <span className={`mt-1 inline-flex rounded-sm border px-2 py-0.5 text-xs ${censorStatusClasses[post.trangThai] ?? ""}`}>{censorStatuses[post.trangThai] ?? post.trangThai}</span>
                    </span>
                  </span>
                  <span className="text-sm"><span className="lg:hidden">Người đăng: </span>{post.nguoiDang.hoTen}</span>
                  <time dateTime={post.updatedAt} className="text-sm">{new Date(post.updatedAt).toLocaleDateString("vi-VN")}</time>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary lg:justify-end">Chi tiết <ArrowRight size={15} /></span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {current && !current.error && current.total > 0 && (
        <nav
          aria-label="Phân trang"
          className="flex items-center justify-center gap-4 border-t p-4 text-sm"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((v) => v - 1)}
            className="rounded-sm border border-gray-300 bg-white px-3 py-2 disabled:opacity-40"
          >
            Trước
          </button>
          <span>
            Trang {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((v) => v + 1)}
            className="rounded-sm border border-gray-300 bg-white px-3 py-2 disabled:opacity-40"
          >
            Sau
          </button>
        </nav>
      )}
      {selected !== null && (
        <PostCensorDetail
          key={selected}
          id={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            setSelected(null);
            setRevision((v) => v + 1);
          }}
        />
      )}
    </section>
  );
}
