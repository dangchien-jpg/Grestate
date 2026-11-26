import VerifiedBadge from "@/components/verify-post/verified-badge";
import PostGallery from "@/components/property/post-gallery";
import { formatPrice } from "@/lib/format-price";
import { censorStatuses, censorStatusClasses } from "@/services/adminCensorService";
import type { TinDangDanhSach } from "@/types/post";

export default function PostReviewContent({ post }: { post: TinDangDanhSach }) {
  const fields = [
        ["Loại bất động sản", post.loaiBatDongSan.tenLoai],
        ["Giá", formatPrice(post.giaNiemYet)],
        ["Diện tích", `${post.dienTich.toLocaleString("vi-VN")} m²`],
        ["Pháp lý", post.giayToPhapLy?.tenGiayTo],
        ["Phòng ngủ", post.soPhongNgu],
        ["Phòng tắm", post.soPhongTam],
        ["Số tầng", post.soTang],
        ["Hướng nhà", post.huongNha],
        ["Hướng ban công", post.huongBanCong],
        ["Nội thất", post.noiThat],
        ["Mặt tiền", post.matTien == null ? null : `${post.matTien} m`],
        [
          "Đường trước nhà",
          post.matDuong == null ? null : `${post.matDuong} m`,
        ],
      ];
  const contactFields = [
        ["Người đăng", post.nguoiDang.hoTen],
        ["Người liên hệ", post.nguoiLienHe],
        ["Số điện thoại", post.soDienThoaiLienHe || post.nguoiDang.soDienThoai],
        ["Ngày gửi", new Date(post.updatedAt).toLocaleString("vi-VN")],
      ];
  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-sm border px-2 py-1 text-xs font-semibold ${post.trangThai === "BI_GO" ? "border-red-200 bg-red-50 text-red-700" : censorStatusClasses[post.trangThai] ?? "border-gray-200 bg-gray-50"}`}
        >
          {post.trangThai === "BI_GO" ? "Vi phạm" : post.trangThai === "DA_AN" ? "Đã ẩn" : censorStatuses[post.trangThai] ?? post.trangThai}
        </span>
      </div>
      <section aria-labelledby="censor-images" className="mt-5">
        <h3 id="censor-images" className="text-base font-bold">
          {post.videoUrl ? "Hình ảnh và video bất động sản" : "Hình ảnh bất động sản"}
        </h3>
        <div className="mx-auto mt-5 max-w-lg">
          <PostGallery key={post.maTinDang} post={post} />
        </div>
      </section>
      <section
        aria-labelledby="censor-location"
        className="mt-6 border-t border-gray-200 pt-4"
      >
        <h3 id="censor-location" className="text-base font-bold">
          Vị trí
        </h3>
        <p className="mt-2 text-sm leading-6">
          {[
            post.diaChiChiTiet,
            post.phuongXa.tenPhuongXa,
            post.phuongXa.tinhThanh.tenTinhThanh,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
        {(post.viDo !== null || post.kinhDo !== null) && (
          <p className="mt-1 text-xs">
            Vĩ độ: {post.viDo ?? "Chưa có"} · Kinh độ:{" "}
            {post.kinhDo ?? "Chưa có"}
          </p>
        )}
      </section>
      {[
        {
          id: "censor-features",
          title: "Đặc điểm bất động sản",
          values: fields,
        },
        {
          id: "censor-contact",
          title: "Thông tin liên hệ",
          values: contactFields,
        },
      ].map((section) => (
        <section
          key={section.id}
          aria-labelledby={section.id}
          className="mt-6 border-t border-gray-200 pt-4"
        >
          <h3 id={section.id} className="text-base font-bold">
            {section.title}
          </h3>
          <dl className="mt-3 grid grid-cols-1 gap-4 rounded-sm border border-gray-200 p-4 text-sm sm:grid-cols-2">
            {section.values
              .filter(
                ([, value]) =>
                  value !== null && value !== undefined && value !== "",
              )
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs">{label}</dt>
                  <dd className="mt-1 font-semibold wrap-break-word">
                    {value}
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
      <h3 className="mt-6 border-t border-gray-200 pt-4 text-base font-bold">
        Tiêu đề tin đăng
      </h3>
      <p className="mt-2 text-sm leading-6 font-semibold wrap-break-word">
        <VerifiedBadge verified={post.daXacThuc} />{post.tieuDe}
      </p>
      <h3 className="mt-5 text-base font-bold">Mô tả tin đăng</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 wrap-break-word">
        {post.moTa}
      </p>
    </>
  );
}
