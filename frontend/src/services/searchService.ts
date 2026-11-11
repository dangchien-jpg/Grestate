import api from "@/lib/axios";
import { isAxiosError } from "axios";
import type { TinDangDanhSach } from "@/types/post";

export type SearchSuggestion = {
  label: string;
  maLoaiBatDongSan: number;
  maPhuongXa: number;
  maTinhThanh: string;
};
export type SearchQuery = {
  keyword?: string;
  maLoaiBatDongSan?: number;
  maPhuongXa?: number;
};
export type SearchResponse = {
  posts: TinDangDanhSach[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
export const searchService = {
  searchPost: async (query: SearchQuery, page = 1, signal?: AbortSignal) =>
    (
      await api.get<SearchResponse>("/posts/search", {
        params: { ...query, page, limit: 12 },
        signal,
      })
    ).data,
  suggestions: async (keyword: string, signal?: AbortSignal) =>
    (
      await api.get<{ suggestions: SearchSuggestion[] }>("/posts/suggestions", {
        params: { keyword, limit: 8 },
        signal,
      })
    ).data.suggestions,
};
export function searchError(error: unknown) {
  return isAxiosError(error) &&
    typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : "Không thể tìm kiếm. Vui lòng thử lại.";
}
