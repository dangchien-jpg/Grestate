import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "@/stores/authStore";

export default function AdminProtectedRoute() {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Navigate to="/signin" replace />;

  if (user.maVaiTro !== 2) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
