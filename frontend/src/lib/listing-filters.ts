import type { TinDangDanhSach as Post } from "@/types/post";
import type { SearchQuery } from "@/services/searchService";

export const emptyFilters = {
  category: [] as string[],
  legal: [] as string[],
  direction: [] as string[],
  city: "",
  district: "",
  ward: "",
  bedrooms: "",
  bathrooms: "",
  furnishing: [] as string[],
  minPrice: "",
  maxPrice: "",
  minArea: "",
  maxArea: "",
};
export type Filters = typeof emptyFilters;
export function districtOf(post: Post) {
  return (
    post.diaChiChiTiet
      ?.split(/[,;]/)
      .map((s) => s.trim())
      .find((s) => /^(quận|huyện|thị xã|q\.|h\.)\s*\S/i.test(s)) ?? ""
  );
}
export function matches(p: Post, f: Filters) {
  const price = p.giaNiemYet / 1e9;
  return (
    (!f.category.length || f.category.includes(p.loaiBatDongSan.tenLoai)) &&
    (!f.legal.length || f.legal.includes(p.giayToPhapLy?.tenGiayTo ?? "")) &&
    (!f.direction.length || f.direction.includes(p.huongNha ?? "")) &&
    (!f.city || p.phuongXa.maTinhThanh === f.city) &&
    (!f.district || districtOf(p) === f.district) &&
    (!f.ward || String(p.maPhuongXa) === f.ward) &&
    (!f.bedrooms ||
      (f.bedrooms === "5+"
        ? (p.soPhongNgu ?? 0) >= 5
        : String(p.soPhongNgu) === f.bedrooms)) &&
    (!f.bathrooms ||
      (f.bathrooms === "5+"
        ? (p.soPhongTam ?? 0) >= 5
        : String(p.soPhongTam) === f.bathrooms)) &&
    (!f.furnishing.length || f.furnishing.includes(p.noiThat?.trim() ?? "")) &&
    (!f.minPrice || price >= +f.minPrice) &&
    (!f.maxPrice || price <= +f.maxPrice) &&
    (!f.minArea || p.dienTich >= +f.minArea) &&
    (!f.maxArea || p.dienTich <= +f.maxArea)
  );
}
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .trim();
export function searchMatches(p: Post, query: SearchQuery) {
  return (
    (!query.maLoaiBatDongSan ||
      p.maLoaiBatDongSan === query.maLoaiBatDongSan) &&
    (!query.maPhuongXa || p.maPhuongXa === query.maPhuongXa) &&
    (!query.keyword ||
      [
        p.tieuDe,
        p.moTa,
        p.diaChiChiTiet,
        p.loaiBatDongSan.tenLoai,
        p.phuongXa.tenPhuongXa,
        p.phuongXa.tinhThanh.tenTinhThanh,
      ].some((s) => normalize(s ?? "").includes(normalize(query.keyword!))))
  );
}
