import { type ReactNode } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Bell,
  Building2,
  Check,
  Clock3,
  Heart,
  House,
  LandPlot,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Trees,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export type PropertyType =
  | "apartment"
  | "house"
  | "townhouse"
  | "land"
  | "villa"
  | "office"
  | "retail"
  | "warehouse";
export interface PropertyListing {
  id: string;
  title: string;
  location: string;
  image: string;
  type: PropertyType;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  publishedAt: string;
}
export interface HomeProject {
  id: string;
  name: string;
  location: string;
  image: string;
  startingPrice: number;
}
export interface MarketArticle {
  id: string;
  title: string;
  image: string;
  publishedAt: string;
}

export interface HomePageData {
  listings: PropertyListing[];
  projects: HomeProject[];
  articles: MarketArticle[];
}

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
const DEMO_DATA: HomePageData = {
  listings: [
    {
      id: "monarchy",
      title: "Căn hộ cao cấp Monarchy Đà Nẵng",
      location: "Quận Sơn Trà, Đà Nẵng",
      image: images.room,
      type: "apartment",
      price: 3200000000,
      area: 72,
      bedrooms: 2,
      bathrooms: 2,
      publishedAt: "2025-08-10",
    },
    {
      id: "nguyen-huu-tho",
      title: "Nhà phố 3 tầng đường Nguyễn Hữu Thọ",
      location: "Quận Hải Châu, Đà Nẵng",
      image: images.villa,
      type: "townhouse",
      price: 5800000000,
      area: 100,
      bedrooms: 4,
      bathrooms: 3,
      publishedAt: "2025-08-09",
    },
    {
      id: "fpt-plaza",
      title: "Căn hộ FPT Plaza view sông",
      location: "Quận Ngũ Hành Sơn, Đà Nẵng",
      image: images.apartment,
      type: "apartment",
      price: 12000000,
      area: 68,
      bedrooms: 2,
      bathrooms: 2,
      publishedAt: "2025-08-08",
    },
    {
      id: "nam-hoa-xuan",
      title: "Đất nền khu đô thị Nam Hòa Xuân",
      location: "Quận Ngũ Hành Sơn, Đà Nẵng",
      image: images.land,
      type: "land",
      price: 2600000000,
      area: 120,
      publishedAt: "2025-08-07",
    },
  ],
  projects: [
    {
      id: "sun-symphony",
      name: "Sun Symphony Residence",
      location: "Quận Sơn Trà, Đà Nẵng",
      image: images.city,
      startingPrice: 2500000000,
    },
    {
      id: "filmore",
      name: "The Filmore Da Nang",
      location: "Quận Hải Châu, Đà Nẵng",
      image: images.towers,
      startingPrice: 4800000000,
    },
    {
      id: "fpt-3",
      name: "FPT Plaza 3",
      location: "Quận Ngũ Hành Sơn, Đà Nẵng",
      image: images.building,
      startingPrice: 2200000000,
    },
    {
      id: "blooming",
      name: "Blooming Tower",
      location: "Quận Liên Chiểu, Đà Nẵng",
      image: images.skyline,
      startingPrice: 1900000000,
    },
  ],
  articles: [
    {
      id: "market",
      title:
        "Thị trường bất động sản Đà Nẵng có nhiều tín hiệu tích cực trong năm 2025",
      image: images.city,
      publishedAt: "2025-08-10",
    },
    {
      id: "first-home",
      title: "Kinh nghiệm mua căn hộ chung cư lần đầu cho người mới",
      image: images.room,
      publishedAt: "2025-08-08",
    },
    {
      id: "planning",
      title: "Quy hoạch đô thị Đà Nẵng giai đoạn 2025 – 2030 có gì mới?",
      image: images.skyline,
      publishedAt: "2025-08-05",
    },
    {
      id: "legal",
      title: "Thủ tục pháp lý cần biết khi mua bán bất động sản",
      image: images.paperwork,
      publishedAt: "2025-08-01",
    },
  ],
};
const categories: { id: PropertyType; label: string; icon: LucideIcon }[] = [
  { id: "apartment", label: "Căn hộ", icon: Building2 },
  { id: "house", label: "Nhà riêng", icon: House },
  { id: "townhouse", label: "Nhà phố", icon: Store },
  { id: "land", label: "Đất nền", icon: LandPlot },
  { id: "villa", label: "Biệt thự", icon: Trees },
  { id: "office", label: "Văn phòng", icon: Building2 },
  { id: "retail", label: "Mặt bằng", icon: Store },
];

