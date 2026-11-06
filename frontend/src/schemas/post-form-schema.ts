import { z } from "zod";
import type { LoaiBatDongSan } from "@/types/post";

export const MAX_IMAGES = 6;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const optionalDimension = z.string().trim().refine(
  (value) => value === "" || (Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 9999999999.99),
  "K\u00edch th\u01b0\u1edbc ph\u1ea3i l\u1edbn h\u01a1n 0 v\u00e0 kh\u00f4ng v\u01b0\u1ee3t qu\u00e1 9.999.999.999,99 m",
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
  noiThat: z.enum(["", "\u0110\u1ea7y \u0111\u1ee7 n\u1ed9i th\u1ea5t", "C\u01a1 b\u1ea3n", "Ch\u01b0a c\u00f3"]).optional(),
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
      ctx.addIssue({ code: "custom", path: [name], message: "Nh\u1eadp s\u1ed1 nguy\u00ean kh\u00f4ng \u00e2m, t\u1ed1i \u0111a 2147483647" });
    }
  }
});

export type PostFormValues = z.infer<ReturnType<typeof createPostSchema>>;

