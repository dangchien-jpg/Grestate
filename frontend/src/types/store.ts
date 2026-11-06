import type {
  GiayToPhapLy,
  LoaiBatDongSan,
  PhuongXa,
  TinDang,
  TinDangDanhSach,
  TinhThanh,
} from "@/types/post";
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

export interface UserState {
  updateProfile: (
    fullName: string,
    email: string,
    phoneNumber: string,
    linkZalo: string,
  ) => Promise<void>;
  uploadAvatar: (formData: FormData) => Promise<void>;
}

export interface PostState {
  posts: TinDangDanhSach[];
  post: TinDangDanhSach | null;
  loading: boolean;
  fetchPost: () => Promise<void>;
  fetchDetailPost: (maTinDang: number) => Promise<void>;
  createPost: (formData: FormData) => Promise<TinDang>;
}

export interface CategoryState {
  categories: LoaiBatDongSan[];
  fetchCategories: () => Promise<void>;
}

export interface LegalDocumentState {
  legalDocuments: GiayToPhapLy[];
  fetchLegalDocument: () => Promise<void>;
}

export interface LocationState {
  provinces: TinhThanh[];
  wards: PhuongXa[];
  fetchProvinces: () => Promise<void>;
  fetchWardsByProvince: (maTinhThanh: string) => Promise<void>;
}
