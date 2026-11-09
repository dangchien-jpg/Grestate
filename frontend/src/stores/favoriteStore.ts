import { create } from "zustand";
import { favoriteService } from "@/services/favoriteService";
import { useAuthStore } from "@/stores/authStore";
import type { FavoritePost } from "@/types/favorite-post";
import type { TinDangDanhSach } from "@/types/post";

interface FavoriteState {
  posts: FavoritePost[];
  loaded: boolean;
  loading: boolean;
  error: string;
  pendingIds: number[];
  fetchFavorites: (force?: boolean) => Promise<void>;
  toggleFavorite: (post: TinDangDanhSach) => Promise<boolean | null>;
  removeFavorite: (id: number) => Promise<boolean>;
}

let generation = 0;
let activeFetch: Promise<void> | null = null;
const emptyState = {
  posts: [],
  loaded: false,
  loading: false,
  error: "",
  pendingIds: [],
};

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  ...emptyState,
  fetchFavorites: (force = false) => {
    if (!useAuthStore.getState().user) return Promise.resolve();
    if (activeFetch) return activeFetch;
    if (get().loaded && !force) return Promise.resolve();
    const currentGeneration = generation;
    set({ loading: true, error: "" });
    const request = favoriteService
      .fetchAll()
      .then(({ posts }) => {
        if (generation === currentGeneration) set({ posts, loaded: true });
      })
      .catch((error: unknown) => {
        if (generation === currentGeneration) {
          set({ error: "Chưa tải được tin đăng đã lưu. Vui lòng thử lại." });
        }
        throw error;
      })
      .finally(() => {
        if (generation === currentGeneration) {
          set({ loading: false });
          activeFetch = null;
        }
      });
    activeFetch = request;
    return request;
  },
  toggleFavorite: async (post) => {
    if (
      !useAuthStore.getState().user ||
      get().pendingIds.includes(post.maTinDang)
    )
      return null;
    const currentGeneration = generation;
    const id = post.maTinDang;
    set((state) => ({ pendingIds: [...state.pendingIds, id] }));
    try {
      await get().fetchFavorites();
      if (generation !== currentGeneration) return null;
      const saved = get().posts.some((item) => item.maTinDang === id);
      if (saved) await favoriteService.remove(id);
      else await favoriteService.add(id);
      if (generation !== currentGeneration) return null;
      set((state) => ({
        posts: saved
          ? state.posts.filter((item) => item.maTinDang !== id)
          : [
              {
                maTinDang: post.maTinDang,
                tieuDe: post.tieuDe,
                giaNiemYet: post.giaNiemYet,
                dienTich: post.dienTich,
                soPhongNgu: post.soPhongNgu,
                soPhongTam: post.soPhongTam,
                diaChiChiTiet: post.diaChiChiTiet,
                ngayDang: post.ngayDang,
                createdAt: post.createdAt,
                trangThai: post.trangThai,
                phuongXa: post.phuongXa,
                anhDaiDienUrl: post.anhDaiDienUrl,
                soHinhAnh: post.hinhAnhTinDangs.length,
                ngayLuu: new Date().toISOString(),
                daYeuThich: true,
              },
              ...state.posts,
            ],
      }));
      return !saved;
    } finally {
      if (generation === currentGeneration) {
        set((state) => ({
          pendingIds: state.pendingIds.filter((item) => item !== id),
        }));
      }
    }
  },
  removeFavorite: async (id) => {
    if (!useAuthStore.getState().user || get().pendingIds.includes(id))
      return false;
    const currentGeneration = generation;
    set((state) => ({ pendingIds: [...state.pendingIds, id] }));
    try {
      await favoriteService.remove(id);
      if (generation !== currentGeneration) return false;
      set((state) => ({
        posts: state.posts.filter((post) => post.maTinDang !== id),
      }));
      return true;
    } finally {
      if (generation === currentGeneration) {
        set((state) => ({
          pendingIds: state.pendingIds.filter((item) => item !== id),
        }));
      }
    }
  },
}));

useAuthStore.subscribe((state, previous) => {
  if (state.user?.maNguoiDung !== previous.user?.maNguoiDung) {
    generation++;
    activeFetch = null;
    useFavoriteStore.setState(emptyState);
  }
});
