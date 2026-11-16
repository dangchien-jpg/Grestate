import api from "@/lib/axios";
import type { GiayToPhapLy } from "@/types/post";

export type LegalDocumentPayload = Pick<GiayToPhapLy, "tenGiayTo" | "moTa">;

export const legalDocumentService = {
  fetchLegalDocuments: async (signal?: AbortSignal) => {
    const res = await api.get<{ documents: GiayToPhapLy[] }>(
      "/legal-documents",
      { signal },
    );
    return res.data.documents;
  },
  create: async (data: LegalDocumentPayload) =>
    (
      await api.post<{ message: string; document: GiayToPhapLy }>(
        "/admin/legal-documents",
        data,
      )
    ).data,
  update: async (id: number, data: LegalDocumentPayload) =>
    (
      await api.put<{ message: string; document: GiayToPhapLy }>(
        `/admin/legal-documents/${id}`,
        data,
      )
    ).data,
  remove: async (id: number) =>
    (await api.delete<{ message: string }>(`/admin/legal-documents/${id}`))
      .data,
};
