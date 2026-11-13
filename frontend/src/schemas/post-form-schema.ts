import { z } from "zod";
import type { LoaiBatDongSan } from "@/types/post";

export const MAX_IMAGES = 6;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const optionalDimension = z.string().trim().refine(
  (value) => value === "" || (Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 9999999999.99),
  "Kích thước phải lớn hơn 0 và không vượt quá 9.999.999.999,99 m",
);

export const createPostSchema = (categories: Pick<LoaiBatDongSan, "maLoaiBatDongSan" | "nhomBatDongSan">[]) => z.object({
  nguoiLienHe: z.string().trim().min(1, "Vui lòng nhập tên liên hệ").max(100, "Tên tối đa 100 ký tự"),
  soDienThoaiLienHe: z.string().trim().min(1, "Vui lòng nhập số điện thoại").max(15, "Số điện thoại tối đa 15 ký tự").regex(/^\+?[0-9]{9,15}$/, "Số điện thoại không hợp lệ"),
  matTien: optionalDimension,
  matDuong: optionalDimension,
  houseDirection: z.string().optional(),
  huongBanCong: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  floors: z.string().optional(),
  noiThat: z.enum(["", "Đầy đủ nội thất", "Cơ bản", "Chưa có"]).optional(),
  images: z
    .array(
      z
        .instanceof(File)
        .refine(
          (file) => IMAGE_TYPES.includes(file.type),
          "Chỉ chấp nhận JPG, PNG, WebP.",
        ),
    )
    .min(1, "Vui lòng chọn ít nhất 1 ảnh.")
    .max(MAX_IMAGES, "Tối đa 6 ảnh."),

  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề không thể để trống")
    .max(200, "Tiêu đề tối đa 200 ký tự"),
  description: z.string().trim().min(1, "Mô tả không thể để trống"),
  categoryId: z
    .number()
    .nullable()
    .refine(
      (value) => value !== null && value > 0,
      "Vui lòng chọn loại bất động sản",
    ),
  legalDocumentId: z
    .number({ error: "Vui lòng chọn giấy tờ pháp lý" })
    .nullable()
    .refine((value) => value !== null && value > 0, "Vui lòng chọn giấy tờ"),
  provinceCode: z.string().min(1, "Vui lòng chọn tỉnh / thành phố"),
  wardId: z
    .number()
    .nullable()
    .refine(
      (value) => value !== null && value > 0,
      "Vui lòng chọn phường / xã",
    ),
  address: z
    .string()
    .trim()
    .min(1, "Địa chỉ không thể để trống")
    .max(255, "Địa chỉ tối đa 255 ký tự"),
  price: z
    .string()
    .trim()
    .min(1, "Giá không thể để trống")
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) >= 0,
      "Giá phải là số không âm",
    ),
  area: z
    .string()
    .trim()
    .min(1, "Diện tích không thể để trống")
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) > 0,
      "Diện tích phải lớn hơn 0",
    ),
}).superRefine((data, ctx) => {
  const category = categories.find((item) => item.maLoaiBatDongSan === data.categoryId);
  if (category?.nhomBatDongSan !== "NHA") return;
  for (const name of ["bedrooms", "bathrooms", "floors"] as const) {
    const value = data[name];
    if (value && (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 2147483647)) {
      ctx.addIssue({ code: "custom", path: [name], message: "Nhập số nguyên không âm, tối đa 2147483647" });
    }
  }
});

export type PostFormValues = z.infer<ReturnType<typeof createPostSchema>>;

