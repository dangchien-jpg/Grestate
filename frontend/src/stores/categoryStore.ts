import { categoryService } from "@/services/categoryService";
import type { CategoryState } from "@/types/store";
import { create } from "zustand";

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],

  fetchCategories: async () => {
    try {
      const categories = await categoryService.fetchCategories();
      set({ categories });
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
