import { useRef, useState, type Ref } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { ChevronDown, Search } from "lucide-react";

type Option<Value> = { value: Value; label: string };

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/đ/g, "d").trim().replace(/\s+/g, " ");
}

export function SearchableSelect<Value extends string | number>({
  id, name, value, options, onValueChange, onBlur, triggerRef,
  placeholder, searchLabel, emptyMessage, disabled, invalid, describedBy,
}: {
  id: string;
  name: string;
  value: Value | null;
  options: Option<Value>[];
  onValueChange: (value: Value | null) => void;
  onBlur: () => void;
  triggerRef: Ref<HTMLButtonElement>;
  placeholder: string;
  searchLabel: string;
  emptyMessage: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <Combobox.Root
      items={options}
      value={selected}
      name={name}
      disabled={disabled}
      inputValue={query}
      onInputValueChange={setQuery}
      onOpenChange={(open) => { if (open) setQuery(""); }}
      onValueChange={(option) => onValueChange(option?.value ?? null)}
      isItemEqualToValue={(a, b) => a.value === b.value}
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => String(option.value)}
      filter={(option, search) => normalizeSearch(option.label).includes(normalizeSearch(search))}
    >
      <Combobox.Trigger
        id={id}
        ref={triggerRef}
        onBlur={onBlur}
        aria-required="true"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="flex h-12 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-white px-4 text-left font-sans text-sm text-slate-700 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50">
          <Combobox.Popup
            initialFocus={inputRef}
            className="flex max-h-[min(24rem,var(--available-height))] w-(--anchor-width) flex-col overflow-hidden rounded-xl border bg-white p-2 font-sans text-sm text-slate-800 shadow-lg"
          >
            <div className="relative mb-2 shrink-0">
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2" />
              <Combobox.Input
                ref={inputRef}
                aria-label={searchLabel}
                placeholder="Tìm kiếm"
                className="h-11 w-full rounded-full border border-input bg-white pr-3 pl-10 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Combobox.Empty className="px-3 py-4 text-slate-500">
              {options.length === 0 ? emptyMessage : "Không tìm thấy kết quả phù hợp."}
            </Combobox.Empty>
            <Combobox.List className="min-h-0 overflow-y-auto overscroll-contain">
              {(option: Option<Value>) => (
                <Combobox.Item
                  key={option.value}
                  value={option}
                  className="flex cursor-pointer items-center rounded-lg px-3 py-3 outline-none select-none data-highlighted:bg-slate-100"
                >
                  <span>{option.label}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
