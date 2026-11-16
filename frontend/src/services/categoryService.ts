import api from "@/lib/axios";
import type { LoaiBatDongSan } from "@/types/post";

export type CategoryPayload = Pick<
  LoaiBatDongSan,
  "tenLoai" | "nhomBatDongSan" | "moTa"
>;

export const categoryService = {
  fetchCategories: async (signal?: AbortSignal) => {
    const res = await api.get<{ categories: LoaiBatDongSan[] }>("/categories", {
      signal,
    });
    return res.data.categories;
  },
  create: async (data: CategoryPayload) =>
    (
      await api.post<{ message: string; category: LoaiBatDongSan }>(
        "/admin/categories",
        data,
      )
    ).data,
  update: async (id: number, data: CategoryPayload) =>
    (
      await api.put<{ message: string; category: LoaiBatDongSan }>(
        `/admin/categories/${id}`,
        data,
      )
    ).data,
  remove: async (id: number) =>
    (await api.delete<{ message: string }>(`/admin/categories/${id}`)).data,
};
