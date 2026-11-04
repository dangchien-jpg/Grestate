import { postService } from "@/services/postService";
import type { PostState } from "@/types/store";
import { create } from "zustand";

export const usePostStore = create<PostState>((set) => ({
  posts: [],
  post: null,
  loading: false,
  fetchPost: async () => {
    try {
      const data = await postService.fetchPost();
      set({ posts: data.posts });
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  fetchDetailPost: async (maTinDang) => {
    try {
      const data = await postService.fetchDetailPost(maTinDang);
      set({ post: data.post });
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
