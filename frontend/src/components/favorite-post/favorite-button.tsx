import { Heart, LoaderCircle } from "lucide-react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import type { TinDangDanhSach } from "@/types/post";

export default function FavoriteButton({
  post,
  className = "",
}: {
  post: TinDangDanhSach;
  className?: string;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const saved = useFavoriteStore((state) =>
    state.posts.some((item) => item.maTinDang === post.maTinDang),
  );
  const pending = useFavoriteStore((state) =>
    state.pendingIds.includes(post.maTinDang),
  );
  const loading = useFavoriteStore((state) => state.loading);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);

  async function toggle() {
    if (!user) {
      toast.info("Vui lòng đăng nhập để lưu tin đăng");
      navigate("/signin");
      return;
    }
    try {
      const result = await toggleFavorite(post);
      if (result !== null)
        toast.success(result ? "Đã lưu tin đăng" : "Đã bỏ lưu tin đăng");
    } catch (error) {
      toast.error(
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Không thể cập nhật tin đã lưu. Vui lòng thử lại.",
      );
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={saved ? "Bỏ lưu tin đăng" : "Lưu tin đăng"}
      aria-pressed={saved}
      aria-busy={pending || loading}
      title={saved ? "Bỏ lưu tin đăng" : "Lưu tin đăng"}
      disabled={pending || loading}
      className={`${saved ? "text-red-500 hover:text-red-600" : ""} ${className}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggle();
      }}
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
      ) : (
        <Heart
          aria-hidden="true"
          className={`size-5 ${saved ? "fill-current" : ""}`}
        />
      )}
    </Button>
  );
}
