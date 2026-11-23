import VerifiedBadge from "@/components/verify-post/verified-badge";
import { Bath, BedDouble, Clock3, LandPlot, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router";
import FavoriteButton from "@/components/favorite-post/favorite-button";
import { getPostUrl } from "@/lib/post-url";
import { formatPrice } from "@/lib/format-price";
import type { TinDangDanhSach } from "@/types/post";
import SafeImage from "./safe-image";
import { formatDate, numberFormat } from "../../types/format";

export default function PropertyCard({
  property,
  compact = false,
  featured = false,
}: {
  property: TinDangDanhSach;
  compact?: boolean;
  featured?: boolean;
}) {
  const unitPrice = property.giaNiemYet / property.dienTich;
  return (
    <Card className="group relative min-w-0 w-full gap-0 rounded-sm py-0 shadow-md transition-shadow hover:shadow-lg">
      <Link
        className={compact ? "grid grid-cols-[35%_minmax(0,1fr)]" : undefined}
        to={getPostUrl(property)}
      >
        <div
          className={
            compact
              ? "relative overflow-hidden"
              : `relative overflow-hidden ${featured ? "aspect-video" : "aspect-[2.6]"}`
          }
        >
          <SafeImage
            src={property.anhDaiDienUrl ?? ""}
            alt={property.tieuDe}
            className="transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        </div>
        <CardContent className={featured ? "space-y-3.5 p-4" : "space-y-2 p-3"}>
          <h3
            title={property.tieuDe}
            className={`line-clamp-2 wrap-break-word text-sm font-bold tracking-tight transition-colors ${featured ? "min-h-12 leading-6" : "min-h-10 leading-5"}`}
          >
            <VerifiedBadge verified={property.daXacThuc} />
            {property.tieuDe}
          </h3>
          <p className="flex items-center gap-1 text-xs ">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {[
                property.diaChiChiTiet,
                property.phuongXa.tenPhuongXa,
                property.phuongXa.tinhThanh.tenTinhThanh,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1">
              <LandPlot className="size-3.5" />
              {numberFormat.format(property.dienTich)} m²
            </span>
            {property.soPhongNgu != null && (
              <span className="flex items-center gap-1">
                <BedDouble className="size-3.5" />
                {property.soPhongNgu} PN
              </span>
            )}
            {property.soPhongTam != null && (
              <span className="flex items-center gap-1">
                <Bath className="size-3.5" />
                {property.soPhongTam} WC
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-base font-bold text-red-600">
                {formatPrice(property.giaNiemYet)}
              </span>
              {Number.isFinite(unitPrice) && unitPrice > 0 && (
                <span className="text-xs text-red-600">
                  {""}~{""}
                  {unitPrice < 1e6
                    ? `${numberFormat.format(Math.round(unitPrice))} đ`
                    : formatPrice(unitPrice)}
                  /m²
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-[10px] text-[#AAA] font-semibold">
              <Clock3 className="size-3" />
              {formatDate(property.ngayDang)}
            </span>
          </div>
        </CardContent>
      </Link>
      <FavoriteButton
        post={property}
        className="absolute top-3 right-3 size-8 rounded-sm bg-white/95 shadow-sm hover:bg-white"
      />
    </Card>
  );
}
