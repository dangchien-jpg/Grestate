import api from "@/lib/axios";

export interface UserNotification {
  maThongBao: number;
  tieuDe: string;
  noiDung: string;
  daDoc: boolean;
  createdAt: string;
}

export const notificationService = {
  async fetchAll(signal: AbortSignal) {
    const { data } = await api.get<{ notifications: UserNotification[] }>("/notifications", { signal });
    return data.notifications;
  },
  async markRead(id: number) {
    await api.patch(`/notifications/${id}/read`);
  },
};
