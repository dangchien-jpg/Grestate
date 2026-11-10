import { BrowserRouter, Routes, Route } from "react-router";
import { SignInPage } from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
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
function App() {
  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/detail/:maTinDang" element={<DetailPage />} />
          {/* Private routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/predict" element={<PredictPage />} />
            <Route path="/me/profile" element={<ProfilePage />} />
            <Route path="/me/create-post" element={<CreatePostPage />} />
            <Route path="/me/favorite-post" element={<FavoritePostPage />} />
            <Route path="/me/manager-post" element={<ManagerPostPage />} />

            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/censor" element={<AdminCensorPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
