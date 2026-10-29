import api from "@/lib/axios";

export const authService = {
  signUp: async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => {
    const res = await api.post(
      "/auth/signup",
      {
        firstName,
        lastName,
        email,
        password,
      },
      {
        withCredentials: true,
      },
    );
    return res.data;
  },

  signIn: async (email: string, password: string) => {
    const res = await api.post("/auth/signin", { email, password });
    return res.data;
  },

  signOut: async () => {
    return await api.post("/auth/signout", {}, { withCredentials: true });
  },

  refreshToken: async () => {
    const res = await api.post("/auth/refresh_token", {}, {
      withCredentials: true,
    });
    return res.data.accessToken;
  },

  fetchMe: async () => {
    const res = await api.get("/users/me");
    return res.data.user;
  },
};
