import { useEffect, useId, useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  searchService,
  type SearchQuery,
  type SearchSuggestion,
} from "@/services/searchService";

export default function SearchBar({
  onSearch,
}: {
  onSearch: (query: SearchQuery | null, label: string) => void;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [result, setResult] = useState<{
    keyword: string;
    items: SearchSuggestion[];
  } | null>(null);
  const [chosen, setChosen] = useState<SearchSuggestion | null>(null);
  const id = useId();
  const keyword = value.trim();
  const suggestions = result?.keyword === keyword ? result.items : [];
  useEffect(() => {
    if (!keyword || !open || chosen) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      searchService
        .suggestions(keyword, controller.signal)
        .then((items) => {
          if (!controller.signal.aborted) setResult({ keyword, items });
        })
        .catch(() => {
          if (!controller.signal.aborted) setResult({ keyword, items: [] });
        });
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [keyword, open, chosen]);
  function select(item: SearchSuggestion) {
    setValue(item.label);
    setChosen(item);
    setOpen(false);
    setActive(-1);
    onSearch(
      { maLoaiBatDongSan: item.maLoaiBatDongSan, maPhuongXa: item.maPhuongXa },
      item.label,
    );
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    setOpen(false);
    if (chosen) select(chosen);
    else onSearch(keyword ? { keyword } : null, keyword);
  }
  const expanded = open && suggestions.length > 0 && !chosen;
  return (
    <form
      id="search"
      role="search"
      onSubmit={submit}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <div
        className="relative min-w-0 flex-1"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setOpen(false);
        }}
      >
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-4 left-4 size-4 text-primary"
        />
        <Input
          role="combobox"
          aria-label="Địa điểm hoặc tên bất động sản"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? id : undefined}
          aria-activedescendant={
            expanded && active >= 0 ? `${id}-${active}` : undefined
          }
          value={value}
          maxLength={200}
          placeholder="Nhập thông tin bạn muốn tìm..."
          className="h-12 rounded-sm border-[#ccc] bg-white pr-10 pl-11 text-sm"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setValue(event.target.value);
            setChosen(null);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
            if (!expanded) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => (index + 1) % suggestions.length);
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) =>
                index <= 0 ? suggestions.length - 1 : index - 1,
              );
            }
            if (event.key === "Enter" && active >= 0) {
              event.preventDefault();
              select(suggestions[active]);
            }
          }}
        />
        {value && (
          <button
            type="button"
            aria-label="Xóa tìm kiếm"
            className="absolute top-3 right-3 rounded p-1 text-gray-500"
            onClick={() => {
              setValue("");
              setChosen(null);
              setOpen(false);
              setActive(-1);
              onSearch(null, "");
            }}
          >
            <X className="size-4" />
          </button>
        )}
        {expanded && (
          <ul
            id={id}
            role="listbox"
            aria-label="Gợi ý tìm kiếm"
            className="absolute top-full right-0 left-0 z-30 mt-1 max-h-80 overflow-y-auto rounded border bg-white py-1 shadow-lg"
          >
            {suggestions.map((item, index) => (
              <li
                key={`${item.maLoaiBatDongSan}-${item.maPhuongXa}`}
                id={`${id}-${index}`}
                role="option"
                aria-selected={active === index}
                className={`flex cursor-pointer items-start gap-3 px-4 py-3 text-sm hover:bg-gray-50 ${active === index ? "bg-blue-50" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => select(item)}
              >
                <Search className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Button type="submit" className="h-12 gap-2 rounded-sm px-7 text-sm">
        <Search className="size-5" />
        Tìm kiếm
      </Button>
    </form>
  );
}
