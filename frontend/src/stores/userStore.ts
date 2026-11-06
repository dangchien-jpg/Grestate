import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/authStore";
import type { UserState } from "@/types/store";
import { create } from "zustand";

export const useUserStore = create<UserState>(() => ({
  updateProfile: async (fullName, email, phoneNumber, linkZalo) => {
    try {
      const { fetchMe } = useAuthStore.getState();
      await userService.updateProfile(fullName, email, phoneNumber, linkZalo);
      fetchMe();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  uploadAvatar: async (formData) => {
    try {
      const { fetchMe } = useAuthStore.getState();
      await userService.uploadAvatar(formData);
      fetchMe();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
