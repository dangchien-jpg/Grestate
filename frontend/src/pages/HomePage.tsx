import { formatPrice } from "@/lib/format-price";
import { type ReactNode } from "react";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Clock3,
  House,
  LandPlot,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Link } from "react-router";
import { usePostStore } from "@/stores/postStore";
import type { TinDangDanhSach } from "@/types/post";
import FavoriteButton from "@/components/favorite-post/favorite-button";
import { useFavorites } from "@/hooks/use-favorites";

export type PropertyType =
  | "apartment"
  | "house"
  | "townhouse"
  | "land"
  | "villa"
  | "office"
  | "retail"
  | "warehouse";

const photo = (id: string, width = 720) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
const images = {
  city: photo("photo-1519501025264-65ba15a82390", 1920),
  room: photo("photo-1600210492486-724fe5c67fb0"),
  villa: photo("photo-1600596542815-ffad4c1539a9"),
  apartment: photo("photo-1600607687920-4e2a09cf159d"),
  land: photo("photo-1473448912268-2022ce9509d8"),
  towers: photo("photo-1486406146926-c627a92ad1ab"),
  skyline: photo("photo-1449824913935-59a10b8d2000"),
  building: photo("photo-1460317442991-0ec209397118"),
  paperwork: photo("photo-1450101499163-c8848c66ca85"),
};

const categories = [
  { value: "apartment", label: "Căn hộ" },
  { value: "house", label: "Nhà riêng" },
  { value: "townhouse", label: "Nhà phố" },
  { value: "land", label: "Đất nền" },
  { value: "villa", label: "Biệt thự" },
  { value: "office", label: "Văn phòng" },
  { value: "retail", label: "Mặt bằng" },
];

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

function Section({
  id,
  title,
  children,
  action,
}: {
  id: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="relative pb-2 text-xl font-bold tracking-tight sm:text-2xl after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-9 ">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function MoreLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline sm:text-sm"
    >
      Xem tất cả <ArrowRight className="size-4" />
    </a>
  );
}

