import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type RangeSelectProps = {
  min: string;
  max: string;
  count: (min: string, max: string) => number;
  onSelect: (min: string, max: string) => void;
};

export default function RangeSelect({
  title,
  ranges,
  min,
  max,
  count,
  onSelect,
}: RangeSelectProps & {
  title: string;
  ranges: { min: string; max: string; label: string }[];
}) {
  const options = [{ min: "", max: "", label: title }, ...ranges];
  const selected =
    options.find((option) => option.min === min && option.max === max) ??
    options[0];
  return (
    <Select
      value={selected.label}
      onValueChange={(label) => {
        const option = options.find((item) => item.label === label);
        if (option) onSelect(option.min, option.max);
      }}
    >
      <SelectTrigger
        aria-label={title}
        className="h-11 rounded-sm shadow-sm px-3"
      >
        <SelectValue>
          {selected.label} ({count(selected.min, selected.max)} tin)
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.label} value={option.label}>
            {option.label} ({count(option.min, option.max)} tin)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
