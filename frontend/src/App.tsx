import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  type Location,
} from "react-router";
import AuthDialog from "@/components/auth/auth-dialog";

import VerifyEmailPage from "./pages/VerifyEmailPage";
import PropertyListPage from "./pages/PropertyListPage";
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
import AdminManagerUser from "@/pages/AdminManagerUser";
import DisabledAccount from "@/pages/DisabledAccount";
import AdminManagerCategoryPage from "@/pages/AdminManagerCategoryPage";
import AdminManagerLegalDocumentPage from "@/pages/AdminManagerLegalDocumentPage";
import ChatWidget from "@/components/chat/chat-widget";
import NewsPage from "@/pages/NewsPage";
import Contact from "@/pages/Contact";
import ProjectPage from "@/pages/ProjectPage";

function AppRoutes() {
  const location = useLocation();
  const backgroundLocation = (
    location.state as { backgroundLocation?: Location } | null
  )?.backgroundLocation;
  const authOpen =
    location.pathname === "/signin" || location.pathname === "/signup";
  return (
    <>
      <Toaster richColors />

      <Routes location={authOpen ? (backgroundLocation ?? "/") : location}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/nha-dat-ban" element={<PropertyListPage key={location.key} />} />
        <Route path="/detail/:maTinDang" element={<DetailPage />} />
        <Route path="/projects" element={<ProjectPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/disabled-account" element={<DisabledAccount />} />

        <Route path="/verify-email" element={<VerifyEmailPage />} />

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
            <Route path="/admin/users" element={<AdminManagerUser />} />
            <Route
              path="/admin/categories"
              element={<AdminManagerCategoryPage />}
            />
            <Route
              path="/admin/legal-documents"
              element={<AdminManagerLegalDocumentPage />}
            />
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
