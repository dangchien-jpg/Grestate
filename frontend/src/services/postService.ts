import api from "@/lib/axios";

export const postService = {
  fetchPost: async () => {
    const res = await api.get("/posts");
    return res.data;
  },

  fetchDetailPost: async (maTinDang: number) => {
    const res = await api.get(`/posts/${maTinDang}`);
    return res.data;
  },
};
