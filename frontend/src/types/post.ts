import type { NguoiDung } from "./user";

export interface TinDang {
  maTinDang: number;
  maNguoiDung: number;
  maLoaiBatDongSan: number;
  maGiayTo: number | null;
  maPhuongXa: number;
  tieuDe: string;
  moTa: string;
  diaChiChiTiet: string;
  viDo: number | null;
  kinhDo: number | null;
  giaNiemYet: number;
  dienTich: number;
  soPhongNgu: number | null;
  soPhongTam: number | null;
  soTang: number | null;
  huongNha: string | null;
  ngayDang: string | null;
  trangThai: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface LoaiBatDongSan {
  maLoaiBatDongSan: number;
  tenLoai: string;
  moTa: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GiayToPhapLy {
  maGiayTo: number;
  tenGiayTo: string;
  moTa: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TinhThanh {
  maTinhThanh: string;
  tenTinhThanh: string;
}

export interface PhuongXa {
  maPhuongXa: number;
  maTinhThanh: string;
  tenPhuongXa: string;
}

export interface TienIch {
  maTienIch: number;
  tenTienIch: string;
  moTa: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TinDangTienIch {
  maTinDang: number;
  maTienIch: number;
}

export interface HinhAnhTinDang {
  maHinhAnh: number;
  maTinDang: number;
  hinhAnhUrl: string;
  hinhAnhId: string | null;
  thuTuHienThi: number;
  laAnhDaiDien: boolean;
  createdAt: string;
}

export interface TinDangYeuThich {
  maNguoiDung: number;
  maTinDang: number;
  ngayLuu: string;
}

export interface PhanAnhTinDang {
  maBaoCao: number;
  maTinDang: number;
  maNguoiDung: number;
  noiDung: string;
  ngayBaoCao: string;
  ngayXuLy: string | null;
  hanhDongXuLy: string | null;
  ghiChu: string | null;
  trangThai: string;
  updatedAt: string;
}

export interface LichSuKiemDuyet {
  maKiemDuyet: number;
  maTinDang: number;
  maNguoiDung: number;
  ketQua: string;
  ghiChu: string | null;
  ngayKiemDuyet: string;
}

export interface ThongBao {
  maThongBao: number;
  maNguoiDung: number;
  maTinDang: number | null;
  tieuDe: string;
  noiDung: string;
  daDoc: boolean;
  ngayDoc: string | null;
  createdAt: string;
}

export interface TinDangDanhSach extends TinDang {
  nguoiDang: Pick<
    NguoiDung,
    "maNguoiDung" | "hoTen" | "soDienThoai" | "anhDaiDienUrl" | "duongDanZalo"
  >;
  loaiBatDongSan: Pick<LoaiBatDongSan, "maLoaiBatDongSan" | "tenLoai">;
  giayToPhapLy: Pick<GiayToPhapLy, "maGiayTo" | "tenGiayTo"> | null;
  phuongXa: PhuongXa & { tinhThanh: TinhThanh };
  hinhAnhTinDangs: Pick<
    HinhAnhTinDang,
    "maHinhAnh" | "hinhAnhUrl" | "thuTuHienThi" | "laAnhDaiDien"
  >[];
  tienIchs: Pick<TienIch, "maTienIch" | "tenTienIch">[];
  anhDaiDienUrl: string | null;
}

export interface FetchPostResponse {
  posts: TinDangDanhSach[];
  total: number;
}
