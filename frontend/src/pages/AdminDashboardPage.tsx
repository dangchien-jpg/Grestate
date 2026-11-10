import PendingPostBadge from "@/components/admin/pending-post-badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/authStore";
import {
  ChartNoAxesCombined,
  CircleUserRound,
  Flag,
  ListChecks,
  Users,
} from "lucide-react";

const AdminDashboardPage = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={[
          {
            icon: <ChartNoAxesCombined />,
            title: "Dashboard",
            link: "/admin/dashboard",
          },
          {
            icon: (
              <span className="relative inline-flex">
                <ListChecks />
                <PendingPostBadge />
              </span>
            ),
            title: "Kiểm duyệt",
            link: "/admin/censor",
          },
          {
            icon: <Flag />,
            title: "Báo cáo",
            link: "/admin/reports",
          },
          {
            icon: <Users />,
            title: "Người dùng",
            link: "/admin/users",
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
      </main>
    </div>
  );
};

export default AdminDashboardPage;
