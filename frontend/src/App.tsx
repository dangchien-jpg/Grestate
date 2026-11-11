import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import AuthDialog from "@/components/auth/auth-dialog";

import HomePage from "./pages/HomePage";
import { Toaster } from "sonner";
import ProtectedRoute from "@/components/auth/protected-route";
import { ProfilePage } from "@/pages/ProfilePage";
import DetailPage from "@/pages/DetailPage";
import CreatePostPage from "@/pages/CreatePostPage";
import PredictPage from "@/pages/PredictPage";
import FavoritePostPage from "@/pages/FavoritePostPage";
import ManagerPostPage from "@/pages/ManagerPostPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminProtectedRoute from "@/components/auth/admin-protected-route";
import AdminCensorPage from "@/pages/AdminCensorPage";
import AdminReportPage from "@/pages/AdminReportPage";
import ChatWidget from "@/components/chat/chat-widget";
function AppRoutes() {
  const location = useLocation();
  const authOpen =
    location.pathname === "/signin" || location.pathname === "/signup";
  return (
    <>
      <Toaster richColors />

      <Routes location={authOpen ? "/" : location}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/detail/:maTinDang" element={<DetailPage />} />
        {/* Private routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/me/profile" element={<ProfilePage />} />
          <Route path="/me/create-post" element={<CreatePostPage />} />
          <Route path="/me/favorite-post" element={<FavoritePostPage />} />
          <Route path="/me/manager-post" element={<ManagerPostPage />} />

          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/censor" element={<AdminCensorPage />} />
            <Route path="/admin/reports" element={<AdminReportPage />} />
          </Route>
        </Route>
      </Routes>
      <ChatWidget />
      {authOpen && <AuthDialog />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
