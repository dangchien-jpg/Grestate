import api from "@/lib/axios";
import type { TinDang } from "@/types/post";

export const postService = {
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
