import api from "@/lib/axios";
import type { SearchResponse } from "@/services/searchService";

export type PriceRange = "negotiable" | "under-1" | "1-3" | "3-5" | "5-10" | "over-10";
export type AreaRange =
  | "under-50"
  | "50-100"
  | "100-200"
  | "200-500"
  | "over-500";
export type PriceSelection = PriceRange | { minPrice?: number; maxPrice?: number };
export type PostFilter =
  | { type: "price"; range: PriceSelection; label: string }
  | { type: "area"; range: AreaRange; label: string }
  | { type: "category"; maLoaiBatDongSan: number; label: string }
  | { type: "location"; maTinhThanh: string; label: string };
export const filterService = {
  filterPostByCategory: async (maLoaiBatDongSan: number, page = 1, signal?: AbortSignal) =>
    (await api.get<SearchResponse>("/posts/filter/category", { params: { maLoaiBatDongSan, page, limit: 12 }, signal })).data,
  filterPostByLocation: async (maTinhThanh: string, page = 1, signal?: AbortSignal) =>
    (await api.get<SearchResponse>("/posts/filter/location", { params: { maTinhThanh, page, limit: 12 }, signal })).data,
  filterPrice: async (range: PriceSelection, page = 1, signal?: AbortSignal) =>
    (
      await api.get<SearchResponse>("/posts/filter/price", {
        params: { ...(typeof range === "string" ? { range } : range), page, limit: 12 },
        signal,
      })
    ).data,
  filterArea: async (range: AreaRange, page = 1, signal?: AbortSignal) =>
    (
      await api.get<SearchResponse>("/posts/filter/area", {
        params: { ...(typeof range === "string" ? { range } : range), page, limit: 12 },
        signal,
      })
    ).data,
};
