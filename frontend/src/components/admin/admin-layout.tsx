import PendingReportBadge from "@/components/admin/post-report/pending-report-badge";
import PendingPostBadge from "@/components/admin/pending-post-badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import type { ReactNode } from "react";
import Sidebar from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/authStore";
import {
  ChartNoAxesCombined,
  CircleUserRound,
  Flag,
  ListChecks,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

interface AdminLayoutProps {
  title: string;
  children?: ReactNode;
}

const AdminLayout = ({ title, children }: AdminLayoutProps) => {
  const { user, signOut } = useAuthStore();
  const navigation = useNavigate();

  const handleSignout = async () => {
    try {
      await signOut();
      navigation("/signin");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi đăng xuất");
    }
  };
  return (
    <div className="flex min-h-screen bg-background font-sans">
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
            icon: <span className="relative inline-flex"><Flag /><PendingReportBadge /></span>,
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
        <header className="flex justify-between items-center w-full min-h-20 bg-white  border border-slate-200 p-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold">{user?.hoTen}</h2>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar>
                  {user?.anhDaiDienUrl ? (
                    <AvatarImage src={user.anhDaiDienUrl} />
                  ) : (
                    <AvatarImage src="/user.png" />
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{user?.hoTen}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link to="/me/profile" className="flex gap-2">
                      <Settings /> Cài đặt tài khoản
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleSignout}
                  >
                    <LogOut /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
