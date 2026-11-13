import { useId, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Dialog } from "@base-ui/react/dialog";
import { LoaderCircle, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategoryStore } from "@/stores/categoryStore";
import { useLocationStore } from "@/stores/locationStore";
import { useLegalDocumentStore } from "@/stores/legalDocumentStore";
import type { PostFormValues } from "@/schemas/post-form-schema";
import {
  generateContentService,
  generateContentError,
  type GeneratedContent,
  type GenerateContentInput,
} from "@/services/generateContentService";

export default function GenerateContentForm() {
  const {
    getValues,
    trigger,
    setValue,
    formState: { isSubmitting },
  } = useFormContext<PostFormValues>();
  const categories = useCategoryStore((s) => s.categories);
  const provinces = useLocationStore((s) => s.provinces);
  const wards = useLocationStore((s) => s.wards);
  const documents = useLegalDocumentStore((s) => s.legalDocuments);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [input, setInput] = useState<GenerateContentInput | null>(null);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const id = useId();

  async function showDialog() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const category = categories.find(
        (c) => c.maLoaiBatDongSan === getValues("categoryId"),
      );
      const fields: (keyof PostFormValues)[] = [
        "categoryId",
        "provinceCode",
        "wardId",
        "address",
        "price",
        "area",
        "legalDocumentId",
        "matTien",
        "matDuong",
      ];
      if (category?.nhomBatDongSan === "NHA")
        fields.push("bedrooms", "bathrooms", "floors");
      if (!(await trigger(fields, { shouldFocus: true }))) {
        toast.error(
          "Vui lòng hoàn thành thông tin bất động sản phía trên trước khi tạo AI.",
        );
        return;
      }
      const v = getValues();
      const province = provinces.find((p) => p.maTinhThanh === v.provinceCode);
      const ward = wards.find(
        (w) => w.maPhuongXa === v.wardId && w.maTinhThanh === v.provinceCode,
      );
      if (!category || !province || !ward) {
        toast.error("Vui lòng chọn lại loại bất động sản và địa chỉ.");
        return;
      }
      setInput({
        categoryName: category.tenLoai,
        provinceName: province.tenTinhThanh,
        wardName: ward.tenPhuongXa,
        address: v.address,
        price: v.price,
        area: v.area,
        legalDocumentName: documents.find(
          (d) => d.maGiayTo === v.legalDocumentId,
        )?.tenGiayTo,
        houseDirection: v.houseDirection,
        matTien: v.matTien,
        matDuong: v.matDuong,
        ...(category.nhomBatDongSan === "NHA"
          ? {
              bedrooms: v.bedrooms,
              bathrooms: v.bathrooms,
              floors: v.floors,
              huongBanCong: v.huongBanCong,
              noiThat: v.noiThat,
            }
          : {}),
      });
      setResult(null);
      setError("");
      setOpen(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function generate() {
    if (lock.current || !input) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await generateContentService.generate(input);
      if (
        typeof response.title !== "string" ||
        !response.title.trim() ||
        response.title.length > 200 ||
        typeof response.description !== "string" ||
        !response.description.trim()
      ) {
        throw new Error("Invalid AI response");
      }
      setResult(response);
    } catch (failure) {
      setError(generateContentError(failure));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const canApply = !!result?.title.trim() && !!result?.description.trim();
  function apply() {
    if (!result || !canApply || busy || isSubmitting) return;
    setValue("title", result.title.trim(), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("description", result.description.trim(), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setOpen(false);
    toast.success("Đã điền tiêu đề và mô tả vào tin đăng.");
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={busy || isSubmitting}
        onClick={() => void showDialog()}
        className="rounded-full bg-gradient-primary text-white"
      >
        <Sparkles className="size-4" /> Tạo bằng AI
      </Button>
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          if (!lock.current) setOpen(next);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/50" />
          <Dialog.Popup
            aria-busy={busy}
            className="fixed top-1/2 left-1/2 z-[61] max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sm bg-background p-6 shadow-xl outline-none"
          >
            <div className="flex items-center justify-between gap-3">
              <Dialog.Title className="text-lg font-bold">
                Tạo tiêu đề và mô tả bằng AI
              </Dialog.Title>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Đóng"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                <X />
              </Button>
            </div>
            {!result && !busy && (
              <p className="mt-4 text-sm">
                Bấm "Tạo nội dung" để AI viết tiêu đề và mô tả.
              </p>
            )}
            {busy && (
              <p role="status" className="mt-4 text-sm">
                AI đang tạo nội dung, vui lòng chờ...
              </p>
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}
            {result && (
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`${id}-title`} className="text-sm font-bold">
                    Tiêu đề
                  </Label>
                  <Input
                    id={`${id}-title`}
                    value={result.title}
                    maxLength={200}
                    disabled={busy}
                    className="h-12 rounded-full border border-[#ccc]"
                    onChange={(event) =>
                      setResult({ ...result, title: event.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {result.title.length}/200 ký tự
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor={`${id}-description`}
                    className="text-sm font-bold"
                  >
                    Mô tả
                  </Label>
                  <textarea
                    id={`${id}-description`}
                    value={result.description}
                    maxLength={5000}
                    disabled={busy}
                    rows={9}
                    className="w-full rounded-sm  bg-background border border-[#ccc] shadow-sm p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    onChange={(event) =>
                      setResult({ ...result, description: event.target.value })
                    }
                  />
                </div>
                <p className="text-sm text-amber-600">
                  AI có thể không chính xác. Kiểm tra thông tin trước khi dùng.
                  Bấm "Sử dụng" sẽ thay thế tiêu đề và mô tả hiện tại.
                </p>
              </div>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy || !input}
                onClick={() => void generate()}
                className="border border-[#ccc] rounded-sm"
              >
                {busy ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {busy ? "Đang tạo..." : result ? "Tạo lại" : "Tạo nội dung"}
              </Button>
              <Button
                type="button"
                disabled={busy || isSubmitting || !canApply}
                onClick={apply}
              >
                Sử dụng
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
