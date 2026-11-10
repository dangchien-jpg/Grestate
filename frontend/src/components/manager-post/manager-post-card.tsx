import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import Backdrop from "@/components/backdrop/backdrop";
import { isAxiosError } from "axios";
import {
  Bath,
  BedDouble,
  Images,
  LandPlot,
  ListChecks,
  LoaderCircle,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { postService } from "@/services/postService";
import { useAuthStore } from "@/stores/authStore";
import { usePostStore } from "@/stores/postStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { formatPrice } from "@/lib/format-price";
import type { TinDangDanhSach } from "@/types/post";
import ManagerPostEditor from "./manager-post-editor";

const statuses: Record<string, { label: string; className: string }> = {
  DA_DUYET: {
    label: "Đã duyệt",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  CHO_KIEM_DUYET: {
    label: "Chưa duyệt",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  BI_GO: {
    label: "Vi phạm",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  TU_CHOI: {
    label: "Đã từ chối",
    className: "border-red-200 bg-red-50 text-red-600",
  },
};
const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

function createdDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Ngày tạo đang cập nhật"
    : `Ngày tạo: ${date.format(parsed)}`;
}

function message(error: unknown, fallback: string) {
  return isAxiosError(error) &&
    typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : fallback;
}

function PostCard({
  post,
  deleting,
  onEdit,
  onDelete,
}: {
  post: TinDangDanhSach;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = statuses[post.trangThai] ?? {
    label: "Trạng thái khác",
    className: "border-gray-400 bg-slate-50 ",
  };
  const address = [
    post.diaChiChiTiet,
    post.phuongXa.tenPhuongXa,
    post.phuongXa.tinhThanh.tenTinhThanh,
  ]
    .filter(Boolean)
    .join(", ");
  const detailUrl = `/detail/${post.maTinDang}`;
  return (
    <article className="flex flex-col overflow-hidden rounded-sm border  bg-white font-sans shadow-sm sm:flex-row">
      <Link
        to={detailUrl}
        aria-label={`Xem tin: ${post.tieuDe}`}
        className="relative block aspect-[4/3] shrink-0 overflow-hidden bg-slate-100 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary sm:aspect-auto sm:w-52 lg:w-64"
      >
        <img
          src={post.anhDaiDienUrl || "/placeholder.png"}
          alt={post.tieuDe}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith("/placeholder.png"))
              event.currentTarget.src = "/placeholder.png";
          }}
          className="h-full w-full object-cover sm:absolute sm:inset-0"
        />
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-sm bg-slate-900/70 px-2 py-1 text-xs font-medium text-white">
          <Images aria-hidden="true" className="size-4" />
          {post.hinhAnhTinDangs.length} ảnh
        </span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:min-h-56 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-sm border px-2 py-1 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
          <span className="text-[10px] ">Mã tin: {post.maTinDang}</span>
        </div>
        <h2 className="wrap-break-word text-sm leading-7 font-bold tracking-tight ">
          <Link
            to={detailUrl}
            className="line-clamp-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {post.tieuDe}
          </Link>
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span className="text-lg font-bold text-red-600">
            {formatPrice(post.giaNiemYet)}
          </span>
          <span className="inline-flex items-center gap-1">
            <LandPlot aria-hidden="true" className="size-3.5" />
            {number.format(post.dienTich)} m²
          </span>
          {post.soPhongNgu !== null && (
            <span
              className="inline-flex items-center gap-1"
              aria-label={`${post.soPhongNgu} phòng ngủ`}
            >
              <BedDouble aria-hidden="true" className="size-3.5" />
              {post.soPhongNgu} PN
            </span>
          )}
          {post.soPhongTam !== null && (
            <span
              className="inline-flex items-center gap-1"
              aria-label={`${post.soPhongTam} phòng tắm`}
            >
              <Bath aria-hidden="true" className="size-3.5" />
              {post.soPhongTam} WC
            </span>
          )}
        </div>
        <p
          title={address}
          className="mt-3 flex items-start gap-1 text-xs leading-relaxed "
        >
          <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span className="line-clamp-2">{address}</span>
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <span className="text-[10px] ">{createdDate(post.createdAt)}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              disabled={deleting}
              aria-label={`Chỉnh sửa tin: ${post.tieuDe}`}
              title="Chỉnh sửa tin đăng"
              className="inline-flex size-9 items-center justify-center rounded-sm border border-gray-400 bg-white text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <Pencil aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-busy={deleting}
              aria-label={`Xóa tin: ${post.tieuDe}`}
              title="Xóa tin đăng"
              className="inline-flex size-9 items-center justify-center rounded-sm border border-gray-400 bg-white text-red-600 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {deleting ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <Trash2 aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ManagerPostCard() {
  const userId = useAuthStore((state) => state.user?.maNguoiDung);
  const [request, setRequest] = useState<{
    userId: number;
    posts: TinDangDanhSach[];
    error: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const [status, setStatus] = useState("ALL");
  const [editing, setEditing] = useState<TinDangDanhSach | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TinDangDanhSach | null>(
    null,
  );
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const pending = useRef(new Set<number>());
  const current = request?.userId === userId ? request : null;
  const posts = current?.posts ?? [];
  const loading = !current;
  const visiblePosts =
    status === "ALL"
      ? posts
      : posts.filter((post) => post.trangThai === status);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    postService
      .fetchPostsByUser(controller.signal)
      .then(({ posts }) => {
        if (!controller.signal.aborted)
          setRequest({ userId, posts, error: "" });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setRequest({
            userId,
            posts: [],
            error: message(error, "Không thể tải tin đăng. Vui lòng thử lại."),
          });
      });
    return () => controller.abort();
  }, [userId, retry]);

  function onUpdated(updated: TinDangDanhSach) {
    if (useAuthStore.getState().user?.maNguoiDung !== updated.maNguoiDung)
      return;
    setRequest((state) =>
      state
        ? {
            ...state,
            posts: state.posts.map((post) =>
              post.maTinDang === updated.maTinDang ? updated : post,
            ),
          }
        : state,
    );
    usePostStore.setState((state) => ({
      posts: state.posts.map((post) =>
        post.maTinDang === updated.maTinDang ? updated : post,
      ),
      post: state.post?.maTinDang === updated.maTinDang ? updated : state.post,
    }));
  }

  async function remove(post: TinDangDanhSach) {
    const id = post.maTinDang;
    if (pending.current.has(id)) return;
    pending.current.add(id);
    setDeletingIds([...pending.current]);
    try {
      await postService.deletePost(id);
      if (useAuthStore.getState().user?.maNguoiDung !== post.maNguoiDung)
        return;
      setRequest((state) =>
        state
          ? {
              ...state,
              posts: state.posts.filter((item) => item.maTinDang !== id),
            }
          : state,
      );
      usePostStore.setState((state) => ({
        posts: state.posts.filter((item) => item.maTinDang !== id),
        post: state.post?.maTinDang === id ? null : state.post,
      }));
      useFavoriteStore.setState((state) => ({
        posts: state.posts.filter((item) => item.maTinDang !== id),
      }));
      setDeleteTarget(null);
      toast.success("Đã xóa tin đăng");
    } catch (error) {
      toast.error(message(error, "Không thể xóa tin đăng. Vui lòng thử lại."));
    } finally {
      pending.current.delete(id);
      setDeletingIds([...pending.current]);
    }
  }

  return (
    <section
      aria-label="Danh sách tin đăng của bạn"
      className="mx-auto max-w-6xl p-4 font-sans sm:p-6 lg:p-8"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm ">
          {loading ? (
            "Đang tải tin đăng..."
          ) : (
            <>
              Tổng số <strong className="">{posts.length}</strong> tin đăng
              {status !== "ALL" && ` · Hiển thị ${visiblePosts.length} tin`}
            </>
          )}
        </p>
        <label className="flex items-center gap-2 text-sm ">
          Trạng thái
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 min-w-40 rounded-sm border border-input bg-white px-3 font-sans text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">Tất cả</option>
            <option value="DA_DUYET">Đã duyệt</option>
            <option value="CHO_KIEM_DUYET">Chưa duyệt</option>
            <option value="TU_CHOI">Đã từ chối</option>
            <option value="BI_GO">Vi phạm</option>
          </select>
        </label>
      </div>
      {loading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-sm border border-gray-400 bg-white py-16 text-sm "
        >
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
          Đang tải danh sách tin đăng...
        </div>
      ) : current?.error ? (
        <div
          role="alert"
          className="rounded-sm border border-red-200 bg-white p-5 text-sm"
        >
          <p className="text-red-600">{current.error}</p>
          <button
            type="button"
            onClick={() => {
              setRequest(null);
              setRetry((value) => value + 1);
            }}
            className="mt-3 rounded-sm border border-gray-400 px-4 py-2"
          >
            Thử lại
          </button>
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="rounded-sm border border-dashed border-gray-400 bg-white px-4 py-16 text-center">
          <ListChecks aria-hidden="true" className="mx-auto mb-3 size-9 " />
          <h2 className="text-sm font-semibold">
            {posts.length === 0
              ? "Bạn chưa có tin đăng nào"
              : "Không có tin đăng thuộc trạng thái này"}
          </h2>
          {posts.length === 0 ? (
            <Link
              to="/me/create-post"
              className="mt-4 inline-flex rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Đăng tin đầu tiên
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStatus("ALL")}
              className="mt-4 rounded-sm border border-gray-400 px-4 py-2 text-sm"
            >
              Xem tất cả tin đăng
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.maTinDang}
              post={post}
              deleting={deletingIds.includes(post.maTinDang)}
              onEdit={() => setEditing(post)}
              onDelete={() => {
                setDeleteTarget(post);
              }}
            />
          ))}
        </div>
      )}
      {deleteTarget && deleteTarget.maNguoiDung === userId && (
        <Dialog.Root
          open
          onOpenChange={(open) => {
            if (!open && !pending.current.has(deleteTarget.maTinDang))
              setDeleteTarget(null);
          }}
        >
          <Dialog.Portal>
            <Dialog.Backdrop render={<Backdrop />} />
            <Dialog.Popup
              initialFocus={cancelDeleteRef}
              aria-busy={deletingIds.includes(deleteTarget.maTinDang)}
              className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sm border border-gray-400 bg-white p-5 font-sans shadow-lg outline-none sm:p-6"
            >
              <Dialog.Title className="text-lg font-bold">
                Xác nhận xóa tin đăng
              </Dialog.Title>
              <Dialog.Description className="mt-3 text-sm leading-relaxed  wrap-break-word">
                Bạn có chắc muốn xóa tin “{deleteTarget.tieuDe}”? Thao tác này
                không thể hoàn tác.
              </Dialog.Description>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  ref={cancelDeleteRef}
                  type="button"
                  disabled={deletingIds.includes(deleteTarget.maTinDang)}
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-sm border border-gray-400 px-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={deletingIds.includes(deleteTarget.maTinDang)}
                  onClick={() => void remove(deleteTarget)}
                  className="inline-flex items-center gap-2 rounded-sm bg-red-600 px-4 py-2 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  {deletingIds.includes(deleteTarget.maTinDang) && (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  )}
                  {deletingIds.includes(deleteTarget.maTinDang)
                    ? "Đang xóa..."
                    : "Xóa tin"}
                </button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
      {editing && editing.maNguoiDung === userId && (
        <ManagerPostEditor
          key={editing.maTinDang}
          post={editing}
          onClose={() => setEditing(null)}
          onUpdated={onUpdated}
        />
      )}
    </section>
  );
}
