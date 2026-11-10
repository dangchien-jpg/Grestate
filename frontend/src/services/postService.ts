import api from "@/lib/axios";
import type { FetchPostResponse, TinDang, TinDangDanhSach } from "@/types/post";

export const postService = {
  fetchPostsByUser: async (signal?: AbortSignal): Promise<FetchPostResponse> =>
    (await api.get<FetchPostResponse>("/posts/me", { signal })).data,

  updatePost: async (id: number, formData: FormData): Promise<
    TinDang & Pick<TinDangDanhSach, "hinhAnhTinDangs" | "anhDaiDienUrl">
  > => (await api.put(`/posts/${id}`, formData)).data.post,

  deletePost: async (id: number) => {
    await api.delete(`/posts/${id}`);
  },

  fetchPost: async () => {
    const res = await api.get("/posts");
    return res.data;
  },

  fetchDetailPost: async (maTinDang: number) => {
    const res = await api.get(`/posts/${maTinDang}`);
    return res.data;
  },

  createPost: async (formData: FormData): Promise<TinDang> => {
    const res = await api.post("/posts", formData);
    return res.data.post;
  },
};
