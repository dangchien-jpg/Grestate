import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Slider } from "@base-ui/react/slider";
import { ArrowRight, ChevronDown, CircleDollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PostFilter } from "@/services/filterService";

export default function PricePicker({
  selected,
  onSelect,
}: {
  selected?: PostFilter | null;
  onSelect?: (filter: PostFilter | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [minimum, setMinimum] = useState("");
  const [maximum, setMaximum] = useState("");
  const [error, setError] = useState("");
  const low = minimum === "" ? 0 : Number(minimum);
  const high = maximum === "" ? 20 : Number(maximum);
  const ceiling = Math.max(
    20,
    Number.isFinite(high) ? high : 20,
    Number.isFinite(low) ? low : 0,
  );
  function apply() {
    if (!minimum && !maximum) {
      onSelect?.(null);
      setOpen(false);
      return;
    }
    if (
      [minimum, maximum].some(
        (value) =>
          value !== "" &&
          (!Number.isFinite(Number(value)) ||
            Number(value) < 0 ||
            Number(value) > 1_000_000 ||
            !Number.isSafeInteger(Math.round(Number(value) * 1e9))),
      )
    ) {
      setError("Vui lòng nhập giá từ 0 đến 1 triệu tỷ.");
      return;
    }
    if (minimum !== "" && maximum !== "" && low > high) {
      setError("Giá thấp nhất không được lớn hơn giá cao nhất.");
      return;
    }
    const label =
      minimum && maximum
        ? `${low} - ${high} tỷ`
        : minimum
          ? `Từ ${low} tỷ`
          : `Đến ${high} tỷ`;
    onSelect?.({
      type: "price",
      range: {
        ...(minimum !== "" && { minPrice: Math.round(low * 1e9) }),
        ...(maximum !== "" && { maxPrice: Math.round(high * 1e9) }),
      },
      label,
    });
    setOpen(false);
  }
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          const range = selected?.type === "price" ? selected.range : undefined;
          setMinimum(
            typeof range === "object" && range.minPrice !== undefined
              ? String(range.minPrice / 1e9)
              : "",
          );
          setMaximum(
            typeof range === "object" && range.maxPrice !== undefined
              ? String(range.maxPrice / 1e9)
              : "",
          );
          setError("");
        }
      }}
    >
      <Popover.Trigger className="flex h-12 w-full min-w-0 items-center gap-3 rounded-sm border border-[#ccc] bg-white px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <CircleDollarSign className="size-5 shrink-0 text-primary" />
        <span className="flex-1 truncate text-left">
          {selected?.type === "price" ? selected.label : "Tất cả mức giá"}
        </span>
        <ChevronDown className="size-4 shrink-0" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start" className="z-50">
          <Popover.Popup className="w-[min(420px,calc(100vw-2rem))] rounded-sm border bg-white shadow-sm outline-none">
            <div className="flex items-center justify-between border-b p-4">
              <Popover.Title className="flex-1 text-center text-lg font-bold">
                Khoảng giá
              </Popover.Title>
              <Popover.Close
                aria-label="Đóng chọn giá"
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="size-5" />
              </Popover.Close>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                apply();
              }}
              className="p-5"
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                <label className="min-w-0 text-sm font-medium">
                  Giá thấp nhất
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="any"
                    value={minimum}
                    onChange={(event) => {
                      setMinimum(event.target.value);
                      setError("");
                    }}
                    placeholder="Từ"
                    className="mt-2 h-10 w-full rounded-sm border-[#ccc] shadow-sm border px-3 text-center font-normal"
                  />
                </label>
                <ArrowRight aria-hidden="true" className="mb-3 size-4" />
                <label className="min-w-0 text-sm font-medium">
                  Giá cao nhất
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="any"
                    value={maximum}
                    onChange={(event) => {
                      setMaximum(event.target.value);
                      setError("");
                    }}
                    placeholder="Đến"
                    className="mt-2 h-10 w-full rounded-sm border-[#ccc] shadow-sm border  px-3 text-center font-normal"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs ">
                Đơn vị: tỷ đồng (ví dụ 0.5 = 500 triệu)
              </p>
              <Slider.Root
                value={[
                  Math.max(
                    0,
                    Math.min(Number.isFinite(low) ? low : 0, ceiling),
                  ),
                  Math.max(
                    0,
                    Math.min(
                      Number.isFinite(high)
                        ? Math.max(high, low || 0)
                        : ceiling,
                      ceiling,
                    ),
                  ),
                ]}
                min={0}
                max={ceiling}
                step={0.1}
                onValueChange={(values) => {
                  setMinimum(String(values[0]));
                  setMaximum(String(values[1]));
                  setError("");
                }}
                className="my-5"
              >
                <Slider.Control className="flex h-7 touch-none items-center">
                  <Slider.Track className="relative h-1.5 w-full rounded-full bg-gray-200">
                    <Slider.Indicator className="rounded-full bg-primary" />
                    <Slider.Thumb
                      index={0}
                      aria-label="Giá thấp nhất (tỷ đồng)"
                      className="size-6 rounded-full bg-primary ring-2 ring-white focus-visible:outline-2 "
                    />
                    <Slider.Thumb
                      index={1}
                      aria-label="Giá cao nhất (tỷ đồng)"
                      className="size-6 rounded-full bg-primary ring-2 ring-white focus-visible:outline-2 "
                    />
                  </Slider.Track>
                </Slider.Control>
              </Slider.Root>
              {error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {error}
                </p>
              )}
              <div className="mt-5 flex justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onSelect?.(null);
                    setOpen(false);
                  }}
                >
                  Bỏ lọc
                </Button>
                <Button type="submit">Áp dụng</Button>
              </div>
            </form>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