function PropertyCard({ property }: { property: TinDangDanhSach }) {
  return (
    <Card className="group relative gap-0 rounded-sm py-0 shadow-sm transition-shadow hover:shadow-lg">
      <Link to={`/detail/${property.maTinDang}`}>
        <div className="relative aspect-[1.75] overflow-hidden">
          <SafeImage
            src={property.anhDaiDienUrl ?? ""}
            alt={property.tieuDe}
            className="transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        </div>
        <CardContent className="space-y-3 p-4">
          <h3
            title={property.tieuDe}
            className="line-clamp-2 min-h-14 wrap-break-word text-sm leading-7 font-bold tracking-tight transition-colors"
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
          <div className="flex flex-wrap gap-4 text-xs">
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
            <p className="text-lg font-bold text-red-600">
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
  const { posts } = usePostStore();
  return (
    <div className="min-h-screen bg-white font-sans ">
      <Header />
      <main>
        <section
          aria-labelledby="hero-title"
          className="relative isolate overflow-hidden bg-slate-900"
        >
          <img
            src={images.city}
            alt="Toàn cảnh đô thị bên sông khi lên đèn"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-slate-950/75 via-slate-900/35 to-slate-900/10" />
          <div className="mx-auto max-w-7xl px-5 pb-7 pt-12 sm:px-8 sm:pt-16">
            <div id="search" className="mx-auto mt-8 max-w-5xl scroll-mt-24">
              <div className="grid gap-3 rounded-sm bg-white p-4 shadow-xl md:grid-cols-[2fr_1.2fr_1.1fr_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-4 size-4 text-primary" />
                  <Input
                    aria-label="Địa điểm hoặc tên bất động sản"
                    placeholder="Nhập thông tin bạn muốn tìm..."
                    className="h-12 rounded-lg pl-10 text-sm"
                  />
                </div>
                <div className="relative">
                  <House className="pointer-events-none absolute left-3 top-4 size-4 text-primary" />
                  <Select items={categories}>
                    <SelectTrigger>
                      <SelectValue placeholder="Loại bất động sản" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {categories.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <LandPlot className="pointer-events-none absolute left-3 top-4 size-4 text-primary" />
                  <Select items={categories}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn mức giá" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {categories.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  className="h-12 gap-2 rounded-lg px-7 text-sm"
                >
                  <Search className="size-5" />
                  Tìm kiếm
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8">
          <Section
            id="listings"
            title="Bất động sản nổi bật"
            action={
              <Button variant="link" className="gap-2 text-xs sm:text-sm">
                Xem tất cả
                <ArrowRight />
              </Button>
            }
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {posts.map((post) => (
                <PropertyCard key={post.maTinDang} property={post} />
              ))}
            </div>
          </Section>
          <Section
            id="projects"
            title="Dự án nổi bật"
            action={<MoreLink href="#projects" />}
          >
            <p className="text-sm ">
              Thông tin dự án đang được cập nhật.
            </p>
          </Section>

          <section
            aria-labelledby="map-title"
            className="relative isolate flex min-h-56 overflow-hidden rounded-xl border border-sky-100 bg-sky-100"
          >
            <div className="relative z-10 w-full bg-linear-to-r from-sky-100 via-sky-100/95 to-sky-100/60 p-7 sm:w-2/5 sm:from-sky-100 sm:via-sky-100 sm:to-transparent sm:p-8">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sky-700">
                Khám phá khu vực
              </p>
              <h2 id="map-title" className="text-2xl font-bold text-blue-950">
                Tìm kiếm theo bản đồ
              </h2>
              <p className="mb-5 mt-2 max-w-xs text-sm leading-relaxed ">
                Khám phá các bất động sản xung quanh khu vực bạn quan tâm trên
                bản đồ trực quan.
              </p>
              <Button className="h-11 gap-2 rounded-lg px-5">
                <MapPin />
                Xem bản đồ
                <ArrowRight />
              </Button>
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 hidden w-3/5 overflow-hidden bg-[#e5eddf] sm:block"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(30deg, transparent 0 45px, #fff 46px 51px, transparent 52px 90px), repeating-linear-gradient(110deg, transparent 0 60px, #fff 61px 67px, transparent 68px 110px)",
              }}
            >
              <div className="absolute -top-10 right-[26%] h-96 w-16 rotate-12 bg-sky-300/80 ring-4 ring-sky-200" />
              {[
                { name: "Hải Châu", left: "27%", top: "18%" },
                { name: "Sơn Trà", left: "65%", top: "14%" },
                { name: "Thanh Khê", left: "12%", top: "52%" },
                { name: "Cẩm Lệ", left: "40%", top: "71%" },
                { name: "Ngũ Hành Sơn", left: "69%", top: "64%" },
              ].map((marker) => (
                <span
                  key={marker.name}
                  className="absolute flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-2 text-xs font-semibold shadow-sm"
                  style={{ left: marker.left, top: marker.top }}
                >
                  <MapPin className="size-5 fill-emerald-500 text-white" />
                  {marker.name}
                </span>
              ))}
              <span className="absolute bottom-2 right-3 rounded bg-white/80 px-2 py-1 text-[9px] ">
                Bản đồ minh họa
              </span>
            </div>
          </section>

          <section
            id="valuation"
            aria-labelledby="ai-title"
            className="relative isolate flex scroll-mt-24 flex-col items-start gap-6 overflow-hidden rounded-xl bg-[#062544] px-7 py-8 text-white sm:flex-row sm:items-center sm:px-10"
          >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_90%_70%,#0759a0_0%,transparent_65%)]" />
            <div className="flex size-24 shrink-0 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-400/5 shadow-[0_0_35px_#22d3ee20]">
              <span className="relative">
                <House className="size-16 text-cyan-300" strokeWidth={1} />
                <span className="absolute inset-0 flex items-center justify-center pt-3 text-xl font-bold text-cyan-200">
                  AI
                </span>
                <Sparkles className="absolute -right-3 top-0 size-5 text-cyan-300" />
              </span>
            </div>
            <div className="flex-1">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-cyan-300">
                <Sparkles className="size-3" />
                Công nghệ cho tổ ấm của bạn
              </p>
              <h2 id="ai-title" className="text-xl font-bold sm:text-2xl">
                Định giá bất động sản bằng AI
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-blue-100">
                Nhận mức giá gợi ý dựa trên dữ liệu thị trường
                <br className="hidden lg:block" /> và trí tuệ nhân tạo.
              </p>
            </div>
            <Button
              variant="secondary"
              className="h-12 gap-3 rounded-lg bg-white px-6 text-blue-950 hover:bg-blue-50"
            >
              Định giá ngay
              <ArrowRight />
            </Button>
          </section>

          <Section
            id="news"
            title="Tin tức thị trường"
            action={<MoreLink href="#news" />}
          >
            <p className="text-sm ">
              Tin tức thị trường đang được cập nhật.
            </p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
