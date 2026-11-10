import { useEffect, useState } from "react";
import { Eye, ListChecks, LoaderCircle, MapPin } from "lucide-react";
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
    <section
      aria-label="Danh sách kiểm duyệt"
      className="m-4 rounded-sm bg-white p-4 font-sans sm:m-6 sm:p-6 lg:m-8"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Danh sách tin đăng</h2>
          <p className="mt-1 text-sm">
            {current && !current.error
              ? `${current.total} tin đăng`
              : "Quản lý và kiểm duyệt nội dung tin đăng"}
          </p>
        </div>
      </div>
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          aria-label="Trạng thái kiểm duyệt"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-sm border border-input bg-white px-3 text-sm"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(censorStatuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
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
        <div className="space-y-3">
          {current.posts.map((post) => (
            <article
              key={post.maTinDang}
              className="flex min-w-0 flex-col overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm sm:flex-row"
            >
              <button
                type="button"
                onClick={() => setSelected(post.maTinDang)}
                aria-label={`Xem xét tin ${post.tieuDe}`}
                className="relative block aspect-video w-full shrink-0 overflow-hidden bg-gray-100 sm:aspect-auto sm:w-44 lg:w-52"
              >
                <img
                  src={post.anhDaiDienUrl || "/placeholder.png"}
                  alt={post.tieuDe}
                  loading="lazy"
                  onError={(event) => {
                    if (!event.currentTarget.src.endsWith("/placeholder.png"))
                      event.currentTarget.src = "/placeholder.png";
                  }}
                  className="h-full w-full object-cover sm:absolute sm:inset-0"
                />
              </button>
              <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={` inline-flex w-fit rounded-sm border px-2 py-1 text-xs font-medium ${censorStatusClasses[post.trangThai] ?? "border-gray-200 bg-gray-50"}`}
                  >
                    {censorStatuses[post.trangThai] ?? post.trangThai}
                  </span>
                  <p className="text-[10px]">
                    Mã tin: {post.maTinDang} · {post.loaiBatDongSan.tenLoai}
                  </p>
                </div>
                <h3 className="mt-1.5 line-clamp-2 text-sm leading-5 font-bold wrap-break-word">
                  {post.tieuDe}
                </h3>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <strong className="text-red-600">
                    {formatPrice(post.giaNiemYet)}
                  </strong>
                  <span>{post.dienTich.toLocaleString("vi-VN")} m²</span>
                </div>
                <p className="mt-2 flex gap-1 text-xs leading-5">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span className="line-clamp-1">
                    {[
                      post.diaChiChiTiet,
                      post.phuongXa.tenPhuongXa,
                      post.phuongXa.tinhThanh.tenTinhThanh,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs">
                      Người đăng: {post.nguoiDang.hoTen}
                    </p>
                    <p className="mt-1 text-[10px]">
                      Ngày gửi:{" "}
                      {new Date(post.updatedAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(post.maTinDang)}
                    className=" inline-flex w-fit items-center justify-center self-end gap-2 rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Eye className="size-4" />
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {current && !current.error && current.total > 0 && (
        <nav
          aria-label="Phân trang"
          className="mt-6 flex items-center justify-center gap-4 text-sm"
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
