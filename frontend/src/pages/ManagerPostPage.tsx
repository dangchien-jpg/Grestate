import ManagerPostCard from "@/components/manager-post/manager-post-card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/authStore";
import { ChartPie, CircleUserRound, ListChecks, Plus } from "lucide-react";

const ManagerPostPage = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans ">
      <Sidebar
        items={[
          {
            icon: <Plus />,
            title: "Đăng tin",
            link: "/me/create-post",
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
        <header className="flex min-h-20 w-full flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white p-4 sm:p-6">
          <h1 className="text-2xl font-bold">Trang quản lý tin đăng</h1>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold">{user?.hoTen}</h2>
            <Avatar className="rounded-full after:rounded-full">
              {user?.anhDaiDienUrl ? (
                <AvatarImage
                  src={user.anhDaiDienUrl}
                  className="rounded-full"
                />
              ) : (
                <AvatarImage src="/user.png" className="rounded-full" />
              )}
            </Avatar>
          </div>
        </header>

        <ManagerPostCard />
      </main>
    </div>
  );
};

export default ManagerPostPage;
