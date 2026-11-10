import { useState, type FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { isAxiosError } from "axios";
import { LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { postService } from "@/services/postService";
import type { TinDangDanhSach } from "@/types/post";

export default function ManagerPostEditor({
  post,
  onClose,
  onUpdated,
}: {
  post: TinDangDanhSach;
  onClose: () => void;
  onUpdated: (post: TinDangDanhSach) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const edited = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setError("");
    setFieldErrors({});
    const payload = {
      categoryId: post.maLoaiBatDongSan,
      legalDocumentId: post.maGiayTo,
      provinceCode: post.phuongXa.maTinhThanh,
      wardId: post.maPhuongXa,
      bedrooms: post.soPhongNgu,
      bathrooms: post.soPhongTam,
      floors: post.soTang,
      houseDirection: post.huongNha,
      huongBanCong: post.huongBanCong,
      noiThat: post.noiThat,
      matTien: post.matTien,
      matDuong: post.matDuong,
      viDo: post.viDo,
      kinhDo: post.kinhDo,
      ...edited,
    };
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    try {
      const updated = await postService.updatePost(post.maTinDang, formData);
      onUpdated({ ...post, ...updated });
      toast.success("Đã cập nhật tin đăng và chuyển về chờ kiểm duyệt");
      onClose();
    } catch (error) {
      const body = isAxiosError(error) ? error.response?.data : null;
      setError(
        typeof body?.message === "string"
          ? body.message
          : "Không thể cập nhật tin đăng. Vui lòng thử lại.",
      );
      if (body?.errors && typeof body.errors === "object") {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(body.errors).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          ),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { name: "title", label: "Tiêu đề", value: post.tieuDe, maxLength: 200 },
    {
      name: "price",
      label: "Giá (VNĐ)",
      value: post.giaNiemYet,
      type: "number",
      min: 0,
      step: "0.01",
    },
    {
      name: "area",
      label: "Diện tích (m²)",
      value: post.dienTich,
      type: "number",
      min: 0.01,
      step: "0.01",
    },
    {
      name: "address",
      label: "Địa chỉ chi tiết",
      value: post.diaChiChiTiet,
      maxLength: 255,
    },
    {
      name: "nguoiLienHe",
      label: "Người liên hệ",
      value: post.nguoiLienHe ?? "",
      maxLength: 100,
    },
    {
      name: "soDienThoaiLienHe",
      label: "Số điện thoại liên hệ",
      value: post.soDienThoaiLienHe ?? "",
      type: "tel",
      maxLength: 15,
    },
  ];

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/40" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sm border border-slate-200 bg-white p-5 font-sans shadow-lg outline-none sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="text-lg font-bold">
              Chỉnh sửa thông tin cơ bản
            </Dialog.Title>
            <button
              type="button"
              aria-label="Đóng chỉnh sửa"
              disabled={saving}
              onClick={onClose}
              className="rounded-sm p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <form onSubmit={submit} className="mt-5 space-y-4">
            {error && (
              <p
                role="alert"
                className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </p>
            )}
            <fieldset
              disabled={saving}
              className="space-y-4 disabled:opacity-60"
            >
              {fields.map(({ name, label, value, ...props }) => (
                <label key={name} className="block text-sm font-semibold">
                  {label} <span className="text-red-500">*</span>
                  <Input
                    name={name}
                    defaultValue={value}
                    required
                    {...props}
                    aria-invalid={!!fieldErrors[name]}
                    className="mt-2 rounded-sm text-sm font-normal md:text-sm"
                  />
                  {fieldErrors[name] && (
                    <span
                      role="alert"
                      className="mt-1 block text-xs font-normal text-red-600"
                    >
                      {fieldErrors[name]}
                    </span>
                  )}
                </label>
              ))}
              <label className="block text-sm font-semibold">
                Mô tả <span className="text-red-500">*</span>
                <textarea
                  name="description"
                  defaultValue={post.moTa}
                  required
                  maxLength={65535}
                  rows={5}
                  aria-invalid={!!fieldErrors.description}
                  className="mt-2 block w-full resize-y rounded-sm border border-input bg-white p-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {fieldErrors.description && (
                  <span
                    role="alert"
                    className="mt-1 block text-xs font-normal text-red-600"
                  >
                    {fieldErrors.description}
                  </span>
                )}
              </label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-sm border border-slate-200 px-4 py-2 text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  {saving && (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  )}
                  {saving ? "Đang cập nhật..." : "Lưu thay đổi"}
                </button>
              </div>
            </fieldset>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
