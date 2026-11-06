import api from "@/lib/axios";

export const locationService = {
  fetchProvinces: async () => {
    const res = await api.get("/provinces");
    return res.data.provinces;
  },

  fetchWardsByProvince: async (maTinhThanh: string) => {
    const res = await api.get(`/provinces/${maTinhThanh}/wards`);
    return res.data.wards;
  },
};
