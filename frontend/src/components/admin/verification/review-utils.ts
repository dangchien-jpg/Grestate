import { isAxiosError } from "axios";

export const reviewPath = "/admin/verify-post";
const formatter = new Intl.DateTimeFormat("vi-VN", { dateStyle:"short", timeStyle:"short", timeZone:"Asia/Ho_Chi_Minh" });
export const dateTime = (value:string) => formatter.format(new Date(value));
export const errorMessage = (e:unknown) => isAxiosError(e) && typeof e.response?.data?.message === "string"
  ? e.response.data.message : "Không thể kết nối. Vui lòng thử lại.";
