import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/ui/sidebar";
import ProfileForm from "@/components/user/profile-form";
import { useAuthStore } from "@/stores/authStore";
import { Plus, ChartPie, ListChecks, CircleUserRound } from "lucide-react";

export const ProfilePage = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={[
          {
            icon: <Plus />,
            title: "Đăng tin",
            link: "/create-post",
            variant: "primary",
          },
          {
            icon: <ChartPie />,
            title: "Tổng quan",
            link: "/tong-quan",
          },
          {
            icon: <ListChecks />,
            title: "Tin đăng",
            link: "/me/manager-post",
          },
          {
            icon: <CircleUserRound />,
            title: "Tài khoản",
            link: "/me/profile",
          },
        ]}
      />

      <main className="min-w-0 flex-1 ">
        <header className="flex justify-between items-center w-full min-h-20 b bg-white  border border-slate-200 p-6">
          <h1 className="text-2xl font-bold">Trang cá nhân</h1>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold">{user?.hoTen}</h2>
            <Avatar>
              {user?.anhDaiDienUrl ? (
                <AvatarImage src={user.anhDaiDienUrl} />
              ) : (
                <AvatarImage src="/user.png" />
              )}
            </Avatar>
          </div>
        </header>
        <ProfileForm />
      </main>
    </div>
  );
};
