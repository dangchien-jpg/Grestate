import AccountMenu from "@/components/layout/account-menu";
import UserSidebar from "@/components/layout/user-sidebar";
import ProfileForm from "@/components/user/profile-form";
import { useAuthStore } from "@/stores/authStore";

export const ProfilePage = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <UserSidebar key={user?.maNguoiDung} />

      <main className="min-w-0 flex-1 ">
        <header className="flex justify-between items-center w-full min-h-20 b bg-white  border border-slate-200 p-6">
          <h1 className="text-2xl font-bold">Trang cá nhân</h1>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold">{user?.hoTen}</h2>
            <AccountMenu />
          </div>
        </header>
        <ProfileForm />
      </main>
    </div>
  );
};
