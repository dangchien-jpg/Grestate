import api from "@/lib/axios";
import type { PublicAuthorPosts, FetchPostResponse, TinDang, TinDangDanhSach } from "@/types/post";

export const postService = {
  fetchPostsByUserPublic: async (id: string, signal: AbortSignal) =>
    (await api.get<PublicAuthorPosts>(`/posts/user/${encodeURIComponent(id)}`, { signal })).data,

  fetchPostsByUser: async (signal?: AbortSignal): Promise<FetchPostResponse> =>
    (await api.get<FetchPostResponse>("/posts/me", { signal })).data,

  updatePost: async (id: number, formData: FormData): Promise<
    TinDang & Pick<TinDangDanhSach, "hinhAnhTinDangs" | "anhDaiDienUrl">
  > => (await api.put(`/posts/${id}`, formData)).data.post,

  hidePost: async (id: number) => {
    await api.patch(`/posts/${id}/hide`);
  },

  unHidePost: async (id: number) => {
    await api.patch(`/posts/${id}/unhide`);
  },

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
