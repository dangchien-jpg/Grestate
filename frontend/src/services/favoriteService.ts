import api from "@/lib/axios";
import type { FavoritePostsResponse } from "@/types/favorite-post";

export const favoriteService = {
  fetchAll: async (signal?: AbortSignal) =>
    (await api.get<FavoritePostsResponse>("/favorites", { signal })).data,
  add: async (id: number) => {
    await api.post(`/favorites/post/${id}`);
  },
  remove: async (id: number) => {
    await api.delete(`/favorites/post/${id}`);
  },
};
