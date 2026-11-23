import RangeSelect, { type RangeSelectProps } from "./range-select";

const ranges = [
  { min: "", max: "50", label: "Đến 50 m²" },
  { min: "50", max: "100", label: "50 – 100 m²" },
  { min: "100", max: "200", label: "100 – 200 m²" },
  { min: "200", max: "500", label: "200 – 500 m²" },
  { min: "500", max: "", label: "Từ 500 m²" },
];

export default function FilterArea(props: RangeSelectProps) {
  return <RangeSelect {...props} title="Lọc theo diện tích" ranges={ranges} />;
}
