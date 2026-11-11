import { filterService, type PostFilter } from "@/services/filterService";
import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  searchError,
  searchService,
  type SearchQuery,
  type SearchResponse,
} from "@/services/searchService";
import type { TinDangDanhSach } from "@/types/post";
import SearchBar from "./search-bar";

export default function SearchPanel({
  posts,
  filters,
  children,
  filter = null,
  onClearFilter,
  onFilterPage,
}: {
  filter?: (PostFilter & { page: number }) | null;
  onClearFilter?: () => void;
  onFilterPage?: (page: number) => void;
  posts: TinDangDanhSach[];
  filters: ReactNode;
  children: (posts: TinDangDanhSach[]) => ReactNode;
}) {
  const [search, setSearch] = useState<{
    query: SearchQuery;
    label: string;
    page: number;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify([search, filter, retry]);
  const [result, setResult] = useState<{
    key: string;
    data: SearchResponse | null;
    error: string;
  } | null>(null);
  const current = result?.key === key ? result : null;
  useEffect(() => {
    if (!search && !filter) return;
    const controller = new AbortController();
    const request = filter
      ? filter.type === "price"
        ? filterService.filterPrice(filter.range, filter.page, controller.signal)
        : filter.type === "area"
          ? filterService.filterArea(filter.range, filter.page, controller.signal)
          : filter.type === "category"
            ? filterService.filterPostByCategory(filter.maLoaiBatDongSan, filter.page, controller.signal)
            : filterService.filterPostByLocation(filter.maTinhThanh, filter.page, controller.signal)
      : searchService.searchPost(search!.query, search!.page, controller.signal);
    request
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ key, data: null, error: searchError(error) });
      });
    return () => controller.abort();
  }, [search, filter, key]);
  const active = !!(filter || search);
  const page = filter?.page ?? search?.page ?? 1;
  function changePage(nextPage: number) {
    if (filter) onFilterPage?.(nextPage);
    else if (search) setSearch({ ...search, page: nextPage });
  }
  const visiblePosts = active ? (current?.data?.posts ?? []) : posts;
  return (
    <>
      <SearchBar
        onSearch={(query, label) => {
          onClearFilter?.();
          setSearch(query ? { query, label, page: 1 } : null);
        }}
      />
      {filters}
      <section
        id="listings"
        aria-labelledby="listings-title"
        className="scroll-mt-24"
      >
        <h1
          id="listings-title"
          className="mb-5 text-xl font-bold tracking-tight sm:text-2xl"
        >
          {filter ? `Kết quả lọc: ${filter.label}` : search
            ? `Kết quả tìm kiếm: ${search.label}`
            : "Bất động sản nổi bật"}
        </h1>
        {filter && <button type="button" className="mb-4 text-sm text-primary underline" onClick={() => { setSearch(null); onClearFilter?.(); }}>Bỏ lọc</button>}
        {active && !current ? (
          <p
            role="status"
            className="flex items-center justify-center gap-2 py-10 text-sm"
          >
            <LoaderCircle className="size-5 animate-spin" />
            Đang tìm kiếm...
          </p>
        ) : current?.error && active ? (
          <div role="alert" className="py-6 text-sm text-red-600">
            {current.error}
            <button
              onClick={() => setRetry((value) => value + 1)}
              className="ml-3 underline"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {active && (
              <p role="status" className="mb-4 text-sm text-gray-600">
                Tìm thấy {current?.data?.total ?? 0} tin đăng
              </p>
            )}
            {visiblePosts.length ? (
              children(visiblePosts)
            ) : (
              <p className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
                {active
                  ? "Không tìm thấy tin đăng phù hợp."
                  : "Chưa có tin đăng để hiển thị."}
              </p>
            )}
            {active && current?.data && current.data.totalPages > 1 && (
              <nav
                aria-label="Phân trang tìm kiếm"
                className="mt-6 flex items-center justify-center gap-4 text-sm"
              >
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() =>
                    changePage(page - 1)
                  }
                >
                  Trước
                </Button>
                <span>
                  Trang {page} / {current.data.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= current.data.totalPages}
                  onClick={() =>
                    changePage(page + 1)
                  }
                >
                  Sau
                </Button>
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}