const numberFormat = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
});
function formatPrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "Liên hệ";
  return value >= 1e9
    ? `${numberFormat.format(value / 1e9)} tỷ`
    : `${numberFormat.format(value / 1e6)} triệu`;
}
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
function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="Grestate - Trang chủ"
      className={`inline-flex items-center gap-1.5 ${light ? "text-white" : "text-primary"}`}
    >
      <span className="relative">
        <House className="size-9" strokeWidth={2.4} />
        <span className="absolute bottom-2 right-2 h-3 w-1.5 rounded-sm bg-emerald-400" />
      </span>
      <span>
        <span className="block text-3xl font-extrabold leading-8 tracking-tight">
          Grestate<span className="text-emerald-400">.</span>
        </span>
        <span className="block text-[9px] tracking-wide">
          Kết nối giá trị · Mở lối an cư
        </span>
      </span>
    </Link>
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
        <h2 className="relative pb-2 text-xl font-bold tracking-tight sm:text-2xl after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-9 after:bg-emerald-400">
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

function PropertyCard({ property }: { property: PropertyListing }) {
  return (
    <Card className="group gap-0 rounded-xl py-0 shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative aspect-[1.75] overflow-hidden">
        <button
          type="button"
          className="h-full w-full focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary"
          aria-label={`Xem ${property.title}`}
        >
          <SafeImage
            src={property.image}
            alt={property.title}
            className="transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        </button>
        <Button
          size="icon"
          variant="secondary"
          aria-label="L?u tin"
          className="absolute right-3 top-3 size-8 rounded-full bg-white/95 text-slate-600 shadow-sm"
        >
          <Heart />
        </Button>
      </div>
      <CardContent className="space-y-3 p-4">
        <h3>
          <button
            type="button"
            className="line-clamp-1 text-left text-sm font-bold hover:text-primary"
            title={property.title}
          >
            {property.title}
          </button>
        </h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{property.location}</span>
        </p>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1">
            <LandPlot className="size-3.5" />
            {numberFormat.format(property.area)} m²
          </span>
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble className="size-3.5" />
              {property.bedrooms} PN
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="size-3.5" />
              {property.bathrooms} WC
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-lg font-bold text-red-600">
            {formatPrice(property.price)}
          </p>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock3 className="size-3" />
            {formatDate(property.publishedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { listings, projects, articles } = DEMO_DATA;
  const { user } = useAuthStore();
  const selectClass =
    "h-12 min-w-0 w-full rounded-lg border border-input bg-white pl-10 pr-3 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="min-h-screen bg-white font-sans text-slate-950">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <Brand />
          <nav
            aria-label="Điều hướng chính"
            className="hidden items-center gap-7 text-sm font-medium lg:flex"
          >
            <a
              href="#"
              aria-current="page"
              className="border-b-2 border-primary py-7 text-primary"
            >
              Trang chủ
            </a>
            <a href="#projects" className="hover:text-primary">
              Dự án
            </a>
            <a href="#valuation" className="hover:text-primary">
              Định giá AI
            </a>
            <a href="#news" className="hover:text-primary">
              Tin tức
            </a>
            <a href="#contact" className="hover:text-primary">
              Liên hệ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="L?u tin"
              className="relative rounded-full"
            >
              <Heart />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Thông báo"
              className="hidden rounded-full sm:inline-flex"
            >
              <Bell />
            </Button>
            {user ? (
              <Avatar>
                {user.anhDaiDien ? (
                  <AvatarImage src={user.anhDaiDien} />
                ) : (
                  <AvatarImage src="/user.png" />
                )}
              </Avatar>
            ) : (
              <Link
                to="/signin"
                className="hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold sm:inline-flex"
              >
                <UserRound className="size-4" />
                Đăng nhập
              </Link>
            )}

            <Link
              to="/signin"
              className="rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary/90"
            >
              Đăng tin
            </Link>
          </div>
        </div>
        <details className="border-t px-5 py-3 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
            <Menu className="size-4" />
            ?i?u h??ng
          </summary>
          <nav
            id="mobile-nav"
            aria-label="Điều hướng trên điện thoại"
            className="grid grid-cols-2 gap-4 border-t px-5 py-5 text-sm lg:hidden"
          >
            {[
              ["Trang chủ", "#"],
              ["Tìm bất động sản", "#search"],
              ["Dự án", "#projects"],
              ["Định giá AI", "#valuation"],
              ["Tin tức", "#news"],
              ["Liên hệ", "#contact"],
            ].map(([label, href]) => (
              <a key={label} href={href}>
                {label}
              </a>
            ))}
            <Link to="/signin">Đăng nhập</Link>
          </nav>
        </details>
      </header>

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
              <div className="grid gap-3 rounded-xl bg-white p-4 shadow-xl md:grid-cols-[2fr_1.2fr_1.1fr_auto]">
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 size-4 text-primary" />
                  <Input
                    aria-label="Địa điểm hoặc tên bất động sản"
                    placeholder="Nhập tỉnh/thành, quận/huyện, phường/xã…"
                    className="h-12 rounded-lg pl-10 text-sm"
                  />
                </div>
                <div className="relative">
                  <House className="pointer-events-none absolute left-3 top-4 size-4 text-primary" />
                  <select
                    aria-label="Loại bất động sản"
                    defaultValue="all"
                    className={selectClass}
                  >
                    <option value="all">Loại bất động sản</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <LandPlot className="pointer-events-none absolute left-3 top-4 size-4 text-primary" />
                  <select
                    aria-label="Khoảng giá"
                    defaultValue="all"
                    className={selectClass}
                  >
                    <option value="all">Khoảng giá</option>
                    <option value="under-2">Dưới 2 tỷ</option>
                    <option value="2-5">Từ 2 – 5 tỷ</option>
                    <option value="over-5">Trên 5 tỷ</option>
                  </select>
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
            title="Tin đăng nổi bật"
            action={
              <Button variant="link" className="gap-2 text-xs sm:text-sm">
                Xem tất cả
                <ArrowRight />
              </Button>
            }
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {listings.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </Section>
          <Section
            id="projects"
            title="Dự án nổi bật"
            action={<MoreLink href="#projects" />}
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {projects.map((project) => (
                <button
                  type="button"
                  key={project.id}
                  className="group relative aspect-[1.35] overflow-hidden rounded-lg bg-slate-900 text-left text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <SafeImage
                    src={project.image}
                    alt={project.name}
                    className="transition-transform duration-500 motion-safe:group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 space-y-1 p-4">
                    <h3 className="text-sm font-bold">{project.name}</h3>
                    <p className="truncate text-xs text-white/80">
                      {project.location}
                    </p>
                    <p className="font-semibold">
                      Từ {formatPrice(project.startingPrice)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
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
              <p className="mb-5 mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
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
              <span className="absolute bottom-2 right-3 rounded bg-white/80 px-2 py-1 text-[9px] text-slate-500">
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {articles.map((article) => (
                <article key={article.id} className="group">
                  <button type="button" className="w-full text-left">
                    <div className="aspect-[2.6] overflow-hidden rounded-lg bg-muted">
                      <SafeImage
                        src={article.image}
                        alt={article.title}
                        className="transition-transform duration-500 motion-safe:group-hover:scale-105"
                      />
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-relaxed group-hover:text-primary">
                      {article.title}
                    </h3>
                  </button>
                  <time
                    dateTime={article.publishedAt}
                    className="mt-2 block text-xs text-muted-foreground"
                  >
                    {formatDate(article.publishedAt)}
                  </time>
                </article>
              ))}
            </div>
          </Section>
        </div>
      </main>

      <footer id="contact" className="bg-[#0a2138] text-slate-300">
        <div className="mx-auto max-w-7xl px-5 pb-5 pt-10 sm:px-8">
          <div className="grid gap-9 pb-8 sm:grid-cols-2 lg:grid-cols-[1.8fr_0.8fr_1fr_1.2fr]">
            <div>
              <Brand light />
              <p className="mt-4 max-w-sm text-sm leading-relaxed">
                Grestate là nền tảng bất động sản uy tín, giúp bạn dễ dàng tìm
                kiếm, đăng tin và kết nối với người có nhu cầu.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs text-emerald-300">
                <ShieldCheck className="size-4" />
                Kết nối tin cậy, an cư bền vững
              </div>
            </div>
            <div>
              <h2 className="mb-4 text-sm font-semibold text-white">
                Liên kết nhanh
              </h2>
              <ul className="space-y-2 text-sm">
                {[
                  ["Trang chủ", "#"],
                  ["Mua bán", "#search"],
                  ["Cho thuê", "#search"],
                  ["Dự án", "#projects"],
                  ["Tin tức", "#news"],
                  ["Liên hệ", "#contact"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="hover:text-white">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-sm font-semibold text-white">Hỗ trợ</h2>
              <ul className="space-y-2 text-sm">
                {[
                  "Hướng dẫn sử dụng",
                  "Câu hỏi thường gặp",
                  "Quy định đăng tin",
                  "Chính sách bảo mật",
                  "Điều khoản sử dụng",
                ].map((label) => (
                  <li key={label}>
                    <button
                      type="button"
                      className="text-left hover:text-white"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-sm font-semibold text-white">Liên hệ</h2>
              <address className="space-y-3 text-sm not-italic">
                <p className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  123 Đường 2/9, Quận Hải Châu, Đà Nẵng
                </p>
                <a
                  href="tel:0123456789"
                  className="flex items-center gap-3 hover:text-white"
                >
                  <Phone className="size-4 text-emerald-400" />
                  0123 456 789
                </a>
                <a
                  href="mailto:support@grestate.vn"
                  className="flex items-center gap-3 hover:text-white"
                >
                  <Mail className="size-4 text-emerald-400" />
                  support@grestate.vn
                </a>
              </address>
              <p className="mt-4 flex items-center gap-1 text-[10px] text-slate-400">
                <Check className="size-3" />
                Thông tin liên hệ minh họa
              </p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Grestate. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </footer>
    </div>
  );
}
