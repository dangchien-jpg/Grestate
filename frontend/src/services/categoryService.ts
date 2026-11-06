import api from "@/lib/axios";

export const categoryService = {
  fetchCategories: async () => {
    const res = await api.get("/categories");
    return res.data.categories;
  },
};
