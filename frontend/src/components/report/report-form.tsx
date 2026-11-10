import { useRef, useState, type FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { LoaderCircle, TriangleAlert, X } from "lucide-react";
import { Link } from "react-router";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

const reasons = [
  "Địa chỉ của bất động sản",
  "Các thông tin về: giá, diện tích, mô tả ...",
  "Ảnh",
  "Trùng với tin rao khác",
  "Không liên lạc được",
  "Tin không có thật",
  "Bất động sản đã bán",
];

export default function ReportForm({ maTinDang }: { maTinDang: number }) {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const noiDung = [
      ...selected,
      description.trim() ? `Khác: ${description.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    if (!noiDung || noiDung.length > 5000) {
      setError(
        noiDung
          ? "Nội dung báo cáo tối đa 5000 ký tự."
          : "Vui lòng chọn lý do hoặc nhập nội dung báo cáo.",
      );
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await api.post(`/report/post/${maTinDang}`, { noiDung });
      toast.success("Đã gửi báo cáo. Chúng tôi sẽ xem xét tin đăng này.");
      setOpen(false);
    } catch (failure) {
      setError(
        isAxiosError(failure) &&
          typeof failure.response?.data?.message === "string"
          ? failure.response.data.message
          : "Không thể gửi báo cáo. Vui lòng thử lại.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting.current) return;
        setOpen(nextOpen);
        if (nextOpen) {
          setSelected([]);
          setDescription("");
          setError("");
        }
      }}
    >
      <Dialog.Trigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Báo cáo tin đăng"
          />
        }
      >
        <TriangleAlert className="size-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-[61] flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white font-sans shadow-xl outline-none">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <Dialog.Title className="text-xl font-bold">
              Báo cáo tin đăng
            </Dialog.Title>
            <Dialog.Close
              disabled={busy}
              aria-label="Đóng"
              className="rounded-md p-1 hover:bg-gray-100 disabled:opacity-50"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          {user ? (
            <form onSubmit={submit} className="min-h-0 overflow-y-auto p-6">
              <Dialog.Description className="mb-5 text-sm ">
                Cho chúng tôi biết thông tin chưa chính xác trong tin đăng này.
              </Dialog.Description>
              <fieldset disabled={busy} className="space-y-4">
                <legend className="sr-only">Lý do báo cáo</legend>
                {reasons.map((reason) => (
                  <label
                    key={reason}
                    className="flex cursor-pointer items-start gap-3 text-sm sm:text-base"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(reason)}
                      onChange={(event) => {
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, reason]
                            : current.filter((value) => value !== reason),
                        );
                      }}
                      className="mt-0.5 size-5 shrink-0 cursor-pointer  "
                    />
                    {reason}
                  </label>
                ))}
                <div className="pt-2">
                  <label
                    htmlFor="report-description"
                    className="mb-2 block text-sm font-medium"
                  >
                    Khác
                  </label>
                  <textarea
                    id="report-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={4500}
                    rows={4}
                    placeholder="Nhập nội dung"
                    className="w-full resize-y rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </fieldset>
              {error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={busy}
                className="mt-5 w-full py-4"
              >
                {busy && <LoaderCircle className="size-4 animate-spin" />}
                {busy ? "Đang gửi..." : "Gửi báo cáo"}
              </Button>
            </form>
          ) : (
            <div className="p-6">
              <Dialog.Description className="mb-5 text-sm">
                Vui lòng đăng nhập để báo cáo tin đăng.
              </Dialog.Description>
              <Link
                to="/signin"
                className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
