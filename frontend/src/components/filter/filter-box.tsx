import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Filters } from "@/lib/listing-filters";
import type { TinDangDanhSach } from "@/types/post";
import FilterArea from "./filter-area";
import FilterPrice from "./filter-price";

type Props = {
  posts: TinDangDanhSach[];
  selected: Filters;
  countMatches: (criteria: Partial<Filters>) => number;
  onSelect: (criteria: Partial<Filters>) => void;
};

export default function FilterBox({
  posts,
  selected,
  countMatches,
  onSelect,
}: Props) {
  const categories = [
    ...new Set(posts.map((post) => post.loaiBatDongSan.tenLoai)),
  ].sort();
  return (
    <div aria-label="Lọc nhanh" className="grid gap-2 sm:grid-cols-3">
      <Select
        multiple
        value={selected.category}
        onValueChange={(category) => onSelect({ category })}
      >
        <SelectTrigger
          aria-label="Loại bất động sản"
          className="h-11 rounded-sm px-3 shadow-sm"
        >
          <SelectValue>
            {selected.category.join(", ") || "Loại bất động sản"} (
            {countMatches({ category: selected.category })} tin)
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {categories.map((name) => (
            <SelectItem key={name} value={name}>
              {name} ({countMatches({ category: [name] })} tin)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FilterPrice
        min={selected.minPrice}
        max={selected.maxPrice}
        count={(minPrice, maxPrice) => countMatches({ minPrice, maxPrice })}
        onSelect={(minPrice, maxPrice) => onSelect({ minPrice, maxPrice })}
      />
      <FilterArea
        min={selected.minArea}
        max={selected.maxArea}
        count={(minArea, maxArea) => countMatches({ minArea, maxArea })}
        onSelect={(minArea, maxArea) => onSelect({ minArea, maxArea })}
      />
    </div>
  );
}
