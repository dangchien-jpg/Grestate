import VerifiedBadge from "@/components/verify-post/verified-badge";
import { useState } from "react";
import { Bath, BedDouble, Images, LandPlot, MapPin } from "lucide-react";
import ContactPhoneButton from "@/components/contact/contact-phone-button";
import { Link } from "react-router";
import FavoriteButton from "@/components/favorite-post/favorite-button";
import { getPostUrl } from "@/lib/post-url";
import { formatPrice } from "@/lib/format-price";
import type { TinDangDanhSach } from "@/types/post";
import SafeImage from "./safe-image";
import { formatDate, numberFormat } from "../../types/format";

export default function DetailedCard({ post }: { post: TinDangDanhSach }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const photos = [
    ...new Set(
      [
        post.anhDaiDienUrl,
        ...post.hinhAnhTinDangs.map((i) => i.hinhAnhUrl),
      ].filter((src): src is string => !!src),
    ),
  ];
  const thumbnails = photos.length ? photos.slice(0, 4) : ["/placeholder.png"];
  const layouts = [
    "grid-cols-1",
    "grid-cols-1 grid-rows-2",
    "grid-cols-[3fr_2fr] grid-rows-2",
    "grid-cols-2 grid-rows-2",
  ];
  const url = getPostUrl(post);
  const name = post.nguoiDang.hoTen?.trim() || "Người đăng";
  return (
    <article className="grid overflow-hidden rounded-sm border bg-white shadow-sm md:grid-cols-[clamp(230px,25vw,320px)_minmax(0,1fr)]">
      <div className="relative min-h-40 overflow-hidden bg-slate-100 md:min-h-full">
        <Link
          to={url}
          aria-label={post.tieuDe}
          className={`absolute inset-0 grid gap-0.5 bg-white hover: ${layouts[thumbnails.length - 1]}`}
        >
          {thumbnails.map((src, index) => (
            <div
              key={src}
              className={`relative min-h-0 min-w-0 overflow-hidden ${thumbnails.length === 3 && index === 0 ? "row-span-2" : ""}`}
            >
              <SafeImage src={src} alt="" />
              {index === 3 && photos.length > 4 && (
                <span className="absolute inset-0 grid place-items-center bg-black/45 font-semibold text-white">
                  +{photos.length - 4}
                </span>
              )}
            </div>
          ))}
        </Link>
        <FavoriteButton
          post={post}
          className="absolute right-2 top-2 size-8 rounded-sm bg-white shadow"
        />
        {!!photos.length && (
          <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-sm bg-black/70 px-2 py-1 text-xs text-white">
            <Images size={14} />
            {photos.length} ảnh
          </span>
        )}
      </div>
      <div className="min-w-0 px-4 py-3">
        <Link to={url}>
          <h2 className="line-clamp-2 font-bold leading-snug hover:text-primary">
            <VerifiedBadge verified={post.daXacThuc} />
            {post.tieuDe}
          </h2>
        </Link>
        <div className="my-2 flex flex-wrap items-baseline gap-x-3">
          <strong className="text-lg text-red-600">
            {formatPrice(post.giaNiemYet)}
          </strong>
          {post.dienTich > 0 && post.giaNiemYet > 0 && (
            <span className="text-sm text-red-600">
              ~{numberFormat.format(post.giaNiemYet / post.dienTich / 1e6)}{" "}
              triệu/m²
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm ">
          <span className="flex items-center gap-1">
            <LandPlot size={15} />
            {numberFormat.format(post.dienTich)} m²
          </span>
          {post.soPhongNgu != null && (
            <span className="flex items-center gap-1">
              <BedDouble size={15} />
              {post.soPhongNgu} PN
            </span>
          )}
          {post.soPhongTam != null && (
            <span className="flex items-center gap-1">
              <Bath size={15} />
              {post.soPhongTam} WC
            </span>
          )}
        </div>
        <p className="my-1.5 flex items-start gap-1 text-sm">
          <MapPin size={15} className="shrink-0" />
          <span className="min-w-0 wrap-anywhere">
            {[
              post.diaChiChiTiet,
              post.phuongXa.tenPhuongXa,
              post.phuongXa.tinhThanh.tenTinhThanh,
            ]
              .filter(Boolean)
              .join(", ")}
          </span>
        </p>
        <p className="line-clamp-2 wrap-anywhere text-sm text-[#aaa]">
          {post.moTa.trim() ||
            [
              post.loaiBatDongSan.tenLoai,
              post.giayToPhapLy?.tenGiayTo,
              post.huongNha && "Hướng " + post.huongNha,
            ]
              .filter(Boolean)
              .join(" · ")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-2">
          {post.nguoiDang.anhDaiDienUrl && !avatarFailed ? (
            <img
              src={post.nguoiDang.anhDaiDienUrl}
              onError={() => setAvatarFailed(true)}
              alt=""
              className="size-8 rounded-full object-cover"
            />
          ) : (
            <img
              src="/user.png"
              alt=""
              className="size-8 rounded-full object-cover"
            />
          )}
          <div className="mr-auto text-xs">
            <strong>{name}</strong>
            <p className="text-[#AAAAAA] font-semibold">
              {formatDate(post.ngayDang)}
            </p>
          </div>
          <ContactPhoneButton post={post} />
        </div>
      </div>
    </article>
  );
}
