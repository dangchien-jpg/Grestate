import { BrowserRouter, Routes, Route } from "react-router";
import { SignInPage } from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import { Toaster } from "sonner";
import ProtectedRoute from "@/components/auth/protected-route";
import { ProfilePage } from "@/pages/ProfilePage";
import DetailPage from "@/pages/DetailPage";
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
            <Route path="/me/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
