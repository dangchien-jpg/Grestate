import { useAuthStore } from "@/stores/authStore";
import { usePostStore } from "@/stores/postStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const ProtectedRoute = () => {
  const { accessToken, user, loading, fetchMe, refreshToken } = useAuthStore();
  const { fetchPost } = usePostStore();
  const [starting, setStarting] = useState(true);
  useEffect(() => {
    const init = async () => {
      if (!accessToken) {
        await refreshToken();
      }

      if (accessToken && !user) {
        await fetchMe();
      }

      if (user) {
        await fetchPost();
      }

      setStarting(false);
    };
    init();
  }, []);

  if (loading || starting) {
    return (
      <div className="flex h-screen items-center justify-center bg-popover">
        <p>Loading...</p>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
