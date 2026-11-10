import { useEffect, useState } from "react";
import type { TinDangDanhSach } from "@/types/post";
import { formatPrice } from "@/lib/format-price";
import {
  Bath,
  BedDouble,
  Building2,
  ChevronRight,
  ChevronLeft,
  Compass,
  FileCheck2,
  House,
  LandPlot,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router";
import { usePostStore } from "@/stores/postStore";
import FavoriteButton from "@/components/favorite-post/favorite-button";
import { useFavorites } from "@/hooks/use-favorites";

function PostGallery({ post }: { post: TinDangDanhSach }) {
  const urls = post.hinhAnhTinDangs.map((photo) => photo.hinhAnhUrl);
  if (post.anhDaiDienUrl && !urls.includes(post.anhDaiDienUrl)) {
    urls.unshift(post.anhDaiDienUrl);
  }
  const coverIndex = Math.max(0, urls.indexOf(post.anhDaiDienUrl ?? ""));
  const [selectedIndex, setSelectedIndex] = useState(coverIndex);
  const move = (direction: number) => {
    setSelectedIndex(
      (current) => (current + direction + urls.length) % urls.length,
    );
  };

  return (
    <section aria-label="Hình ảnh bất động sản" className="space-y-2.5">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#686660] sm:aspect-[16/9]">
        <button
          type="button"
          disabled={urls.length < 2}
          onClick={() => move(1)}
          aria-label="Xem ảnh tiếp theo"
          className="flex h-full w-full items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <img
            src={urls[selectedIndex] ?? "/placeholder.png"}
            alt={`${post.tieuDe} - ảnh ${selectedIndex + 1}`}
            fetchPriority="high"
            className="h-full w-full object-contain"
          />
        </button>
        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Ảnh trước"
              className="absolute top-1/2 left-4 -translate-y-1/2 rounded bg-white p-2.5 shadow-lg hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-white"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Ảnh tiếp theo"
              className="absolute top-1/2 right-4 -translate-y-1/2 rounded bg-white p-2.5 shadow-lg hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-white"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
        <span className="absolute right-4 bottom-4 rounded bg-slate-950/75 px-3 py-1 text-sm font-semibold text-white">
          {urls.length > 0 ? selectedIndex + 1 : 0} / {urls.length}
        </span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto p-1">
        {urls.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => setSelectedIndex(index)}
            aria-label={`Xem ảnh ${index + 1}`}
            aria-pressed={selectedIndex === index}
            className={`min-w-0 basis-[calc((100%-2.5rem)/5)] shrink-0 overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selectedIndex === index ? "ring-2 ring-primary ring-offset-2" : ""}`}
          >
            <img
              src={url}
              alt={`${post.tieuDe} - ${index + 1}`}
              loading="lazy"
              className="aspect-[16/10] w-full object-cover transition-opacity hover:opacity-80"
            />
          </button>
        ))}
      </div>
    </section>
  );
}

