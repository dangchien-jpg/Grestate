import api from "@/lib/axios";

export const userService = {
  updateProfile: async (
    fullName: string,
    email: string,
    phoneNumber: string,
    linkZalo: string,
  ) => {
    const res = await api.put("/users/me", {
      fullName,
      email,
      phoneNumber,
      linkZalo,
    });
    return res.data;
  },

  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/me/upload_avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data;
  },
};
