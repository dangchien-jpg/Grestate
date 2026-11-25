import { useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { TinDangDanhSach } from "@/types/post";

export default function PostGallery({ post }: { post: TinDangDanhSach }) {
  const urls = post.hinhAnhTinDangs.map((photo) => photo.hinhAnhUrl);
  if (post.anhDaiDienUrl && !urls.includes(post.anhDaiDienUrl)) {
    urls.unshift(post.anhDaiDienUrl);
  }
  const coverIndex = Math.max(0, urls.indexOf(post.anhDaiDienUrl ?? ""));
  const items = urls.map(url => ({ url, video: false }));
  if (post.videoUrl) items.push({ url: post.videoUrl, video: true });
  const [selectedIndex, setSelectedIndex] = useState(coverIndex);
  const active = items[selectedIndex];
  const move = (direction: number) => {
    setSelectedIndex(
      (current) => (current + direction + items.length) % items.length,
    );
  };

  return (
    <section aria-label="Thư viện ảnh và video bất động sản" className="space-y-2.5">
      <div className="relative aspect-[16/10] max-h-[360px] overflow-hidden rounded-sm bg-[#686660] sm:aspect-[16/9]">
        {active?.video ? (
          <video key={active.url} src={active.url} controls playsInline preload="metadata"
            aria-label={`Video: ${post.tieuDe}`}
            className="h-full w-full bg-black object-contain" />
        ) : (
        <button
          type="button"
          disabled={items.length < 2}
          onClick={() => move(1)}
          aria-label="Xem mục tiếp theo"
          className="flex h-full w-full items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <img
            src={active?.url ?? "/placeholder.png"}
            alt={`${post.tieuDe} - ảnh ${selectedIndex + 1}`}
            fetchPriority="high"
            className="h-full w-full object-contain"
          />
        </button>
        )}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Mục trước"
              className="absolute top-1/2 left-4 -translate-y-1/2 rounded bg-white p-2.5 shadow-lg hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-white"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Mục tiếp theo"
              className="absolute top-1/2 right-4 -translate-y-1/2 rounded bg-white p-2.5 shadow-lg hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-white"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
        <span className="pointer-events-none absolute right-4 top-3 rounded bg-slate-950/75 px-3 py-1 text-sm font-semibold text-white">
          {items.length > 0 ? selectedIndex + 1 : 0} / {items.length}
        </span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto p-1">
        {items.map(({ url, video }, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => setSelectedIndex(index)}
            aria-label={video ? "Xem video bất động sản" : `Xem ảnh ${index + 1}`}
            aria-pressed={selectedIndex === index}
            className={`min-w-0 basis-[80px] sm:basis-[96px] shrink-0 overflow-hidden rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selectedIndex === index ? "ring-2 ring-primary ring-offset-2" : ""}`}
          >
            {video ? (
              <span className="flex aspect-[16/10] items-center justify-center gap-1 bg-slate-800 text-xs font-semibold text-white">
                <Play className="size-4" aria-hidden="true" /> Video
              </span>
            ) : (
            <img
              src={url}
              alt={`${post.tieuDe} - ${index + 1}`}
              loading="lazy"
              className="aspect-[16/10] w-full object-cover transition-opacity hover:opacity-80"
            />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
