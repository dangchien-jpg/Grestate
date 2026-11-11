import axios from "axios";
import { isAxiosError } from "axios";

export type ChatPost = {
  maTinDang: number;
  tieuDe: string;
  giaNiemYet: string;
  dienTich: string;
  diaChiChiTiet: string;
  soPhongNgu: number | null;
  soPhongTam: number | null;
  anhDaiDienUrl: string | null;
};

export type ChatResponse = {
  reply: string;
  posts: ChatPost[];
  total: number;
  filters: Record<string, string | number> | null;
};

const chatApi = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const chatService = {
  sendMessage: async (message: string, signal?: AbortSignal) =>
    (
      await chatApi.post<ChatResponse>(
        "/chat",
        { message },
        { signal, timeout: 90_000 },
      )
    ).data,
};

export function chatError(error: unknown): string {
  if (isAxiosError(error)) {
    if (typeof error.response?.data?.message === "string")
      return error.response.data.message;
    if (error.code === "ECONNABORTED")
      return "Phản hồi quá lâu. Bạn hãy thử lại nhé.";
  }
  return "Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối và thử lại.";
}
