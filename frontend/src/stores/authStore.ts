import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,
      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
      },
      setAccessToken: (accessToken) => {
        set({ accessToken });
      },
      setUser: (user) => {
        set({ user });
      },

      signUp: async (password, email, firstName, lastName) => {
        try {
          set({ loading: true });
          await authService.signUp(firstName, lastName, email, password);
        } catch (error) {
          console.error(error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      signIn: async (email, password) => {
        try {
          get().clearState();
          set({ loading: true });
          const { accessToken } = await authService.signIn(email, password);
          get().setAccessToken(accessToken);
        } catch (error) {
          console.error(error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      signOut: async () => {
        try {
          get().clearState();
          await authService.signOut();
        } catch (error) {
          console.error(error);
          throw error;
        }
      },

      refreshToken: async () => {
        try {
          set({ loading: true });
          const { setAccessToken } = get();
          const accessToken = await authService.refreshToken();
          setAccessToken(accessToken);
        } catch (error) {
          console.error(error);
          get().clearState();
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
