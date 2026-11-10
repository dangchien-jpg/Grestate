import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TinDangDanhSach } from "@/types/post";

export default function PostCensorGallery({ post }: { post: TinDangDanhSach }) {
  const urls = post.hinhAnhTinDangs.map((image) => image.hinhAnhUrl);
  if (post.anhDaiDienUrl && !urls.includes(post.anhDaiDienUrl))
    urls.unshift(post.anhDaiDienUrl);
  const [selected, setSelected] = useState(
    Math.max(0, urls.indexOf(post.anhDaiDienUrl ?? "")),
  );
  const move = (direction: number) =>
    setSelected((current) => (current + direction + urls.length) % urls.length);
  if (!urls.length)
    return (
      <p className="mt-4 rounded-sm bg-gray-50 p-4 text-sm">
        Tin đăng chưa có hình ảnh.
      </p>
    );
  return (
    <section
      aria-label="Hình ảnh bất động sản"
      className="mx-auto mt-5 w-full max-w-lg space-y-2.5"
    >
      <div className="relative aspect-video overflow-hidden rounded-sm bg-[#686660]">
        <button
          type="button"
          disabled={urls.length < 2}
          onClick={() => move(1)}
          aria-label="Xem ảnh tiếp theo"
          className="flex h-full w-full items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        >
          <img
            src={urls[selected]}
            alt={`${post.tieuDe} - ảnh ${selected + 1}`}
            className="h-full w-full object-contain"
          />
        </button>
        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Ảnh trước"
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-sm bg-white p-2 shadow hover:bg-gray-100"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Ảnh tiếp theo"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm bg-white p-2 shadow hover:bg-gray-100"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
        <span className="pointer-events-none absolute right-3 bottom-3 rounded-sm bg-black/70 px-2 py-1 text-xs font-semibold text-white">
          {selected + 1} / {urls.length}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto p-1">
        {urls.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => setSelected(index)}
            aria-label={`Xem ảnh ${index + 1}`}
            aria-pressed={selected === index}
            className={`w-20 shrink-0 overflow-hidden rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected === index ? "ring-2 ring-primary ring-offset-2" : ""}`}
          >
            <img
              src={url}
              alt={`Ảnh thu nhỏ ${index + 1}`}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
