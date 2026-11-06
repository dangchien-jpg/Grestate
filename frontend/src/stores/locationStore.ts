import { locationService } from "@/services/locationService";
import type { LocationState } from "@/types/store";
import { create } from "zustand";

export const useLocationStore = create<LocationState>((set) => ({
  provinces: [],
  wards: [],

  fetchProvinces: async () => {
    try {
      const provinces = await locationService.fetchProvinces();
      set({ provinces });
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  fetchWardsByProvince: async (maTinhThanh) => {
    try {
      const wards = await locationService.fetchWardsByProvince(maTinhThanh);
      set({ wards });
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
