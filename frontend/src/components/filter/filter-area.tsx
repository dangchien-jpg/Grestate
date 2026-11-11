import type { AreaRange } from "@/services/filterService";

const ranges: { value: AreaRange; label: string }[] = [
  { value: "under-50", label: "Dưới 50 m²" },
  { value: "50-100", label: "50 - 100 m²" },
  { value: "100-200", label: "100 - 200 m²" },
  { value: "200-500", label: "200 - 500 m²" },
  { value: "over-500", label: "Trên 500 m²" },
];

export default function FilterArea({
  selected,
  onSelect,
}: {
  selected?: AreaRange;
  onSelect?: (range: AreaRange, label: string) => void;
}) {
  return (
    <section
      aria-labelledby="filter-area-title"
      className="rounded-sm border border-[#ccc] bg-white p-5 shadow-sm"
    >
      <h3 id="filter-area-title" className="text-sm font-bold">
        Lọc theo diện tích
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
