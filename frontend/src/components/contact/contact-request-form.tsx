import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/button";
import {
  contactError,
  createContactRequest,
  fetchSentContactRequests,
} from "@/services/contactService";
import { Input } from "@/components/ui/input";

export default function ContactRequestForm({
  postId,
  name,
  phone,
}: {
  postId: number;
  name: string;
  phone: string;
}) {
  const [pending, setPending] = useState<boolean | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetchSentContactRequests(postId)
      .then(({ requests }) => {
        if (active)
          setPending(
            requests.some((request) => request.trangThai === "CHO_LIEN_HE"),
          );
      })
      .catch((err) => {
        if (active) setError(contactError(err));
      });
    return () => {
      active = false;
    };
  }, [postId, attempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await createContactRequest(postId, {
        tenLienHe: String(data.get("name")).trim(),
        soDienThoaiLienHe: String(data.get("phone")).trim(),
        loiNhan: String(data.get("note")).trim(),
      });
      setPending(true);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) setPending(true);
      else setError(contactError(err));
    } finally {
      setBusy(false);
    }
  }

  if (pending)
    return (
      <p role="status" className="text-sm text-emerald-700">
        Đã gửi yêu cầu. Bạn đang chờ chủ tin liên hệ.
      </p>
    );
  if (pending === null)
    return error ? (
      <div role="alert">
        {error}{" "}
        <Button
          variant="outline"
          onClick={() => {
            setError("");
            setAttempt(attempt + 1);
          }}
        >
          Thử lại
        </Button>
      </div>
    ) : (
      <p role="status">Đang tải…</p>
    );

  const field = "mt-2 h-12 rounded-sm text-sm";
  return (
    <form onSubmit={submit} className="space-y-3 text-sm ">
      <label className="block">
        Tên liên hệ{" "}
        <span aria-hidden="true" className="text-red-600">
          *
        </span>
        <Input
          className={field}
          name="name"
          autoComplete="name"
          defaultValue={name}
          pattern={".*\\S.*"}
          maxLength={100}
          required
        />
      </label>
      <label className="block">
        Số điện thoại{" "}
        <span aria-hidden="true" className="text-red-600">
          *
        </span>
        <Input
          className={field}
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={phone}
          pattern={"\\+?[0-9]{9,15}"}
          maxLength={15}
          required
        />
      </label>
      <label className="block">
        Lời nhắn (tùy chọn)
        <p id="contact-note-hint" className="text-xs text-muted-foreground">
          Bạn có thể ghi khung giờ tiện nghe máy hoặc điều muốn hỏi về tin đăng.
        </p>
      </label>
      <textarea
        className="w-full max-w-100 rounded-sm border border-[#ccc] p-2"
        name="note"
        aria-describedby="contact-note-hint"
        maxLength={500}
        rows={2}
      />

      <p className="text-muted-foreground">
        Chủ tin sẽ nhận tên, số điện thoại và lời nhắn để liên hệ với bạn về tin
        này.
      </p>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full h-11 font-medium" disabled={busy}>
        {busy ? "Đang gửi…" : "Gửi yêu cầu"}
      </Button>
    </form>
  );
}
