export interface VaiTro {
  maVaiTro: number;
  tenVaiTro: string;
  moTa: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NguoiDung {
  maNguoiDung: number;
  maVaiTro: number;
  hoTen: string;
  email: string;
  soDienThoai: string | null;
  anhDaiDien: string | null;
  duongDanZalo: string | null;
  emailDaXacThuc: boolean;
  trangThai: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  vaiTro?: VaiTro;
}
