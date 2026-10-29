import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const ProtectedRoute = () => {
  const { accessToken, user, loading, fetchMe, refreshToken } = useAuthStore();
  const [starting, setStarting] = useState(true);
  useEffect(() => {
    const init = async () => {
      if (!accessToken) {
        await refreshToken();
      }

      if (accessToken && !user) {
        await fetchMe();
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
