import RangeSelect, { type RangeSelectProps } from "./range-select";

const ranges = [
  { min: "", max: "1", label: "Đến 1 tỷ" },
  { min: "1", max: "3", label: "1 – 3 tỷ" },
  { min: "3", max: "5", label: "3 – 5 tỷ" },
  { min: "5", max: "10", label: "5 – 10 tỷ" },
  { min: "10", max: "", label: "Từ 10 tỷ" },
];

export default function FilterPrice(props: RangeSelectProps) {
  return <RangeSelect {...props} title="Lọc theo khoảng giá" ranges={ranges} />;
}
