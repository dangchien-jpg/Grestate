import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, House, Search } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import type { ListedContact } from "@/services/contactService";

const statuses = [
  ["", "Tất cả"],
  ["CHO_LIEN_HE", "Chờ liên hệ"],
  ["DA_LIEN_HE", "Đã liên hệ"],
] as const;
const pageSize = 10;
function FilterSelect({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
    >
      <SelectTrigger
        aria-label={label}
        className="h-10 pl-3 rounded-sm  border-[#dedede]"
      >
        <SelectValue className="min-w-0 truncate " />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
const normalize = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d");

interface Props {
  items: ListedContact[] | null;
  error: string;
  busy: number | null;
  refresh: () => void;
  mark: (id: number) => void;
}

function CustomerCard({
  row,
  busy,
  mark,
}: { row: ListedContact } & Pick<Props, "busy" | "mark">) {
  const pending = row.trangThai === "CHO_LIEN_HE";
  const post = row.tinDang;
  const image = post.hinhAnhTinDangs?.[0]?.hinhAnhUrl;
  const initials = row.tenLienHe
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <article
      className={`min-w-0 rounded-sm border border-[#dedede] border-l-4 p-4 sm:p-5 ${pending ? "border-l-amber-500" : "border-l-emerald-500"}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dedede] pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <h3 className="break-words font-semibold">{row.tenLienHe}</h3>
            <p className="text-xs ">
              Tiếp nhận ·{" "}
              <time dateTime={row.ngayGui}>
                {new Date(row.ngayGui).toLocaleString("vi-VN", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </time>
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${pending ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}
        >
          {pending ? "Chờ liên hệ" : "Đã liên hệ"}
        </span>
      </header>
      <div className="grid gap-4 py-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col">
          <h4 className="mb-2 text-xs font-semibold ">Bất động sản quan tâm</h4>
          <div className="flex flex-1 items-center gap-3 rounded-sm bg-[#dedede] p-3">
            {image ? (
              <img
                src={image}
                loading="lazy"
                alt=""
                className="size-14 shrink-0 rounded object-cover"
              />
            ) : (
              <House aria-hidden="true" className="size-8 shrink-0 " />
            )}
            <div className="min-w-0 text-sm">
              {post.trangThai === "DA_DUYET" ? (
                <Link
                  to={`/detail/${row.maTinDang}`}
                  className="break-words font-medium hover:text-primary hover:underline"
                >
                  {post.tieuDe}
                </Link>
              ) : (
                <p className="break-words font-medium">{post.tieuDe}</p>
              )}
              {post.giaNiemYet != null && (
                <p className="font-semibold text-primary">
                  {formatPrice(Number(post.giaNiemYet))}
                </p>
              )}
              <p className="text-xs ">Mã tin #{row.maTinDang}</p>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-col">
          <h4 className="mb-2 text-xs font-semibold ">Lời nhắn của khách</h4>
          <p className="flex-1 whitespace-pre-wrap break-words rounded-sm bg-[#dedede] p-3 text-sm">
            {row.loiNhan || "Khách chưa để lại lời nhắn."}
          </p>
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dedede] pt-3">
        <div>
          <p className="text-xs ">Số điện thoại</p>
          <a
            className="text-sm font-semibold text-primary hover:underline"
            href={`tel:${row.soDienThoaiLienHe}`}
          >
            {row.soDienThoaiLienHe}
          </a>
        </div>
        {pending && (
          <Button disabled={busy !== null} onClick={() => mark(row.maYeuCau)}>
            <Check className="size-4" />
            {busy === row.maYeuCau ? "Đang lưu…" : "Đánh dấu đã liên hệ"}
          </Button>
        )}
      </footer>
    </article>
  );
}

export default function ContactInbox({ items, error, busy, mark }: Props) {
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [postId, setPostId] = useState("");
  const [days, setDays] = useState("");
  const [order, setOrder] = useState("new");
  const [page, setPage] = useState(1);
  const rows = items ?? [];
  const posts = new Map(rows.map((row) => [row.maTinDang, row.tinDang.tieuDe]));
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - Number(days) + 1);
  const term = normalize(query.trim().replace(/^#/, ""));
  const filtered = rows
    .filter(
      (row) =>
        (!status || row.trangThai === status) &&
        (!postId || String(row.maTinDang) === postId) &&
        (!days || new Date(row.ngayGui) >= since) &&
        normalize(
          [
            row.tenLienHe,
            row.soDienThoaiLienHe,
            row.maTinDang,
            row.tinDang.tieuDe,
          ].join(" "),
        ).includes(term),
    )
    .sort(
      (a, b) =>
        (order === "new" ? -1 : 1) *
        (Date.parse(a.ngayGui) - Date.parse(b.ngayGui) ||
          a.maYeuCau - b.maYeuCau),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const start = (current - 1) * pageSize;
  return (
    <section className="rounded-sm  bg-card shadow-sm">
      <header className="flex items-center justify-between gap-2 px-4 pt-4 sm:px-6">
        <h2 className="font-semibold">Danh sách khách hàng</h2>
      </header>
      <div
        role="group"
        aria-label="Trạng thái liên hệ"
        className="flex gap-4 overflow-x-auto border-b px-4 sm:gap-8 sm:px-6"
      >
        {statuses.map(([value, label]) => (
          <button
            key={value}
            aria-pressed={status === value}
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
            className={`shrink-0 border-b-2 py-3 text-sm ${status === value ? "border-primary font-semibold text-primary" : "border-transparent "}`}
          >
            {label}{" "}
            {items && (
              <span className="tabular-nums">
                {value
                  ? rows.filter((row) => row.trangThai === value).length
                  : rows.length}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1fr_1fr]">
          <label className="relative min-w-0">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-3 size-4 "
            />
            <Input
              type="search"
              aria-label="Tìm khách hàng"
              placeholder="Tên, số điện thoại, mã tin…"
              className="h-10 pl-9 text-sm md:text-sm shadow-none border border-[#dedede]"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <FilterSelect
            label="Bất động sản"
            value={postId}
            items={[
              { value: "", label: "Tất cả bất động sản" },
              ...Array.from(posts, ([id, title]) => ({
                value: String(id),
                label: `#${id} · ${title}`,
              })),
            ]}
            onChange={(value) => {
              setPostId(value);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Thời gian tiếp nhận"
            value={days}
            items={[
              { value: "", label: "Mọi thời điểm" },
              { value: "1", label: "Hôm nay" },
              { value: "7", label: "7 ngày qua" },
              { value: "30", label: "30 ngày qua" },
            ]}
            onChange={(value) => {
              setDays(value);
              setPage(1);
            }}
          />
          <FilterSelect
            label="Sắp xếp"
            value={order}
            items={[
              { value: "new", label: "Mới nhất" },
              { value: "old", label: "Cũ nhất" },
            ]}
            onChange={(value) => {
              setOrder(value);
              setPage(1);
            }}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {!items && !error && <p role="status">Đang tải yêu cầu…</p>}
        {items && !filtered.length && (
          <p className="py-10 text-center text-sm ">
            Chưa có yêu cầu liên hệ phù hợp.
          </p>
        )}
        {filtered.slice(start, start + pageSize).map((row) => (
          <CustomerCard key={row.maYeuCau} row={row} busy={busy} mark={mark} />
        ))}
        {filtered.length > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs ">
            <span>
              Hiển thị {start + 1}–{Math.min(start + pageSize, filtered.length)}{" "}
              trong {filtered.length} yêu cầu
            </span>
            {pages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  aria-label="Trang trước"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                >
                  <ChevronLeft />
                </Button>
                {current} / {pages}
                <Button
                  variant="outline"
                  aria-label="Trang sau"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                >
                  <ChevronRight />
                </Button>
              </div>
            )}
          </footer>
        )}
      </div>
    </section>
  );
}
