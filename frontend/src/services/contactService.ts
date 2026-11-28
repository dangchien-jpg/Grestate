import api from "@/lib/axios";
import { isAxiosError } from "axios";

export interface ContactInput {
  tenLienHe: string;
  soDienThoaiLienHe: string;
  loiNhan?: string;
}

export interface ContactRequest {
  maYeuCau: number;
  maTinDang: number;
  tenLienHe: string;
  soDienThoaiLienHe: string;
  loiNhan: string | null;
  trangThai: "CHO_LIEN_HE" | "DA_LIEN_HE";
  ngayGui: string;
  ngayLienHe: string | null;
}

export interface ListedContact extends ContactRequest {
  tinDang: {
    maTinDang: number;
    tieuDe: string;
    trangThai: string;
    giaNiemYet?: string | number;
    hinhAnhTinDangs?: { hinhAnhUrl: string }[];
  };
}

interface ContactList {
  requests: ListedContact[];
  total: number;
}

export async function createContactRequest(postId: number, input: ContactInput) {
  return (await api.post<{ message: string; yeuCau: ContactRequest }>(
    `/contact/post/${postId}`, input,
  )).data;
}

export async function fetchSentContactRequests(postId: number) {
  return (await api.get<ContactList>("/contact/sent", { params: { maTinDang: postId } })).data;
}

export async function fetchPendingContactCount() {
  return (await api.get<{ total: number }>("/contact/received/pending-count")).data.total;
}

export async function fetchReceivedContactRequests() {
  return (await api.get<ContactList>("/contact/received")).data;
}

export async function markContactRequestContacted(id: number) {
  return (await api.patch<{ message: string }>(`/contact/${id}/contacted`)).data;
}

export function contactError(error: unknown) {
  return (isAxiosError(error) && error.response?.data?.message) || "Không thể kết nối. Vui lòng thử lại.";
}
