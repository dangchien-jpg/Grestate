import ManagerPostCard from "@/components/manager-post/manager-post-card";
import AccountMenu from "@/components/layout/account-menu";
import UserSidebar from "@/components/layout/user-sidebar";
import { useAuthStore } from "@/stores/authStore";
import { Plus } from "lucide-react";
import { Link } from "react-router";

const ManagerPostPage = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col bg-[#dedede] font-sans text-foreground md:flex-row">
      <UserSidebar key={user?.maNguoiDung} />
      <main className="min-w-0 flex-1">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex  items-center justify-between gap-4 py-5 px-4">
            <div className="flex items-center gap-2 text-sm font-semibold sm:text-sm">
              <p className="text-[#aaa]">Trang quản lý /</p>
              <p>Quản lý tin đăng</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to={"/me/create-post"}
                className="flex items-center gap-1 rounded-sm h-10 text-sm bg-primary text-white px-4"
              >
                {" "}
                <Plus className="size-5 " /> Đăng tin mới
              </Link>
              <span className="hidden text-sm font-medium sm:inline">
                {user?.hoTen}
              </span>
              <AccountMenu />
            </div>
          </div>
        </header>

        <ManagerPostCard />
      </main>
    </div>
  );
};

export default ManagerPostPage;