const DetailPage = () => {
  useFavorites();
  const { maTinDang } = useParams();
  const id = Number(maTinDang);
  const fetchDetailPost = usePostStore((state) => state.fetchDetailPost);
  const post = usePostStore((state) => state.post);
  const [request, setRequest] = useState<{
    id: number;
    result: "ready" | "error";
  } | null>(null);

  useEffect(() => {
    if (!Number.isSafeInteger(id) || id <= 0) return;

    let active = true;
    const loadPost = async () => {
      try {
        await fetchDetailPost(id);
        if (active) setRequest({ id, result: "ready" });
      } catch {
        if (active) setRequest({ id, result: "error" });
      }
    };

    void loadPost();

    return () => {
      active = false;
    };
  }, [id, fetchDetailPost]);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return <p>Mã tin đăng không hợp lệ.</p>;
  }

  if (request?.id !== id) {
    return <p role="status">Đang tải tin đăng...</p>;
  }

  if (request.result === "error") {
    return <p role="alert">Không thể tải tin đăng. Vui lòng thử lại sau.</p>;
  }

  if (!post || post.maTinDang !== id) {
    return <p>Không tìm thấy tin đăng.</p>;
  }
  const specifications = [
    {
      icon: House,
      label: "Loại bất động sản",
      value: post.loaiBatDongSan.tenLoai,
    },
    {
      icon: LandPlot,
      label: "Diện tích",
      value: `${post.dienTich.toLocaleString("vi-VN")} m²`,
    },
    { icon: BedDouble, label: "Phòng ngủ", value: post.soPhongNgu },
    { icon: Bath, label: "Phòng tắm", value: post.soPhongTam },
    { icon: Building2, label: "Số tầng", value: post.soTang },
    { icon: Compass, label: "Hướng nhà", value: post.huongNha },
    { icon: FileCheck2, label: "Pháp lý", value: post.giayToPhapLy?.tenGiayTo },
  ].filter(({ value }) => value != null && value !== "");
  const address = [
    post.diaChiChiTiet,
    post.phuongXa.tenPhuongXa,
    post.phuongXa.tinhThanh.tenTinhThanh,
  ]
    .filter(Boolean)
    .join(", ");
  const mapQuery = encodeURIComponent(`${address}, Việt Nam`);
  const mapUrl = `https://maps.google.com/maps?q=${mapQuery}&output=embed&hl=vi&z=17`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  let zaloUrl: string | null = null;
  const zaloLink = post.nguoiDang.duongDanZalo?.trim();
  if (zaloLink) {
    try {
      const url = new URL(
        /^https?:\/\//i.test(zaloLink) ? zaloLink : `https://${zaloLink}`,
      );
      if (url.protocol === "https:" || url.protocol === "http:") {
        zaloUrl = url.href;
      }
    } catch {
      zaloUrl = null;
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans ">
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
        <nav
          aria-label="Đường dẫn"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs sm:text-sm"
        >
          <a href="/" className="hover:text-primary">
            Trang chủ
          </a>
          <ChevronRight aria-hidden="true" className="size-3.5" />
          <span>{post.loaiBatDongSan.tenLoai}</span>
          <ChevronRight aria-hidden="true" className="size-3.5" />
          <span aria-current="page" className="">
            {post.tieuDe}
          </span>
        </nav>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-8 xl:grid-cols-[minmax(0,1fr)_350px]">
          <article className="min-w-0 space-y-6">
            <PostGallery key={post.maTinDang} post={post} />

            <section className="rounded-2xl border border-gray-300 bg-white p-5 sm:p-7">
              <h1 className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
                {post.tieuDe}
              </h1>
              <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed ">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {address}
              </p>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-y border-slate-100 py-5">
                <div>
                  <p className="mb-1 text-xs ">Giá bán</p>
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-3xl font-bold text-red-600">
                    {formatPrice(post.giaNiemYet)}
                    <span className="text-sm font-normal ">
                      {post.dienTich > 0 && post.giaNiemYet > 0
                        ? `~ ${formatPrice(post.giaNiemYet / post.dienTich)}/m²`
                        : ""}
                    </span>
                  </p>
                </div>
                <div className="flex gap-1 ">
                  <FavoriteButton post={post} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Báo cáo tin đăng"
                  >
                    <TriangleAlert className="size-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Chia sẻ tin đăng"
                  >
                    <Share2 className="size-5" />
                  </Button>
                </div>
              </div>
              <h2 className="mb-5 mt-6 text-xl font-bold tracking-tight sm:text-2xl">
                Thông tin cơ bản
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 xl:grid-cols-4">
                {specifications.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 "
                      strokeWidth={1.6}
                    />
                    <div>
                      <dt className="text-xs ">{label}</dt>
                      <dd className="mt-1 text-sm font-semibold">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-300 bg-white p-5 sm:p-7">
              <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">
                Mô tả chi tiết
              </h2>
              <p className="whitespace-pre-line break-words text-sm leading-7 ">
                {post.moTa}
              </p>
            </section>
            <section
              aria-labelledby="property-map-title"
              className="rounded-2xl border border-gray-300 bg-white p-5 sm:p-7"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2
                  id="property-map-title"
                  className="text-xl font-bold tracking-tight sm:text-2xl"
                >
                  Vị trí trên bản đồ
                </h2>
                <Button
                  type="button"
                  variant="link"
                  className="gap-2 px-0 text-xs sm:text-sm"
                  onClick={() =>
                    window.open(googleMapsUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  <MapPin className="size-4" />
                  Xem trên bản đồ
                </Button>
              </div>
              <p className="mb-5 flex items-start gap-2 text-sm ">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {address}
              </p>
              <iframe
                title="Vị trí bất động sản trên Google Maps"
                src={mapUrl}
                className="h-80 w-full rounded-xl border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </section>
          </article>

          <aside
            aria-label="Thông tin người đăng"
            className="space-y-4 lg:sticky lg:top-28"
          >
            <section className="rounded-2xl border border-gray-300 bg-white p-6">
              <p className="mb-5 text-xs font-semibold tracking-wider ">
                Thông tin người đăng
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={post.nguoiDang.anhDaiDienUrl ?? "/placeholder.png"}
                  alt={post.nguoiDang.hoTen}
                  className="size-16 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <h2 className="font-bold">{post.nguoiDang.hoTen}</h2>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                <Button type="button" className="h-12 w-full gap-2 rounded-lg">
                  <Phone className="size-4" />
                  {post.nguoiDang.soDienThoai ?? "Chưa có số điện thoại"}
                </Button>
                {zaloUrl ? (
                  <a
                    href={zaloUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <MessageCircle className="size-4" />
                    Liên hệ qua Zalo
                  </a>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="h-11 w-full gap-2 rounded-lg"
                  >
                    <MessageCircle className="size-4" />
                    Chưa có liên kết Zalo
                  </Button>
                )}
              </div>
            </section>
            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <p className="text-xs leading-6 ">
                Nên xem nhà thực tế và kiểm tra giấy tờ pháp lý trước khi đặt
                cọc hoặc giao dịch.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DetailPage;
