import { getPostUrl } from "@/lib/post-url";
import { useEffect, useState } from "react";
import type { PostFilter } from "@/services/filterService";
import SearchPanel from "@/components/search/search-panel";
import FilterPrice from "@/components/filter/filter-price.tsx";
import FilterArea from "@/components/filter/filter-area";
import FilterBox from "@/components/filter/filter-box";
import { formatPrice } from "@/lib/format-price";
import { Bath, BedDouble, Clock3, LandPlot, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Link } from "react-router";
import { usePostStore } from "@/stores/postStore";
import type { TinDangDanhSach } from "@/types/post";
import FavoriteButton from "@/components/favorite-post/favorite-button";
import { useFavorites } from "@/hooks/use-favorites";

const numberFormat = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
});
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Đang cập nhật"
    : dateFormat.format(date);
}

function SafeImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src || "/placeholder.png"}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = "/placeholder.png";
      }}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

function PropertyCard({ property }: { property: TinDangDanhSach }) {
  return (
    <Card className="group relative min-w-0 w-full gap-0 rounded-sm py-0 shadow-sm transition-shadow hover:shadow-lg">
      <Link to={getPostUrl(property)}>
        <div className="relative aspect-[1.9] overflow-hidden">
          <SafeImage
            src={property.anhDaiDienUrl ?? ""}
            alt={property.tieuDe}
            className="transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        </div>
        <CardContent className="space-y-2 p-3">
          <h3
            title={property.tieuDe}
            className="line-clamp-2 min-h-10 wrap-break-word text-sm leading-5 font-bold tracking-tight transition-colors"
          >
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
            <p className="text-base font-bold text-red-600">
              {formatPrice(property.giaNiemYet)}
            </p>
            <span className="flex items-center gap-1 text-[10px] ">
              <Clock3 className="size-3" />
              {formatDate(property.ngayDang ?? " ")}
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

export default function HomePage() {
  useFavorites();
  const { posts, fetchPost } = usePostStore();
  useEffect(() => { void fetchPost().catch(() => {}); }, [fetchPost]);
  const [filter, setFilter] = useState<(PostFilter & { page: number }) | null>(
    null,
  );
  return (
    <div className="min-h-screen ">
      <Header />
      <div className="mx-auto grid max-w-7xl items-start gap-6 shadow-sm px-5 py-8 sm:px-8 lg:grid-cols-[210px_minmax(0,1fr)] bg-white">
        <aside
          aria-label="Bộ lọc bất động sản"
          className="grid gap-4 sm:grid-cols-2 lg:sticky lg:top-24 lg:grid-cols-1"
        >
          <FilterPrice
            selected={filter?.type === "price" && typeof filter.range === "string" ? filter.range : undefined}
            onSelect={(range, label) =>
              setFilter({ type: "price", range, label, page: 1 })
            }
          />
          <FilterArea
            selected={filter?.type === "area" ? filter.range : undefined}
            onSelect={(range, label) =>
              setFilter({ type: "area", range, label, page: 1 })
            }
          />
        </aside>
        <main className="min-w-0 space-y-6">
          <SearchPanel
            posts={posts}
            filters={<FilterBox posts={posts} selected={filter} onSelect={(selected) => setFilter(selected ? { ...selected, page: 1 } : null)} />}
            filter={filter}
            onClearFilter={() => setFilter(null)}
            onFilterPage={(page) =>
              setFilter((current) => (current ? { ...current, page } : null))
            }
          >
            {(results) => (
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {results.map((post) => (
                  <PropertyCard key={post.maTinDang} property={post} />
                ))}
              </div>
            )}
          </SearchPanel>
        </main>
      </div>
      <Footer />
    </div>
  );
}
