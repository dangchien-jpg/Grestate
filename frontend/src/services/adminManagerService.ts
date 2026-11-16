import api from "@/lib/axios";
import { isAxiosError } from "axios";

export type ManagedUser = {
  maNguoiDung: number;
  maVaiTro: number;
  hoTen: string;
  email: string;
  soDienThoai: string | null;
  anhDaiDienUrl: string | null;
  duongDanZalo: string | null;
  emailDaXacThuc: boolean;
  trangThai: "HOAT_DONG" | "BI_CHAN";
  createdAt: string;
  updatedAt: string;
  vaiTro: { maVaiTro: number; tenVaiTro: string };
};
export type ManagedUserList = { users: ManagedUser[]; total: number };
type UserActionResponse = { message: string; user: ManagedUser };

export function managerUserError(error: unknown) {
  return isAxiosError(error) &&
    typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : "Không thể xử lý người dùng. Vui lòng thử lại.";
}

export const adminManagerService = {
  activeUsers: async (signal?: AbortSignal) =>
    (await api.get<ManagedUserList>("/admin/users/active", { signal })).data,
  blockedUsers: async (signal?: AbortSignal) =>
    (await api.get<ManagedUserList>("/admin/users/blocked", { signal })).data,
  block: async (id: number) =>
    (await api.put<UserActionResponse>(`/admin/users/${id}/block`)).data,
  unblock: async (id: number) =>
    (await api.put<UserActionResponse>(`/admin/users/${id}/unblock`)).data,
};
