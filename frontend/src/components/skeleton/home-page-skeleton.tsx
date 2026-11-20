export default function HomePageSkeleton() {
  return (
    <div role="status" className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <span className="sr-only">Đang tải trang chủ…</span>
      <div
        aria-hidden="true"
        className="grid items-start gap-6 motion-safe:animate-pulse lg:grid-cols-[210px_minmax(0,1fr)]"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {[0, 1].map((group) => (
            <div key={group} className="space-y-3 rounded-sm border p-4">
              <div className="h-5 w-28 rounded bg-gray-200" />
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-4 w-2/3 rounded bg-gray-100" />
              ))}
            </div>
          ))}
        </div>
        <div className="min-w-0 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="h-12 rounded bg-gray-200 sm:flex-1" />
            <div className="h-12 rounded bg-gray-200 sm:w-28" />
            <div className="h-12 rounded bg-gray-200 sm:w-24" />
          </div>
          <div className="h-10 rounded bg-gray-100" />
          <div className="h-7 w-52 rounded bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-sm border">
                <div className="aspect-[1.9] bg-gray-200" />
                <div className="space-y-3 p-3">
                  <div className="h-10 rounded bg-gray-100" />
                  <div className="h-3 w-4/5 rounded bg-gray-100" />
                  <div className="h-3 w-2/3 rounded bg-gray-100" />
                  <div className="h-5 w-1/3 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
