import api from "@/lib/axios";
import { isAxiosError } from "axios";

export type GenerateContentInput = {
  categoryName: string;
  provinceName: string;
  wardName: string;
  address: string;
  price: string | number;
  area: string | number;
  legalDocumentName?: string;
  houseDirection?: string;
  huongBanCong?: string;
  noiThat?: string;
  bedrooms?: string;
  bathrooms?: string;
  floors?: string;
  matTien?: string;
  matDuong?: string;
};

export type GeneratedContent = {
  title: string;
  description: string;
};

export const generateContentService = {
  generate: async (input: GenerateContentInput): Promise<GeneratedContent> =>
    (
      await api.post<GeneratedContent>("/generate-content", input, {
        timeout: 90_000,
      })
    ).data,
};

export function generateContentError(error: unknown): string {
  if (isAxiosError(error)) {
    if (typeof error.response?.data?.message === "string")
      return error.response.data.message;
    if (error.code === "ECONNABORTED")
      return "AI phản hồi quá lâu. Vui lòng thử lại.";
  }
  return "Không thể tạo nội dung. Vui lòng kiểm tra kết nối và thử lại.";
}
