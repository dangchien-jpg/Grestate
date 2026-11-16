import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { isAxiosError } from "axios";
import { LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NhomBatDongSan } from "@/types/post";

export type CatalogRecord = {
  id: number;
  name: string;
  description: string | null;
  group?: NhomBatDongSan;
};
export type CatalogValues = {
  name: string;
  description: string;
  group: NhomBatDongSan;
};
type CatalogConfig = {
  title: string;
  label: string;
  maxName: number;
  hasGroup?: boolean;
  list: (signal: AbortSignal) => Promise<CatalogRecord[]>;
  create: (values: CatalogValues) => Promise<unknown>;
  update: (id: number, values: CatalogValues) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
};
const inputClassName =
  "h-12 rounded-sm text-sm md:text-sm border border-[#ccc]";
function errorMessage(error: unknown) {
  return isAxiosError(error) &&
    typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : "Không thể xử lý danh mục. Vui lòng thử lại.";
}

function CatalogEditor({
  config,
  record,
  onClose,
  onSaved,
}: {
  config: CatalogConfig;
  record: CatalogRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(record?.name ?? "");
  const [description, setDescription] = useState(record?.description ?? "");
  const [group, setGroup] = useState<NhomBatDongSan>(record?.group ?? "NHA");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    if (!name.trim() || name.trim().length > config.maxName) {
      setError("Tên phải có từ 1 đến " + config.maxName + " ký tự.");
      return;
    }
    if (new TextEncoder().encode(description).length > 65535) {
      setError("Mô tả vượt quá độ dài cho phép.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const values = {
        name: name.trim(),
        description: description.trim(),
        group,
      };
      if (record) await config.update(record.id, values);
      else await config.create(values);
      toast.success(
        (record ? "Cập nhật " : "Thêm ") + config.label + " thành công",
      );
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !lock.current) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Popup
          aria-busy={busy}
          className="fixed left-1/2 top-1/2 z-[61] max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sm bg-white p-5 shadow-xl outline-none sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="text-lg font-bold">
              {record ? "Chỉnh sửa " : "Thêm "}
              {config.label}
            </Dialog.Title>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Đóng"
              disabled={busy}
              onClick={onClose}
            >
              <X />
            </Button>
          </div>
          <Dialog.Description className="mt-1 text-sm text-slate-500">
            Nhập thông tin {config.label}. Các trường có dấu * là bắt buộc.
          </Dialog.Description>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="catalog-name" className="text-sm font-bold">
                Tên {config.label} *
              </Label>
              <Input
                id="catalog-name"
                required
                maxLength={config.maxName}
                disabled={busy}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={"Nhập tên " + config.label}
                className={inputClassName}
              />
            </div>
            {config.hasGroup && (
              <div className="space-y-2">
                <Label htmlFor="catalog-group" className="text-sm font-bold">
                  Nhóm bất động sản *
                </Label>
                <select
                  id="catalog-group"
                  required
                  disabled={busy}
                  value={group}
                  onChange={(event) =>
                    setGroup(event.target.value as NhomBatDongSan)
                  }
                  className="h-12 w-full rounded-sm border border-[#ccc] bg-white px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="NHA">Nhà</option>
                  <option value="DAT">Đất</option>
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label
                htmlFor="catalog-description"
                className="text-sm font-bold"
              >
                Mô tả
              </Label>
              <textarea
                id="catalog-description"
                rows={4}
                disabled={busy}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Nhập mô tả..."
                className="w-full resize-y rounded-sm border border-[#ccc] bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-sm"
                disabled={busy}
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className={record ? "rounded-sm bg-primary" : "rounded-sm"}
                disabled={busy}
              >
                {busy && <LoaderCircle className="size-4 animate-spin" />}
                {record ? "Lưu thay đổi" : "Thêm mới"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CatalogDeleteDialog({
  config,
  record,
  onClose,
  onSaved,
}: {
  config: CatalogConfig;
  record: CatalogRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function remove() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await config.remove(record.id);
      toast.success("Xóa " + config.label + " thành công");
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !lock.current) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Popup
          aria-busy={busy}
          className="fixed left-1/2 top-1/2 z-[61] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white p-6 shadow-xl outline-none"
        >
          <Dialog.Title className="text-lg font-bold">
            Xóa {config.label}
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-slate-600">
            Bạn muốn xóa “{record.name}”? Mục này sẽ không còn xuất hiện trong
            danh sách lựa chọn khi đăng tin. Các tin đăng hiện có vẫn giữ thông
            tin đã liên kết.
          </Dialog.Description>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-sm"
              disabled={busy}
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              className="rounded-sm bg-red-600 text-white hover:bg-red-700"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy && <LoaderCircle className="size-4 animate-spin" />}Xác nhận
              xóa
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function CatalogManager({ config }: { config: CatalogConfig }) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    revision: number;
    records: CatalogRecord[];
    error: string;
  } | null>(null);
  const [editor, setEditor] = useState<{ record: CatalogRecord | null } | null>(
    null,
  );
  const [deleting, setDeleting] = useState<CatalogRecord | null>(null);
  const current = result?.revision === revision ? result : null;
  useEffect(() => {
    const controller = new AbortController();
    config
      .list(controller.signal)
      .then((records) => {
        if (!controller.signal.aborted)
          setResult({ revision, records, error: "" });
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted)
          setResult({ revision, records: [], error: errorMessage(failure) });
      });
    return () => controller.abort();
  }, [config, revision]);
  function saved() {
    setEditor(null);
    setDeleting(null);
    setRevision((value) => value + 1);
  }
  return (
    <section className="m-4 rounded-sm border border-slate-200 bg-white p-4 sm:m-6 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{config.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {current && !current.error
              ? current.records.length + " " + config.label
              : "Quản lý danh mục hiển thị trong form đăng tin"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="rounded-sm bg-white border border-emerald-700 text-emerald-700"
            onClick={() => setEditor({ record: null })}
          >
            <Plus className="size-4" />
            Thêm mới
          </Button>
        </div>
      </div>
      {!current ? (
        <div
          role="status"
          className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"
        >
          <LoaderCircle className="size-5 animate-spin" />
          Đang tải danh sách...
        </div>
      ) : current.error ? (
        <div
          role="alert"
          className="rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{current.error}</p>
          <Button
            variant="outline"
            className="mt-3 rounded-sm"
            onClick={() => setRevision((value) => value + 1)}
          >
            Thử lại
          </Button>
        </div>
      ) : !current.records.length ? (
        <p className="py-16 text-center text-sm text-slate-500">
          Chưa có {config.label}. Nhấn “Thêm mới” để tạo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-3">Mã</th>
                <th className="px-3 py-3">Tên {config.label}</th>
                {config.hasGroup && <th className="px-3 py-3">Nhóm</th>}
                <th className="px-3 py-3">Mô tả</th>
                <th className="px-3 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {current.records.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="px-3 py-4 text-slate-500">#{record.id}</td>
                  <td className="max-w-64 break-words px-3 py-4 font-medium">
                    {record.name}
                  </td>
                  {config.hasGroup && (
                    <td className="whitespace-nowrap px-3 py-4">
                      {record.group === "NHA" ? "Nhà" : "Đất"}
                    </td>
                  )}
                  <td className="max-w-80 px-3 py-4 text-slate-600">
                    <p className="line-clamp-2 break-words">
                      {record.description || "Chưa có mô tả"}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-11 rounded-[10px] border-slate-400 bg-white text-primary shadow-none hover:border-primary hover:bg-blue-50 hover:text-primary"
                        aria-label={"Chỉnh sửa " + record.name}
                        title="Chỉnh sửa"
                        onClick={() => setEditor({ record })}
                      >
                        <Pencil className="size-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-11 rounded-[10px] border-slate-400 bg-white text-red-600 shadow-none hover:border-red-600 hover:bg-red-50 hover:text-red-600"
                        aria-label={"Xóa " + record.name}
                        title="Xóa"
                        onClick={() => setDeleting(record)}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editor && (
        <CatalogEditor
          key={editor.record?.id ?? "new"}
          config={config}
          record={editor.record}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}
      {deleting && (
        <CatalogDeleteDialog
          key={deleting.id}
          config={config}
          record={deleting}
          onClose={() => setDeleting(null)}
          onSaved={saved}
        />
      )}
    </section>
  );
}
