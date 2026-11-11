import type { PriceRange } from "@/services/filterService";

const ranges: { value: PriceRange; label: string }[] = [
  { value: "under-1", label: "Dưới 1 tỷ" },
  { value: "1-3", label: "1 - 3 tỷ" },
  { value: "3-5", label: "3 - 5 tỷ" },
  { value: "5-10", label: "5 - 10 tỷ" },
  { value: "over-10", label: "Trên 10 tỷ" },
];

export default function FilterPrice({
  selected,
  onSelect,
}: {
  selected?: PriceRange;
  onSelect?: (range: PriceRange, label: string) => void;
}) {
  return (
    <section
      aria-labelledby="filter-price-title"
      className="rounded-sm border border-[#ccc] bg-white p-5 shadow-sm"
    >
      <h3 id="filter-price-title" className="text-sm font-bold">
        Lọc theo khoảng giá
      </h3>
      <ul className="space-y-1">
        {ranges.map(({ value, label }) => (
          <li key={value}>
            <button
              type="button"
              aria-pressed={selected === value}
              onClick={() => onSelect?.(value, label)}
              className={`w-full rounded py-2 text-left text-sm transition-colors hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary ${selected === value ? "bg-blue-50 font-semibold text-primary" : ""}`}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
