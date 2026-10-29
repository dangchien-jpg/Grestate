import type { NguoiDung } from "@/types/user";

export interface AuthState {
  accessToken: string | null;
  user: NguoiDung | null;
  loading: boolean;
  clearState: () => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: NguoiDung) => void;
  signUp: (
    password: string,
    email: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
  fetchMe: () => Promise<void>;
}
