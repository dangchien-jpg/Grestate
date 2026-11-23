import { useId, type ReactNode } from "react";
import { Slider } from "@base-ui/react/slider";
import { ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { TinDangDanhSach as Post } from "@/types/post";
import { emptyFilters, districtOf, type Filters } from "@/lib/listing-filters";

function Group({
  title,
  open = true,
  children,
}: {
  title: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group border-t">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={16} className="group-open:rotate-180" />
      </summary>
      <div className="pb-2">{children}</div>
    </details>
  );
}
function Chip({
  active,
  children,
  click,
}: {
  active: boolean;
  children: ReactNode;
  click: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      aria-pressed={active}
      className="min-h-11 min-w-11 px-2.5 text-xs"
      onClick={click}
    >
      {children}
    </Button>
  );
}
function Region({
  title,
  value,
  options,
  change,
}: {
  title: string;
  value: string;
  options: { value: string; label: string }[];
  change: (v: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {title}
      </label>
      <SearchableSelect
        id={id}
        name={id}
        value={value}
        options={[{ value: "", label: title }, ...options]}
        onValueChange={(v) => change(v ?? "")}
        triggerRef={null}
        onBlur={() => {}}
        placeholder={title}
        searchLabel={"Tìm " + title.toLowerCase()}
        emptyMessage="Chưa có địa điểm"
        className="h-11 rounded-sm px-3"
      />
    </div>
  );
}
type Props = {
  posts: Post[];
  value: Filters;
  change: (next: Filters) => void;
  resultCount: number;
  onApply: () => void;
};
export default function ListingFilters({
  posts,
  value: f,
  change,
  resultCount,
  onApply,
}: Props) {
  function multiple(
    key: "furnishing" | "legal" | "direction",
    names: (string | null | undefined)[],
  ) {
    const options = [...new Set(names.filter((v): v is string => !!v))].sort();
    return (
      <div className="flex flex-wrap gap-1">
        {options.map((v) => (
          <Chip
            key={v}
            active={f[key].includes(v)}
            click={() =>
              change({
                ...f,
                [key]: f[key].includes(v)
                  ? f[key].filter((x) => x !== v)
                  : [...f[key], v],
              })
            }
          >
            {v}
          </Chip>
        ))}
        {!options.length && <p className="text-sm ">Chưa có thông tin</p>}
      </div>
    );
  }
  function range(price: boolean) {
    const low = price ? "minPrice" : "minArea",
      high = price ? "maxPrice" : "maxArea";
    const unit = price ? "tỷ" : "m²";
    const max = Math.max(
      1,
      +f[low],
      +f[high],
      ...posts.map((p) => Math.ceil(price ? p.giaNiemYet / 1e9 : p.dienTich)),
    );
    return (
      <>
        <Slider.Root
          value={[+f[low], f[high] ? +f[high] : max]}
          min={0}
          max={max}
          step={price ? 0.01 : 1}
          onValueChange={([a, b]) =>
            change({
              ...f,
              [low]: a ? String(a) : "",
              [high]: b === max ? "" : String(b),
            })
          }
        >
          <Slider.Control className="mx-5 flex h-11 touch-none items-center">
            <Slider.Track className="relative h-1 w-full rounded-full bg-slate-300">
              <Slider.Indicator className="absolute h-full bg-primary" />
              {[0, 1].map((i) => (
                <Slider.Thumb
                  key={i}
                  index={i}
                  aria-label={(i ? "Đến " : "Từ ") + unit}
                  className="flex size-11 items-center justify-center rounded-full focus-within:ring-2 focus-within:ring-primary after:size-4 after:rounded-full after:border-2 after:border-primary after:bg-white"
                />
              ))}
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <div className="grid grid-cols-2 gap-2">
          {([low, high] as const).map((k, i) => (
            <label key={k} className="text-xs font-medium ">
              {i ? "Đến" : "Từ"} ({unit})
              <Input
                type="number"
                step="any"
                min="0"
                value={f[k]}
                placeholder={i ? "Không giới hạn" : "0"}
                className="mt-1 h-11  px-2 placeholder:"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v && Number(v) < 0) return;
                  const next = { ...f, [k]: v };
                  if (next[low] && next[high] && +next[low] > +next[high])
                    next[i ? low : high] = v;
                  change(next);
                }}
              />
            </label>
          ))}
        </div>
      </>
    );
  }
  const cityPosts = posts.filter(
    (p) => !f.city || p.phuongXa.maTinhThanh === f.city,
  );
  const districts = [
    ...new Set(cityPosts.map(districtOf).filter(Boolean)),
  ].sort();
  const wards = cityPosts.filter(
    (p) => !f.district || districtOf(p) === f.district,
  );
  const cities = new Map(
    posts.map((p) => [
      p.phuongXa.maTinhThanh,
      p.phuongXa.tinhThanh.tenTinhThanh,
    ]),
  );
  return (
    <section className="rounded-sm border bg-white px-3 pb-2 shadow-sm">
      <div className="flex items-center justify-between py-1">
        <h2 className="font-bold">Bộ lọc tìm kiếm</h2>
        <Button
          variant="ghost"
          className="h-11"
          onClick={() => change(emptyFilters)}
        >
          <RotateCcw />
          Đặt lại
        </Button>
      </div>
      <Group title="Khu vực">
        <div className="grid gap-1.5">
          <Region
            title="Tỉnh / thành phố"
            value={f.city}
            change={(city) => change({ ...f, city, district: "", ward: "" })}
            options={[...cities].map(([value, name]) => ({
              value,
              label: name,
            }))}
          />
          {f.city && !!districts.length && (
            <Region
              title="Quận / huyện"
              value={f.district}
              change={(district) => change({ ...f, district, ward: "" })}
              options={districts.map((value) => ({ value, label: value }))}
            />
          )}
          {f.city && (
            <Region
              title="Phường / xã"
              value={f.ward}
              change={(ward) => change({ ...f, ward })}
              options={[
                ...new Map(
                  wards.map((p) => [
                    String(p.maPhuongXa),
                    p.phuongXa.tenPhuongXa,
                  ]),
                ),
              ].map(([value, name]) => ({ value, label: name }))}
            />
          )}
        </div>
      </Group>
      <Group title="Khoảng giá">{range(true)}</Group>
      <Group title="Diện tích">{range(false)}</Group>
      {(
        [
          ["bedrooms", "Số phòng ngủ"],
          ["bathrooms", "Số phòng tắm"],
        ] as const
      ).map(([key, title]) => (
        <Group key={key} title={title}>
          <div className="flex flex-wrap gap-1">
            {["1", "2", "3", "4", "5+"].map((v) => (
              <Chip
                key={v}
                active={v === f[key]}
                click={() => change({ ...f, [key]: v === f[key] ? "" : v })}
              >
                {v}
              </Chip>
            ))}
          </div>
        </Group>
      ))}
      <Group title="Nội thất" open={false}>
        {multiple(
          "furnishing",
          posts.map((p) => p.noiThat?.trim()),
        )}
      </Group>
      <Group title="Pháp lý" open={false}>
        {multiple(
          "legal",
          posts.map((p) => p.giayToPhapLy?.tenGiayTo),
        )}
      </Group>
      <Group title="Hướng nhà" open={false}>
        {multiple(
          "direction",
          posts.map((p) => p.huongNha),
        )}
      </Group>
      <div className="border-t pt-3 pb-1">
        <Button type="button" className="h-11 w-full" onClick={onApply}>
          Áp dụng ({resultCount} tin)
        </Button>
      </div>
    </section>
  );
}
