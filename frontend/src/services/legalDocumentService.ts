import api from "@/lib/axios";

export const legalDocumentService = {
  fetchLegalDocuments: async () => {
    const res = await api.get("/legal-documents");
    return res.data.documents;
  },
};
