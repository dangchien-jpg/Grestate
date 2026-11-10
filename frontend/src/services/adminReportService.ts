import api from "@/lib/axios";
import { isAxiosError } from "axios";

export const reportStatuses: Record<string, string> = {
  CHO_XU_LY: "Chờ xử lý",
  DANG_XU_LY: "Đang xử lý",
  CO_VI_PHAM: "Có vi phạm",
  KHONG_VI_PHAM: "Không vi phạm",
};
export type AdminReport = {
  maBaoCao: number;
  maTinDang: number;
  noiDung: string;
  ngayBaoCao: string;
  ngayXuLy: string | null;
  trangThai: string;
  ghiChu: string | null;
  nguoiBaoCao: { hoTen: string };
  tinDang: {
    maTinDang: number;
    tieuDe: string;
    trangThai: string;
    deletedAt?: string | null;
    hinhAnhTinDangs: { hinhAnhUrl: string }[];
  };
};
export type ReportDetail = AdminReport & {
  tinDang: AdminReport["tinDang"] & {
    moTa: string;
    giaNiemYet: string | number;
    dienTich: string | number;
    diaChiChiTiet: string;
    nguoiDang: { hoTen: string };
    phuongXa: { tenPhuongXa: string; tinhThanh: { tenTinhThanh: string } };
  };
};
export function reportError(error: unknown) {
  return isAxiosError(error) &&
    typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : "Không thể tải hoặc xử lý báo cáo. Vui lòng thử lại.";
}
export const adminReportService = {
  list: async (status: string, page: number, signal?: AbortSignal) =>
    (
      await api.get<{ reports: AdminReport[]; total: number }>("/report", {
        params: { status, page },
        signal,
      })
    ).data,
  detail: async (id: number, signal?: AbortSignal) =>
    (await api.get<{ report: ReportDetail }>(`/report/${id}`, { signal })).data
      .report,
  resolve: async (id: number, violation: boolean, ghiChu: string) => {
    await api.put(`/report/${id}/${violation ? "violation" : "no-violation"}`, {
      ghiChu,
    });
    window.dispatchEvent(new Event("admin-report-updated"));
    window.dispatchEvent(new Event("admin-censor-updated"));
  },
};
