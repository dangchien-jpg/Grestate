import DetailedCard from "@/components/property/detailed-card";
import FilterBox from "@/components/filter/filter-box";
import ListingFilters from "@/components/filter/listing-filters";
import {
  emptyFilters,
  matches,
  searchMatches,
  type Filters,
} from "@/lib/listing-filters";
import { Dialog } from "@base-ui/react/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchBar from "@/components/search/search-bar";
import { Button } from "@/components/ui/button";
import type { SearchQuery } from "@/services/searchService";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Link, useLocation, useSearchParams } from "react-router";
import { usePostStore } from "@/stores/postStore";
import { useFavorites } from "@/hooks/use-favorites";

export default function PropertyListPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  useFavorites();
  const { posts, fetchPost } = usePostStore();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    fetchPost()
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchPost, retry]);
  function retryFetch() {
    setFailed(false);
    setLoading(true);
    setRetry((attempt) => attempt + 1);
  }

  const initialCity = location.state?.filter;
  const [filters, setFilters] = useState<Filters>(() => ({
    ...emptyFilters,
    city: initialCity?.maTinhThanh ?? "",
  }));
  const [draft, setDraft] = useState(filters);
  const [quickActive, setQuickActive] = useState(false);
  const quick = quickActive ? filters : emptyFilters;
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState<SearchQuery>({
    keyword: params.get("q") ?? "",
  });
  const [label, setLabel] = useState(params.get("q") ?? "");
  const [searchKey, setSearchKey] = useState(0);
  const [sort, setSort] = useState("new");
  const [page, setPage] = useState(1);
  const searched = useMemo(
    () => posts.filter((p) => searchMatches(p, query)),
    [posts, query],
  );
  const results = useMemo(
    () =>
      searched
        .filter((p) => matches(p, filters))
        .sort((a, b) =>
          sort === "low"
            ? a.giaNiemYet - b.giaNiemYet
            : sort === "high"
              ? b.giaNiemYet - a.giaNiemYet
              : (b.ngayDang ?? "").localeCompare(a.ngayDang ?? ""),
        ),
    [searched, filters, sort],
  );
  function countMatches(overrides: Partial<Filters> = {}) {
    const criteria = { ...emptyFilters, ...overrides };
    return searched.filter((post) => matches(post, criteria)).length;
  }
  const draftCount = searched.filter((post) => matches(post, draft)).length;
  function selectQuick(criteria: Partial<Filters>) {
    setQuickActive(true);
    setFilters({ ...emptyFilters, ...criteria });
    setPage(1);
  }
  function apply(next: Filters) {
    setQuickActive(false);
    setFilters(next);
    setDraft(next);
    setPage(1);
  }
  function restore(next: Filters, q: SearchQuery, text: string) {
    apply(next);
    setQuery(q);
    setLabel(text);
    setSearchKey((k) => k + 1);
  }
  function reset() {
    restore(emptyFilters, {}, "");
  }
  const city =
    posts.find((p) => p.phuongXa.maTinhThanh === filters.city)?.phuongXa
      .tinhThanh.tenTinhThanh ||
    (initialCity?.maTinhThanh === filters.city ? initialCity?.label : "");
  const ward = posts.find((p) => String(p.maPhuongXa) === filters.ward)
    ?.phuongXa.tenPhuongXa;
  const place = [ward, filters.district, city].filter(Boolean).join(", ");
  const heading =
    results.length + " tin nhà đất bán" + (place ? " tại " + place : "");
  useEffect(() => {
    const previous = document.title;
    document.title = heading + " | Grestate";
    return () => {
      document.title = previous;
    };
  }, [heading]);
  const filterLabels = [
    label,
    ...filters.category,
    ...filters.direction,
    ...filters.legal,
    ...filters.furnishing,
    place,
    filters.bathrooms && filters.bathrooms + " phòng tắm",
    filters.bedrooms && filters.bedrooms + " phòng ngủ",
  ].filter(Boolean);
  for (const [low, high, unit] of [
    ["minPrice", "maxPrice", "tỷ"],
    ["minArea", "maxArea", "m²"],
  ] as const) {
    if (filters[low] || filters[high]) {
      filterLabels.push(
        [
          filters[low] && "từ " + filters[low],
          filters[high] && "đến " + filters[high],
          unit,
        ]
          .filter(Boolean)
          .join(" "),
      );
    }
  }
  const pages = Math.max(1, Math.ceil(results.length / 12));
  const current = Math.min(page, pages);
  const visible = results.slice((current - 1) * 12, current * 12);
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />
      <main className="mx-auto max-w-[1360px] px-4 py-5 sm:px-8">
        <nav
          aria-label="Đường dẫn"
          className="mb-4 flex items-center gap-2 text-sm "
        >
          <Link to="/">Trang chủ</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">
            Nhà đất bán{place ? " tại " + place : ""}
          </span>
        </nav>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(300px,27%)_minmax(0,1fr)]">
          <aside className="hidden space-y-2 lg:block">
            <ListingFilters
              posts={posts}
              value={draft}
              change={setDraft}
              resultCount={draftCount}
              onApply={() => apply(draft)}
            />
          </aside>
          <section className="min-w-0 space-y-4">
            <SearchBar
              key={searchKey}
              initialValue={label}
              onSearch={(next, text) => {
                setQuery(next ?? {});
                setLabel(text);
                setPage(1);
              }}
            />
            <FilterBox
              posts={posts}
              selected={quick}
              countMatches={countMatches}
              onSelect={selectQuick}
            />
            <Dialog.Root open={drawer} onOpenChange={setDrawer}>
              <Dialog.Trigger
                render={<Button variant="outline" className="h-11 lg:hidden" />}
              >
                <SlidersHorizontal />
                Bộ lọc
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" />
                <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-[min(92vw,400px)] flex-col bg-white shadow-xl">
                  <header className="flex items-center justify-between border-b px-4 py-2">
                    <Dialog.Title className="font-bold">Bộ lọc</Dialog.Title>
                    <Dialog.Close
                      render={
                        <Button
                          variant="ghost"
                          className="size-11"
                          aria-label="Đóng bộ lọc"
                        />
                      }
                    >
                      <X />
                    </Dialog.Close>
                  </header>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <ListingFilters
                      posts={posts}
                      value={draft}
                      change={setDraft}
                      resultCount={draftCount}
                      onApply={() => {
                        apply(draft);
                        setDrawer(false);
                      }}
                    />
                  </div>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <h1 aria-live="polite" className="text-xl font-semibold">
                  {loading && !posts.length ? "Nhà đất bán" : heading}
                </h1>
                {!!filterLabels.length && (
                  <div className="flex flex-wrap items-center gap-x-3">
                    <p className="text-sm" role="status">
                      Kết quả lọc {filterLabels.join(", ")}
                    </p>
                    <Button variant="link" className="h-8 px-0" onClick={reset}>
                      Bỏ lọc
                    </Button>
                  </div>
                )}
              </div>
              <Select
                value={sort}
                items={{
                  new: "Mới nhất",
                  low: "Giá tăng dần",
                  high: "Giá giảm dần",
                }}
                onValueChange={(v) => {
                  if (v) {
                    setSort(v);
                    setPage(1);
                  }
                }}
              >
                <SelectTrigger
                  aria-label="Sắp xếp"
                  className="h-11 w-36 rounded-sm pl-3"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    ["new", "Mới nhất"],
                    ["low", "Giá tăng dần"],
                    ["high", "Giá giảm dần"],
                  ].map(([v, t]) => (
                    <SelectItem key={v} value={v}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {failed && (
              <div role="alert">
                Không tải được tin đăng.{" "}
                <Button variant="link" onClick={retryFetch}>
                  Thử lại
                </Button>
              </div>
            )}
            {loading && !posts.length ? (
              <div
                role="status"
                aria-label="Đang tải tin đăng"
                className="space-y-3"
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex h-44 gap-4 rounded-sm border bg-white p-3 motion-safe:animate-pulse"
                  >
                    <div className="w-1/3 " />
                    <div className="flex-1 space-y-4 pt-3">
                      <div className="h-4 w-3/4 " />
                      <div className="h-3 w-1/2 " />
                    </div>
                  </div>
                ))}
              </div>
            ) : !results.length && !failed ? (
              <div className="rounded-sm border bg-white p-8 text-center">
                <h2 className="font-bold">Chưa tìm thấy tin phù hợp</h2>
                <p className="my-2 text-sm">
                  Thử mở rộng khoảng giá, chọn thêm khu vực hoặc bỏ bớt điều
                  kiện.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {visible.map((post) => (
                  <DetailedCard key={post.maTinDang} post={post} />
                ))}
              </div>
            )}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <Button
                  className="h-11"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                >
                  Trước
                </Button>
                {current} / {pages}
                <Button
                  className="h-11"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                >
                  Sau
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
