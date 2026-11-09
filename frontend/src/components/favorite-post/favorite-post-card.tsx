import {
  Bath,
  BedDouble,
  Heart,
  Images,
  LoaderCircle,
  MapPin,
} from "lucide-react";
import { Link } from "react-router";
import { formatPrice } from "@/lib/format-price";
import type { FavoritePost } from "@/types/favorite-post";

const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

function postedDate(value: string | null) {
  if (!value) return "Ngày đăng đang cập nhật";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Ngày đăng đang cập nhật";
  return date.format(parsed) === date.format(new Date())
    ? "Đăng hôm nay"
    : `Đăng ngày ${date.format(parsed)}`;
}

export default function FavoritePostCard({
  post,
  onRemove,
  removing = false,
}: {
  post: FavoritePost;
  onRemove: (id: number) => void;
  removing?: boolean;
}) {
  const detailUrl = `/detail/${post.maTinDang}`;
  const location = [
    post.phuongXa.tenPhuongXa,
    post.phuongXa.tinhThanh.tenTinhThanh,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col overflow-hidden rounded-sm border border-slate-200 bg-white font-sans text-slate-950 shadow-sm sm:flex-row">
      <Link
        to={detailUrl}
        aria-label={`Xem tin: ${post.tieuDe}`}
        className="relative block aspect-[4/3] shrink-0 overflow-hidden bg-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:aspect-auto sm:w-64 lg:w-72"
      >
        <img
          key={post.anhDaiDienUrl}
          src={post.anhDaiDienUrl || "/placeholder.png"}
          alt={post.tieuDe}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith("/placeholder.png")) {
              event.currentTarget.src = "/placeholder.png";
            }
          }}
          className="h-full w-full object-cover sm:absolute sm:inset-0"
        />
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-md bg-slate-900/70 px-2 py-1 text-xs font-medium text-white">
          <Images aria-hidden="true" className="size-4" />
          <span>{post.soHinhAnh} ảnh</span>
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:min-h-56 sm:p-5 lg:p-6">
        <h2 className="wrap-break-word text-lg leading-7 font-bold tracking-tight text-slate-900">
          <Link
            to={detailUrl}
            className="line-clamp-2 rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
          >
            {post.tieuDe}
          </Link>
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span className="text-lg font-bold text-red-600">
            {formatPrice(post.giaNiemYet)}
          </span>
          <span>{number.format(post.dienTich)} m²</span>
          {post.soPhongNgu !== null && (
            <span
              className="inline-flex items-center gap-1"
              aria-label={`${post.soPhongNgu} phòng ngủ`}
            >
              {post.soPhongNgu}
              <BedDouble aria-hidden="true" className="size-3.5" />
            </span>
          )}
          {post.soPhongTam !== null && (
            <span
              className="inline-flex items-center gap-1"
              aria-label={`${post.soPhongTam} phòng tắm`}
            >
              {post.soPhongTam}
              <Bath aria-hidden="true" className="size-3.5" />
            </span>
          )}
        </div>

        <p
          className="mt-3 flex items-start gap-1 text-xs leading-relaxed text-muted-foreground"
          title={[post.diaChiChiTiet, location].filter(Boolean).join(", ")}
        >
          <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span className="line-clamp-2">{location || post.diaChiChiTiet}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="text-[10px] text-muted-foreground">
            {postedDate(post.ngayDang)}
          </span>
          <button
            type="button"
            disabled={removing}
            aria-label={`Bỏ lưu tin: ${post.tieuDe}`}
            aria-busy={removing}
            title="Bỏ lưu tin"
            onClick={() => onRemove(post.maTinDang)}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-slate-200 bg-white text-red-500 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {removing ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
            ) : (
              <Heart aria-hidden="true" className="size-5 fill-current" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
