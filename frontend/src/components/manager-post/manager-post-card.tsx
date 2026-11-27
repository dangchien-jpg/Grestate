import PostReviewContent from "@/components/property/post-review-content";
import VerifyPostAction from "@/components/verify-post/verify-post-action";
import { getPostUrl } from "@/lib/post-url";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import Backdrop from "@/components/backdrop/backdrop";
import { isAxiosError } from "axios";
import {
  CircleCheck,
  Clock3,
  Layers,
  Shield,
  Images,
  ListChecks,
  LoaderCircle,
  Pencil,
  Trash2,
  ExternalLink,
  CalendarDays,
  Hash,
  MapPin,
  Ellipsis,
  Globe,
  GlobeOff,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { postService } from "@/services/postService";
import { useAuthStore } from "@/stores/authStore";
import { usePostStore } from "@/stores/postStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { formatPrice } from "@/lib/format-price";
import type { TinDangDanhSach, VerificationSummary } from "@/types/post";
import ManagerPostEditor from "./manager-post-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statuses: Record<string, { label: string; className: string }> = {
  DA_AN: {
    label: "Đã ẩn",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
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
const filters = [
  { key: "ALL", label: "Tất cả", matches: () => true },
  {
    key: "VERIFY",
    label: "Xác thực tin",
    matches: (post: TinDangDanhSach) => Boolean(post.daXacThuc || post.xacThuc),
  },
  {
    key: "LIVE",
    label: "Đang hiển thị",
    matches: (post: TinDangDanhSach) => post.trangThai === "DA_DUYET",
  },
  {
    key: "PENDING",
    label: "Chờ duyệt",
    matches: (post: TinDangDanhSach) => post.trangThai === "CHO_KIEM_DUYET",
  },
  {
    key: "REJECTED",
    label: "Từ chối duyệt",
    matches: (post: TinDangDanhSach) => post.trangThai === "TU_CHOI",
  },
  {
    key: "REMOVED",
    label: statuses.BI_GO.label,
    matches: (post: TinDangDanhSach) => post.trangThai === "BI_GO",
  },
  {
    key: "HIDDEN",
    label: statuses.DA_AN.label,
    matches: (post: TinDangDanhSach) => post.trangThai === "DA_AN",
  },
] as const;

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
  onVisibilityChange,
  onVerification,
  refresh,
  onEdit,
  onDelete,
}: {
  post: TinDangDanhSach;
  deleting: boolean;
  onVisibilityChange: () => void;
  onVerification: (result: VerificationSummary) => void;
  refresh: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = statuses[post.trangThai] ?? {
    label: "Trạng thái khác",
    className: "border-gray-400",
  };
  const address = [
    post.diaChiChiTiet,
    post.phuongXa.tenPhuongXa,
    post.phuongXa.tinhThanh.tenTinhThanh,
  ]
    .filter(Boolean)
    .join(", ");
  const [previewOpen, setPreviewOpen] = useState(false);
  function viewPost(content: React.ReactNode, className: string) {
    return post.trangThai === "DA_DUYET" ? (
      <Link to={getPostUrl(post)} className={className}>
        {content}
      </Link>
    ) : (
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setPreviewOpen(true)}
        className={className}
      >
        {content}
      </button>
    );
  }
  return (
    <article
      className="
        group flex flex-col gap-4 rounded-sm border border-slate-200 bg-card p-3.5
        text-card-foreground shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors
        duration-200 hover:border-slate-300 sm:flex-row sm:p-4
      "
    >
      <div
        aria-label={`Xem tin: ${post.tieuDe}`}
        className="
          relative block aspect-video shrink-0 self-start overflow-hidden rounded-md
          bg-slate-100 w-full sm:aspect-[4/3] sm:w-48 lg:w-56
        "
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
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span
          className="
            absolute right-2.5 bottom-2.5 inline-flex items-center gap-1.5 rounded
            bg-slate-950/70 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm
          "
        >
          <Images aria-hidden="true" className="size-3.5" />
          {post.hinhAnhTinDangs.length} ảnh
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={`
              inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]
              leading-none font-medium ${status.className}
            `}
          >
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full bg-current"
            />
            {status.label}
          </span>

          <VerifyPostAction
            post={post}
            onSubmitted={onVerification}
            onRefresh={refresh}
          />
        </div>
        <h2 className="text-lg leading-snug font-semibold tracking-[-0.015em] sm:text-lg">
          {viewPost(
            post.tieuDe,
            "line-clamp-2 text-left wrap-break-word rounded-sm focus-visible:ring-2 focus-visible:ring-primary",
          )}
        </h2>

        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <span className="text-xl leading-tight font-bold tracking-tight text-red-600">
            {formatPrice(post.giaNiemYet)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[16px]">
            {number.format(post.dienTich)} m²
          </span>
        </div>

        <div className="mt-2 flex items-start gap-1.5">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />

          <p className="line-clamp-2 text-[14px] leading-relaxed">{address}</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {createdDate(post.createdAt)}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Hash aria-hidden="true" className="size-3.5" />
            Mã tin: {post.maTinDang}
          </span>
        </div>
        {(post.trangThai === "BI_GO" || post.trangThai === "TU_CHOI") && (
          <p className="mt-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <strong>
              {post.trangThai === "BI_GO"
                ? "Lý do gỡ tin"
                : "Lý do từ chối duyệt"}
              :{" "}
            </strong>
            <span className="whitespace-pre-wrap wrap-anywhere">
              {post.lyDoKiemDuyet || "Chưa có lý do được ghi nhận."}
            </span>
          </p>
        )}
      </div>
      <div className="flex flex-col justify-between gap-3 pt-3 md:pt-0">
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm md:justify-end">
          <div className="flex gap-1"><dt>Quan tâm:</dt><dd className="font-semibold tabular-nums">{post.soLuotLuu ?? 0}</dd></div>
          <div className="flex gap-1"><dt>Khách hàng:</dt><dd className="font-semibold tabular-nums">{post.soKhachHang ?? 0}</dd></div>
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2  pt-3">
          {viewPost(
            <>
              <ExternalLink aria-hidden="true" className="size-3.5" /> Xem tin
            </>,
            "inline-flex items-center gap-1.5 rounded-sm text-xs font-medium hover:text-primary focus-visible:ring-2 focus-visible:ring-primary",
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              disabled={deleting}
              aria-label={`Chỉnh sửa tin: ${post.tieuDe}`}
              title="Chỉnh sửa tin đăng"
              className="
                  inline-flex h-9 items-center justify-center gap-2 rounded-sm 
                   bg-card px-3 text-xs font-medium text-primary
                  transition-colors  outline-none
                  focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed
                  disabled:opacity-50 cursor-pointer
                "
            >
              <Pencil aria-hidden="true" className="size-3.5" />
              Chỉnh sửa
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Ellipsis className="" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {(post.trangThai === "DA_DUYET" ||
                    post.trangThai === "DA_AN") && (
                    <DropdownMenuItem
                      className="bg-white text-sm"
                      onClick={onVisibilityChange}
                      disabled={deleting}
                    >
                      {post.trangThai === "DA_AN" ? (
                        <>
                          <Globe aria-hidden="true" className="size-4" /> Bỏ ẩn
                          tin đăng
                        </>
                      ) : (
                        <>
                          <GlobeOff aria-hidden="true" className="size-4" /> Ẩn
                          tin đăng
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="bg-white text-sm text-destructive"
                    onClick={onDelete}
                    disabled={deleting}
                    aria-busy={deleting}
                    aria-label={`Xóa tin: ${post.tieuDe}`}
                  >
                    <Trash2 aria-hidden="true" className="size-4" /> Xóa tin
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {previewOpen && post.trangThai !== "DA_DUYET" && (
        <Dialog.Root open onOpenChange={setPreviewOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop render={<Backdrop />} />
            <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sm border bg-white p-5 shadow-lg sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <Dialog.Title className="text-lg font-bold">
                  Xem trước tin đăng · #{post.maTinDang}
                </Dialog.Title>
                <Dialog.Close className="rounded-sm border px-3 py-1 text-sm">
                  Đóng
                </Dialog.Close>
              </div>
              <PostReviewContent post={post} />
              {(post.trangThai === "BI_GO" || post.trangThai === "TU_CHOI") && (
                <p className="mt-4 whitespace-pre-wrap wrap-anywhere text-sm text-red-800">
                  <strong>
                    {post.trangThai === "BI_GO"
                      ? "Lý do gỡ tin"
                      : "Lý do từ chối duyệt"}
                    :{" "}
                  </strong>
                  {post.lyDoKiemDuyet || "Chưa có lý do được ghi nhận."}
                </p>
              )}
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
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
  const [status, setStatus] = useState<(typeof filters)[number]["key"]>("ALL");
  const [order, setOrder] = useState("newest");
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
  const groups = filters.map((filter) => ({
    ...filter,
    posts: posts.filter(filter.matches),
  }));
  const visiblePosts = (
    groups.find((group) => group.key === status)?.posts ?? []
  ).sort((a, b) => {
    const byDate =
      Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
      b.maTinDang - a.maTinDang;
    return order === "newest" ? byDate : -byDate;
  });
  const summary = [
    {
      label: "Tổng tin đăng",
      count: posts.length,
      icon: Layers,
      description: "Tất cả tin đăng của bạn",
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Đang hiển thị",
      count: groups.find((group) => group.key === "LIVE")?.posts.length ?? 0,
      icon: CircleCheck,
      description: "Tin đăng hoạt động",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Chờ duyệt",
      count: groups.find((group) => group.key === "PENDING")?.posts.length ?? 0,
      icon: Clock3,
      description: "Đang chờ kiểm duyệt",
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Chờ xác thực",
      icon: Shield,
      description: "Hồ sơ đang chờ xác thực",
      color: "bg-violet-50 text-violet-700",
      count: posts.filter((post) => post.xacThuc?.trangThai === "CHO_XU_LY")
        .length,
    },
  ];
  const hasCounts = !loading && !current?.error;

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
              post.maTinDang === updated.maTinDang ? { ...post, ...updated } : post,
            ),
          }
        : state,
    );
    usePostStore.setState((state) => ({
      posts: state.posts.map((post) =>
        post.maTinDang === updated.maTinDang ? updated : post,
      ),
      post:
        state.post?.maTinDang === updated.maTinDang
          ? {
              ...updated,
              nguoiDang: { ...state.post.nguoiDang, ...updated.nguoiDang },
            }
          : state.post,
    }));
  }

  async function changeVisibility(post: TinDangDanhSach) {
    const id = post.maTinDang;
    if (pending.current.has(id)) return;
    const hide = post.trangThai === "DA_DUYET";
    if (!hide && post.trangThai !== "DA_AN") return;
    pending.current.add(id);
    setDeletingIds([...pending.current]);
    try {
      if (hide) await postService.hidePost(id);
      else await postService.unHidePost(id);
      if (useAuthStore.getState().user?.maNguoiDung !== post.maNguoiDung)
        return;

      setRequest((state) =>
        state?.userId === post.maNguoiDung
          ? {
              ...state,
              posts: state.posts.map((item) =>
                item.maTinDang === id
                  ? { ...item, trangThai: hide ? "DA_AN" : "DA_DUYET" }
                  : item,
              ),
            }
          : state,
      );
      if (hide) {
        usePostStore.setState((state) => ({
          posts: state.posts.filter((item) => item.maTinDang !== id),
          post: state.post?.maTinDang === id ? null : state.post,
        }));
      }
      useFavoriteStore.setState({ loaded: false });
      toast.success(hide ? "Đã ẩn tin đăng" : "Tin đăng đã hiển thị trở lại");
    } catch (error) {
      if (useAuthStore.getState().user?.maNguoiDung !== post.maNguoiDung)
        return;
      toast.error(
        message(error, "Không thể thay đổi trạng thái hiển thị của tin"),
      );
    } finally {
      pending.current.delete(id);
      setDeletingIds([...pending.current]);
      setRetry((value) => value + 1);
    }
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
      <dl className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map(({ label, count, icon: Icon, description, color }) => (
          <div
            key={label}
            className="relative rounded-sm shadow-sm bg-card p-3 sm:p-4"
          >
            <dt className="pr-9 text-sm font-medium">
              {label}
              <span
                className={`absolute right-3 top-3 grid size-8 place-items-center rounded-sm sm:right-4 sm:top-4 ${color}`}
              >
                <Icon aria-hidden="true" className="size-4" />
              </span>
            </dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">
              {hasCounts ? count : "—"}
              <span className="mt-2 block text-xs font-normal leading-5 ">
                {description}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="bg-white rounded-sm px-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Lọc tin theo trạng thái"
            className="flex max-w-full gap-1.5 overflow-x-auto py-1"
          >
            {groups.map((group) => (
              <button
                key={group.key}
                type="button"
                aria-pressed={status === group.key}
                onClick={() => setStatus(group.key)}
                className={`shrink-0  px-3 py-2 text-sm   ${status === group.key ? "border-b-3 border-primary " : "border-border bg-card "}`}
              >
                {group.label} {hasCounts && `(${group.posts.length})`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end min-w-0 flex-wrap gap-2">
          <select
            aria-label="Sắp xếp theo ngày tạo"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            className="h-10 rounded-sm shadow-sm bg-card px-3 text-sm"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
        {loading ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 rounded-sm border  bg-card py-16 text-sm "
          >
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            Đang tải danh sách tin đăng...
          </div>
        ) : current?.error ? (
          <div
            role="alert"
            className="rounded-sm border border-red-200 bg-card p-5 text-sm"
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
          <div className="rounded-sm border border-dashed border-input bg-card px-4 py-16 text-center">
            <ListChecks
              aria-hidden="true"
              className="mx-auto mb-3 size-9 text-primary"
            />
            <h2 className="text-sm font-semibold">
              {posts.length === 0
                ? "Bạn chưa có tin đăng nào"
                : "Không tìm thấy tin phù hợp với bộ lọc"}
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
          <div className="space-y-4">
            {visiblePosts.map((post) => (
              <PostCard
                key={post.maTinDang}
                post={post}
                deleting={deletingIds.includes(post.maTinDang)}
                refresh={() => setRetry((n) => n + 1)}
                onVerification={(result) =>
                  setRequest((state) =>
                    state?.userId === post.maNguoiDung
                      ? {
                          ...state,
                          posts: state.posts.map((item) =>
                            item.maTinDang === post.maTinDang
                              ? { ...item, xacThuc: result }
                              : item,
                          ),
                        }
                      : state,
                  )
                }
                onVisibilityChange={() => void changeVisibility(post)}
                onEdit={() => setEditing(post)}
                onDelete={() => {
                  setDeleteTarget(post);
                }}
              />
            ))}
          </div>
        )}
      </div>
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
