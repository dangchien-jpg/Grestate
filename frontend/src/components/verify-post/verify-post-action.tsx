import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { isAxiosError } from "axios";
import { Clock3, ShieldCheck, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Backdrop from "@/components/backdrop/backdrop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { legalDocumentService } from "@/services/legalDocumentService";
import { verifyPostService } from "@/services/verifyPostService";
import type {
  GiayToPhapLy,
  TinDangDanhSach,
  VerificationSummary,
} from "@/types/post";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const propertyTypes = [
  ...imageTypes,
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

type Props = {
  post: TinDangDanhSach;
  onSubmitted: (request: VerificationSummary) => void;
  onRefresh: () => void;
};

function SelectedFile({ file, remove }: { file: File; remove: () => void }) {
  const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (link.current) link.current.href = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <li className="flex min-w-0 items-center gap-1">
      <a
        ref={link}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-primary underline"
        title={file.name}
      >
        {file.name}
      </a>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Bỏ ${file.name}`}
        onClick={remove}
      >
        <X />
      </Button>
    </li>
  );
}

function EvidencePicker({
  title,
  hint,
  buttonLabel,
  types,
  files,
  otherCount,
  change,
  report,
}: {
  title: string;
  hint: string;
  buttonLabel: string;
  types: string[];
  files: File[];
  otherCount: number;
  change: (next: File[]) => void;
  report: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  function append(selection: File[]) {
    const next = [...files];
    for (const file of selection) {
      if (!types.includes(file.type))
        return report(`Định dạng của ${file.name} không được hỗ trợ.`);
      if (!file.size || file.size > 20 * 1024 * 1024)
        return report(
          `Tệp ${file.name} phải có nội dung và không vượt quá 20 MB.`,
        );
      if (
        !next.some(
          (f) =>
            f.name === file.name &&
            f.size === file.size &&
            f.lastModified === file.lastModified,
        )
      )
        next.push(file);
    }
    if (next.length > 6 || next.length + otherCount > 8)
      return report("Mỗi nhóm tối đa 6 tệp và tổng cộng tối đa 8 tệp.");
    change(next);
    report("");
  }
  return (
    <fieldset className="min-w-0">
      <legend className="font-medium">{title}</legend>
      <p className="text-xs ">{hint}</p>
      <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
        <Input
          ref={input}
          type="file"
          hidden
          multiple
          accept={types.join(",")}
          aria-label={title}
          onChange={(e) => {
            append(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="h-10"
          onClick={() => input.current?.click()}
        >
          <Upload />
          {buttonLabel}
        </Button>
        {files.length ? (
          <ul aria-label={title} className="min-w-0">
            {files.map((file) => (
              <SelectedFile
                key={JSON.stringify([file.name, file.size, file.lastModified])}
                file={file}
                remove={() => {
                  change(files.filter((f) => f !== file));
                  report("");
                }}
              />
            ))}
          </ul>
        ) : (
          <span className="self-center text-xs ">Chưa chọn tệp</span>
        )}
      </div>
    </fieldset>
  );
}
function EvidenceForm({
  post,
  onSubmitted,
  onRefresh,
  pending,
  setPending,
}: Props & {
  pending: boolean;
  setPending: (value: boolean) => void;
}) {
  const [documents, setDocuments] = useState<GiayToPhapLy[]>([]);
  const [documentId, setDocumentId] = useState(post.maGiayTo);
  const [legalFiles, setLegalFiles] = useState<File[]>([]);
  const [propertyFiles, setPropertyFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [catalogState, setCatalogState] = useState<
    "loading" | "ready" | "failed"
  >("loading");
  const [retry, setRetry] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    legalDocumentService
      .fetchLegalDocuments(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setDocuments(items);
        setDocumentId((current) =>
          items.some((d) => d.maGiayTo === current) ? current : null,
        );
        setCatalogState("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setCatalogState("failed");
      });
    return () => controller.abort();
  }, [retry]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    const files = [...legalFiles, ...propertyFiles];
    if (!documentId || !legalFiles.length || !propertyFiles.length) {
      setError("Chọn loại giấy tờ và thêm minh chứng vào cả hai nhóm.");
      return;
    }
    if (legalFiles.length > 6 || propertyFiles.length > 6 || files.length > 8) {
      setError("Mỗi nhóm tối đa 6 tệp và tổng cộng tối đa 8 tệp.");
      return;
    }
    if (files.some((f) => !f.size || f.size > 20 * 1024 * 1024)) {
      setError("Tệp phải có nội dung và không vượt quá 20 MB.");
      return;
    }
    if (
      legalFiles.some((f) => !imageTypes.includes(f.type)) ||
      propertyFiles.some((f) => !propertyTypes.includes(f.type))
    ) {
      setError("Kiểm tra định dạng ảnh hoặc video theo hướng dẫn bên dưới.");
      return;
    }
    lock.current = true;
    setPending(true);
    setError("");
    try {
      const request = await verifyPostService.submit(post.maTinDang, {
        maGiayTo: documentId,
        hoSoPhapLy: legalFiles,
        batDongSan: propertyFiles,
        ghiChuNguoiGui: note,
      });
      onSubmitted(request);
      toast.success("Đã gửi yêu cầu xác thực");
    } catch (err) {
      setError(
        isAxiosError(err) && typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "Gửi yêu cầu thất bại. Vui lòng thử lại.",
      );
      if (isAxiosError(err) && err.response?.status === 409) onRefresh();
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="mt-4 space-y-4 text-sm"
      aria-busy={pending}
    >
      <fieldset disabled={pending} className="space-y-4">
        <div>
          <p className="mb-1 font-medium">Loại giấy tờ pháp lý</p>
          <Select
            value={documentId}
            onValueChange={setDocumentId}
            disabled={pending || !documents.length}
            items={documents.map((d) => ({
              value: d.maGiayTo,
              label: d.tenGiayTo,
            }))}
          >
            <SelectTrigger
              aria-label="Loại giấy tờ pháp lý"
              className="h-11 rounded-sm pl-3"
            >
              <SelectValue placeholder="Chọn loại giấy tờ" />
            </SelectTrigger>
            <SelectContent>
              {documents.map((d) => (
                <SelectItem key={d.maGiayTo} value={d.maGiayTo}>
                  {d.tenGiayTo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {catalogState === "loading" && (
            <p role="status">Đang tải danh mục…</p>
          )}
          {catalogState === "failed" && (
            <p role="alert">
              Không tải được danh mục.{" "}
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setCatalogState("loading");
                  setRetry((n) => n + 1);
                }}
              >
                Thử lại
              </Button>
            </p>
          )}
          {catalogState === "ready" && !documents.length && (
            <p>Chưa có loại giấy tờ để chọn.</p>
          )}
        </div>
        <EvidencePicker
          title="Ảnh giấy tờ pháp lý"
          hint="Chọn đầy đủ các mặt hoặc trang giấy tờ"
          buttonLabel="Thêm ảnh"
          types={imageTypes}
          files={legalFiles}
          otherCount={propertyFiles.length}
          change={setLegalFiles}
          report={setError}
        />
        <EvidencePicker
          title="Ảnh hoặc video thực tế của bất động sản"
          hint=""
          buttonLabel="Thêm ảnh/video"
          types={propertyTypes}
          files={propertyFiles}
          otherCount={legalFiles.length}
          change={setPropertyFiles}
          report={setError}
        />
        <p className="text-xs ">
          Đã chọn {legalFiles.length + propertyFiles.length}/8 tệp
        </p>
        <label className="block font-medium">
          Ghi chú (không bắt buộc)
          <textarea
            className="mt-1 block w-full rounded-sm border p-2 font-normal"
            rows={2}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </fieldset>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Dialog.Close
          render={<Button type="button" variant="outline" disabled={pending} />}
        >
          Hủy
        </Dialog.Close>
        <Button
          type="submit"
          disabled={pending || !documentId || catalogState !== "ready"}
        >
          {pending ? "Đang gửi minh chứng…" : "Gửi yêu cầu xác thực"}
        </Button>
      </div>
    </form>
  );
}

export default function VerifyPostAction({
  post,
  onSubmitted,
  onRefresh,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [retryForm, setRetryForm] = useState(false);
  const request = post.xacThuc;
  if (post.trangThai !== "DA_DUYET") return null;
  if (request?.trangThai === "CHO_XU_LY")
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1 rounded-sm bg-amber-50 px-2 py-1 text-xs text-amber-800"
      >
        <Clock3 size={14} />
        Đang chờ xác thực
      </span>
    );
  if (request?.trangThai === "DA_XAC_THUC")
    return (
      <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
        <ShieldCheck size={14} />
        Đã xác thực
      </span>
    );
  const rejected = request?.trangThai === "TU_CHOI";
  const showReason = rejected && !retryForm;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          setOpen(next);
          if (next) setRetryForm(false);
        }
      }}
    >
      <Dialog.Trigger
        render={
          <Button
            type="button"
            variant="outline"
            className={rejected ? "text-red-700" : "text-primary"}
          />
        }
      >
        <ShieldCheck />
        {rejected ? "Xác thực bị từ chối · Xem lý do" : "Xác thực tin"}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop render={<Backdrop />} />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sm border bg-white p-5 shadow-lg sm:p-6">
          <Dialog.Title className="text-lg font-bold">
            {showReason ? "Lý do từ chối xác thực" : "Gửi minh chứng xác thực"}
          </Dialog.Title>
          {showReason ? (
            <>
              <p className="my-4 whitespace-pre-wrap wrap-break-word rounded-sm bg-red-50 p-3 text-sm">
                {request.lyDoXuLy || "Chưa có lý do xử lý."}
              </p>
              <div className="flex justify-end gap-2">
                <Dialog.Close render={<Button variant="outline" />}>
                  Đóng
                </Dialog.Close>
                <Button onClick={() => setRetryForm(true)}>Xác thực lại</Button>
              </div>
            </>
          ) : (
            <EvidenceForm
              post={post}
              pending={pending}
              setPending={setPending}
              onRefresh={onRefresh}
              onSubmitted={(result) => {
                setOpen(false);
                onSubmitted(result);
              }}
            />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
