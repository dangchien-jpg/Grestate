import VerifiedBadge from "@/components/verify-post/verified-badge";
import AuthorContact from "@/components/contact/author-contact";
import { getPostId, getPostUrl } from "@/lib/post-url";
import ReportForm from "@/components/report/report-form";
import { useEffect, useState } from "react";
import PostGallery from "@/components/property/post-gallery";
import { formatPrice } from "@/lib/format-price";
import {
  Bath,
  BedDouble,
  Building2,
  ChevronRight,
  Compass,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Check,
  House,
  LandPlot,
  MapPin,
  Share2,
  ShieldCheck,
  Sofa,
  Ruler,
  Split,
  Road,
  BadgeCheck,
} from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Navigate, useLocation, useParams } from "react-router";
import { usePostStore } from "@/stores/postStore";
import FavoriteButton from "@/components/favorite-post/favorite-button";
import { useFavorites } from "@/hooks/use-favorites";

const DetailPage = () => {
  useFavorites();
  const { maTinDang } = useParams();
  const id = getPostId(maTinDang);
  const location = useLocation();

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
  const canonicalUrl = getPostUrl(post);
  if (location.pathname !== canonicalUrl) {
    return (
      <Navigate
        to={`${canonicalUrl}${location.search}${location.hash}`}
        replace
      />
    );
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
    { icon: Split, label: "Hướng nhà", value: post.huongNha },
    { icon: Compass, label: "Hướng ban công", value: post.huongBanCong },
    { icon: Sofa, label: "Nội thất", value: post.noiThat },
    {
      icon: Ruler,
      label: "Mặt tiền",
      value:
        post.matTien == null
          ? null
          : `${post.matTien.toLocaleString("vi-VN")} m`,
    },
    {
      icon: Road,
      label: "Đường vào",
      value:
        post.matDuong == null
          ? null
          : `${post.matDuong.toLocaleString("vi-VN")} m`,
    },
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
  return (
    <div className="min-h-screen bg-white font-sans ">
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-20 sm:py-8">
        <div className="grid items-start gap-6 lg:justify-center lg:grid-cols-[minmax(0,640px)_320px] lg:gap-x-3 xl:grid-cols-[minmax(0,640px)_350px]">
          <article className="w-full min-w-0 max-w-[640px] space-y-4">
            <PostGallery key={post.maTinDang} post={post} />
            <nav
              aria-label="Đường dẫn"
              className="flex items-center gap-1 whitespace-nowrap text-xs sm:text-sm"
            >
              <a
                href="/"
                className="shrink-0 font-medium text-[#aaa] hover:text-gray-700"
              >
                Trang chủ /
              </a>
              <span className="shrink-0 font-medium text-[#aaa] hover:text-gray-700">
                {post.loaiBatDongSan.tenLoai} /
              </span>
              <span
                aria-current="page"
                className="min-w-0 truncate font-medium"
              >
                {post.tieuDe}
              </span>
            </nav>
            <section className="">
              <p className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl line-clamp-3">
                <VerifiedBadge verified={post.daXacThuc} />
                {post.tieuDe}
              </p>
              <p className="mt-3 flex items-start gap-2 text-sm font-medium leading-relaxed ">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {address}
              </p>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-y border-[#ddd] py-5">
                <div>
                  <p className="mb-1 text-sm font-medium">Khoảng giá</p>
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
                  <ReportForm key={post.maTinDang} maTinDang={post.maTinDang} />
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
              <h2 className="mb-5 mt-6 text-xl font-medium tracking-tight sm:text-xl">
                Đặc điểm bất động sản
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
                      <dt className="text-sm font-medium">{label}</dt>
                      <dd className="mt-1 text-sm font-stretch-95%">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>
            {post.daXacThuc && (
              <section className="rounded-sm bg-[#f2f2f2] px-5 py-4 text-gray-950">
                <h2 className="flex items-center gap-2 mb-3 text-sm font-semibold">
                  <BadgeCheck className="size-6 text-emerald-600" />
                  Bất động sản đã được xác thực
                </h2>
                <div>
                  <ul className="space-y-3">
                    {[
                      {
                        icon: FileText,
                        label: "Có sổ đỏ, hồng/hợp đồng mua bán",
                      },
                      {
                        icon: ImageIcon,
                        label: "Đúng địa chỉ, hình ảnh & đặc điểm",
                      },
                    ].map(({ icon: Icon, label }) => (
                      <li key={label} className="flex items-center gap-4">
                        <span aria-hidden="true" className="relative shrink-0">
                          <Icon className="size-5" strokeWidth={1.6} />
                          <Check
                            className="absolute -right-1.5 -bottom-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-600 text-white"
                            strokeWidth={3}
                          />
                        </span>
                        <span className="text-sm font-medium">{label}</span>
                      </li>
                    ))}
                  </ul>
                  <details className="group mt-5">
                    <summary className="inline-flex cursor-pointer items-center gap-1 hover:underline">
                      Tìm hiểu thêm về Tin xác thực
                      <ChevronRight
                        aria-hidden="true"
                        className="size-4 group-open:rotate-90"
                      />
                    </summary>
                    <p className="mt-2 text-sm leading-6">
                      Tin được gắn dấu xác thực khi yêu cầu xác thực đã được
                      duyệt cho phiên bản hiện tại của tin đăng.
                    </p>
                  </details>
                </div>
              </section>
            )}
            <section className="pt-4">
              <h2 className="mb-4 text-xl font-medium tracking-tight sm:text-xl">
                Mô tả chi tiết
              </h2>
              <p className="whitespace-pre-line break-words text-sm font-stretch-95% leading-7">
                {post.moTa}
              </p>
            </section>
            <section aria-labelledby="property-map-title" className="pt-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2
                  id="property-map-title"
                  className="text-xl font-medium tracking-tight sm:text-xl"
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
            aria-label="Thông tin liên hệ"
            className="w-full max-w-[640px] space-y-4 lg:sticky lg:top-28"
          >
            <AuthorContact
              key={post.maTinDang}
              author={post.nguoiDang}
              total={post.nguoiDang._count.tinDangs}
              name={post.nguoiLienHe?.trim() || post.nguoiDang.hoTen}
              phone={
                post.soDienThoaiLienHe?.trim() || post.nguoiDang.soDienThoai
              }
              showLink
            />
            <div className="flex items-start gap-3 rounded-sm border border-emerald-100 bg-emerald-50/60 p-4">
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
