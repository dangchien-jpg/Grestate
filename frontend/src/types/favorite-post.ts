import type { TinDang, TinDangDanhSach } from "./post";

export type FavoritePost = Pick<
  TinDang,
  "maTinDang" | "tieuDe" | "giaNiemYet" | "dienTich" | "soPhongNgu" |
  "soPhongTam" | "diaChiChiTiet" | "ngayDang" | "createdAt" | "trangThai"
> & {
  phuongXa: Pick<TinDangDanhSach["phuongXa"], "maPhuongXa" | "tenPhuongXa" | "tinhThanh">;
  anhDaiDienUrl: string | null;
  soHinhAnh: number;
  ngayLuu: string;
  daYeuThich: boolean;
};

export interface FavoritePostsResponse {
  posts: FavoritePost[];
  total: number;
}
