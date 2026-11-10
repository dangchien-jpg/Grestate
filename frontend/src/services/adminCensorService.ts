import api from "@/lib/axios";
import { isAxiosError } from "axios";
import type { TinDangDanhSach, LichSuKiemDuyet } from "@/types/post";

export type CensorDetail = TinDangDanhSach & {
  lichSuKiemDuyets: (LichSuKiemDuyet & { nguoiDung: { hoTen: string } })[];
};
export const censorStatuses: Record<string, string> = {
  CHO_KIEM_DUYET: "Chờ kiểm duyệt",
  DA_DUYET: "Đã duyệt",
  TU_CHOI: "Từ chối",
};
export function censorError(error: unknown) {
  return isAxiosError(error) &&
    typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : "Không thể xử lý. Vui lòng thử lại.";
}
export const adminCensorService = {
  list: async (
    params: { status: string; page: number },
    signal?: AbortSignal,
  ) =>
    (
      await api.get<{ posts: TinDangDanhSach[]; total: number }>(
        "/admin/posts",
        { params: { ...params, limit: 9 }, signal },
      )
    ).data,
  detail: async (id: number, signal?: AbortSignal) =>
    (await api.get<{ post: CensorDetail }>(`/admin/posts/${id}`, { signal }))
      .data.post,
  accept: async (id: number) => {
    await api.put(`/admin/accept-post/${id}`);
    window.dispatchEvent(new Event("admin-censor-updated"));
  },
  reject: async (id: number, lyDoTuChoi: string) => {
    await api.put(`/admin/reject-post/${id}`, { lyDoTuChoi });
    window.dispatchEvent(new Event("admin-censor-updated"));
  },
};

export const censorStatusClasses: Record<string, string> = {
  DA_DUYET: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CHO_KIEM_DUYET: "border-amber-200 bg-amber-50 text-amber-700",
  TU_CHOI: "border-red-200 bg-red-50 text-red-600",
};
