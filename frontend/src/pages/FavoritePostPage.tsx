import FavoritePostCard from "@/components/favorite-post/favorite-post-card";
import { isAxiosError } from "axios";
import { Heart, LoaderCircle } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useFavorites } from "@/hooks/use-favorites";

const FavoritePostPage = () => {
  useFavorites();
  const posts = useFavoriteStore((state) => state.posts);
  const loading = useFavoriteStore(
    (state) => state.loading || (!state.loaded && !state.error),
  );
  const error = useFavoriteStore((state) => state.error);
  const fetchFavorites = useFavoriteStore((state) => state.fetchFavorites);
  const removeFavorite = useFavoriteStore((state) => state.removeFavorite);
  const removingIds = useFavoriteStore((state) => state.pendingIds);
  async function remove(id: number) {
    try {
      if (await removeFavorite(id)) toast.success("Đã bỏ lưu tin đăng");
    } catch (error) {
      toast.error(
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Không thể bỏ lưu tin. Vui lòng thử lại.",
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 font-sans text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Bất động sản đã lưu
        </h1>
        {!loading && !error && (
          <div className="mt-6 mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Tổng số <strong className="text-slate-900">{posts.length}</strong>{" "}
              tin đăng
            </p>
          </div>
        )}
        {loading ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500"
          >
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            Đang tải tin đăng đã lưu...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-white p-6 text-sm"
          >
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              className="mt-3 rounded-lg"
              onClick={() => {
                void fetchFavorites(true).catch(() => {});
              }}
            >
              Thử lại
            </Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <Heart
              aria-hidden="true"
              className="mx-auto mb-4 size-10 text-primary/40"
            />
            <h2 className="text-lg font-semibold">Bạn chưa lưu tin đăng nào</h2>
            <p className="mt-2 text-sm text-slate-500">
              Các tin bạn lưu sẽ xuất hiện tại đây để tiện xem lại.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary/90"
            >
              Khám phá bất động sản
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <FavoritePostCard
                key={post.maTinDang}
                post={post}
                onRemove={remove}
                removing={removingIds.includes(post.maTinDang)}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FavoritePostPage;
