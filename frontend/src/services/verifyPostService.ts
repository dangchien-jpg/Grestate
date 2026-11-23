import api from "@/lib/axios";
import type { VerificationSummary } from "@/types/post";

type Submission = {
  maGiayTo: number;
  hoSoPhapLy: File[];
  batDongSan: File[];
  ghiChuNguoiGui: string;
};

type VerificationResponse = {
  message: string;
  yeuCau: Omit<VerificationSummary, "lyDoXuLy"> & { lyDoXuLy?: string | null };
};

export const verificationLabels = {
  CHO_XU_LY: "Chờ xác thực",
  DA_XAC_THUC: "Đã xác thực",
  TU_CHOI: "Từ chối",
} satisfies Record<VerificationSummary["trangThai"], string>;

export type PendingVerification = {
  minhChungs: { giayTo: { tenGiayTo: string } | null }[];
  maYeuCau: number; maTinDang: number; ngayGui: string;
  nguoiYeuCau: { hoTen: string }; tinDang: { daXacThuc?: boolean; tieuDe: string };
};

export type VerificationDetail = Omit<PendingVerification, "minhChungs"> & {
  trangThai: VerificationSummary["trangThai"];
  lyDoXuLy: string | null;
  ghiChuNguoiGui: string | null;
  tinDang: { daXacThuc?: boolean; tieuDe: string; diaChiChiTiet: string };
  coTheXacThuc: boolean;
  minhChungs: {
    maMinhChung: number; loaiTep: "ANH" | "VIDEO";
    nhomMinhChung: "HO_SO_PHAP_LY" | "BAT_DONG_SAN_THUC_TE";
    url: string; moTa: string | null; giayTo: { tenGiayTo: string } | null;
  }[];
};

export const verifyPostService = {
  list: async (trangThai: VerificationSummary["trangThai"], signal?: AbortSignal) =>
    (await api.get<{requests: PendingVerification[]}>("/verify-post/pending", { params: { trangThai }, signal })).data.requests,
  detail: async (id: number, signal?: AbortSignal) =>
    (await api.get<{yeuCau: VerificationDetail}>(`/verify-post/pending/${id}`, { signal })).data.yeuCau,
  submit: async (postId: number, evidence: Submission) => {
    const form = new FormData();
    form.append("maGiayTo", String(evidence.maGiayTo));
    if (evidence.ghiChuNguoiGui.trim()) form.append("ghiChuNguoiGui", evidence.ghiChuNguoiGui.trim());
    evidence.hoSoPhapLy.forEach(file => form.append("hoSoPhapLy", file));
    evidence.batDongSan.forEach(file => form.append("batDongSan", file));
    const { data } = await api.post<VerificationResponse>(`/verify-post/${postId}`, form);
    return { ...data.yeuCau, lyDoXuLy: data.yeuCau.lyDoXuLy ?? null };
  },
  accept: async (requestId: number, lyDoXuLy?: string) =>
    (await api.put<VerificationResponse>(`/verify-post/${requestId}/accept`, { lyDoXuLy })).data,
  reject: async (requestId: number, lyDoXuLy: string) =>
    (await api.put<VerificationResponse>(`/verify-post/${requestId}/reject`, { lyDoXuLy })).data,
};
