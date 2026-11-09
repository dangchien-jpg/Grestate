import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";

export function useFavorites() {
  const userId = useAuthStore((state) => state.user?.maNguoiDung);
  const fetchFavorites = useFavoriteStore((state) => state.fetchFavorites);
  useEffect(() => {
    if (userId) void fetchFavorites().catch(() => {});
  }, [userId, fetchFavorites]);
}
