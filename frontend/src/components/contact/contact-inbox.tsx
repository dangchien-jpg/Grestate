import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  contactError,
  fetchReceivedContactRequests,
  markContactRequestContacted,
  type ListedContact,
} from "@/services/contactService";

function InboxList() {
  const [items, setItems] = useState<ListedContact[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  useEffect(() => {
    let active = true;
    fetchReceivedContactRequests()
      .then(({ requests }) => {
        if (active) setItems(requests);
      })
      .catch((err) => {
        if (active) setError(contactError(err));
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  async function mark(id: number) {
    setBusy(id);
    setError("");
    try {
      await markContactRequestContacted(id);
      setItems(
        (current) =>
          current?.map((row) =>
            row.maYeuCau === id ? { ...row, trangThai: "DA_LIEN_HE" } : row,
          ) ?? null,
      );
    } catch (err) {
      setError(contactError(err));
    } finally {
      setBusy(null);
    }
  }

  const visible = items?.filter((row) => !filter || row.trangThai === filter);
  return (
    <div className="mt-4 space-y-3 text-sm">
      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Trạng thái liên hệ"
          className="rounded-md border px-3"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="">Tất cả yêu cầu</option>
          <option value="CHO_LIEN_HE">Chờ liên hệ</option>
          <option value="DA_LIEN_HE">Đã liên hệ</option>
        </select>
        <Button
          variant="outline"
          disabled={busy !== null}
          onClick={() => {
            setItems(null);
            setError("");
            setAttempt(attempt + 1);
          }}
        >
          Làm mới
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {!items && !error && <p role="status">Đang tải yêu cầu…</p>}
      {visible?.length === 0 && <p>Chưa có yêu cầu liên hệ phù hợp.</p>}
      {visible?.map((row) => (
        <article key={row.maYeuCau} className="space-y-2 rounded-lg border p-4">
          <h3 className="font-semibold">{row.tinDang.tieuDe}</h3>
          <p>
            {row.tenLienHe} ·{" "}
            <a
              className="text-primary underline"
              href={`tel:${row.soDienThoaiLienHe}`}
            >
              {row.soDienThoaiLienHe}
            </a>
          </p>
          <p className="text-muted-foreground">
            {new Date(row.ngayGui).toLocaleString("vi-VN")} ·{" "}
            {row.trangThai === "CHO_LIEN_HE" ? "Chờ liên hệ" : "Đã liên hệ"}
          </p>
          {row.loiNhan && (
            <p className="whitespace-pre-wrap break-words">{row.loiNhan}</p>
          )}
          {row.trangThai === "CHO_LIEN_HE" && (
            <Button disabled={busy !== null} onClick={() => mark(row.maYeuCau)}>
              {busy === row.maYeuCau ? "Đang lưu…" : "Đánh dấu đã liên hệ"}
            </Button>
          )}
        </article>
      ))}
    </div>
  );
}

export default function ContactInbox() {
  const [open, setOpen] = useState(false);
  return (
    <section className="mx-auto mt-4 max-w-6xl px-4">
      <div className="rounded-xl border bg-card p-4">
        <Button
          variant="outline"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          Yêu cầu liên hệ đã nhận
        </Button>
        {open && <InboxList />}
      </div>
    </section>
  );
}
