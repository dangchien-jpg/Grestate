import { legalDocumentService } from "@/services/legalDocumentService";
import type { LegalDocumentState } from "@/types/store";
import { create } from "zustand";

export const useLegalDocumentStore = create<LegalDocumentState>((set) => ({
  legalDocuments: [],
  fetchLegalDocument: async () => {
    try {
      const legalDocuments = await legalDocumentService.fetchLegalDocuments();
      set({ legalDocuments });
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
}));
