import PricePicker from "./price-picker";
import type { PostFilter } from "@/services/filterService";
import { House, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TinDangDanhSach } from "@/types/post";

export default function FilterBox({
  posts,
  selected,
  onSelect,
}: {
  posts: TinDangDanhSach[];
  selected?: PostFilter | null;
  onSelect?: (filter: PostFilter | null) => void;
}) {
  const categories = [
    { value: "all", label: "Tất cả loại bất động sản" },
    ...Array.from(
      new Map(
        posts.map((post) => [
          post.loaiBatDongSan.maLoaiBatDongSan,
          {
            value: String(post.loaiBatDongSan.maLoaiBatDongSan),
            label: post.loaiBatDongSan.tenLoai,
          },
        ]),
      ).values(),
    ),
  ];
  const regions = [
    { value: "all", label: "Tất cả khu vực" },
    ...Array.from(
      new Map(
        posts.map((post) => [
          post.phuongXa.tinhThanh.maTinhThanh,
          {
            value: post.phuongXa.tinhThanh.maTinhThanh,
            label: post.phuongXa.tinhThanh.tenTinhThanh,
          },
        ]),
      ).values(),
    ),
  ];
  const filters = [
    {
      type: "category",
      label: "Loại bất động sản",
      icon: House,
      items: categories,
    },

    { type: "location", label: "Khu vực", icon: MapPin, items: regions },
  ] as const;
  return (
    <div aria-label="Bộ lọc tìm kiếm" className="grid gap-3 sm:grid-cols-3">
      {filters.map(({ type, label, icon: Icon, items }) => (
        <div key={label} className="relative min-w-0">
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-primary"
          />
          <Select
            items={items}
            value={
              selected?.type === type
                ? selected.type === "category"
                  ? String(selected.maLoaiBatDongSan)
                  : selected.type === "location"
                    ? selected.maTinhThanh
                    : "all"
                : "all"
            }
            onValueChange={(value) => {
              if (!value || value === "all") {
                onSelect?.(null);
                return;
              }
              const item = items.find((option) => option.value === value);
              if (!item) return;
              if (type === "category")
                onSelect?.({
                  type,
                  maLoaiBatDongSan: Number(value),
                  label: item.label,
                });
              else if (type === "location")
                onSelect?.({ type, maTinhThanh: value, label: item.label });
            }}
          >
            <SelectTrigger
              aria-label={label}
              className="h-12 rounded-sm pl-11  border-[#ccc] shadow-sm"
            >
              <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      <div className="sm:col-start-2 sm:row-start-1">
        <PricePicker selected={selected} onSelect={onSelect} />
      </div>
    </div>
  );
}
