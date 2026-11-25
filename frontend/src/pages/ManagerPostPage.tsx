import ManagerPostCard from "@/components/manager-post/manager-post-card";
import AccountMenu from "@/components/layout/account-menu";
import Sidebar from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/authStore";
import { CircleUserRound, ListChecks, Plus } from "lucide-react";

const ManagerPostPage = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col bg-[#fff] font-sans text-foreground md:flex-row">
      <Sidebar
        className="max-md:static max-md:h-auto max-md:w-full max-md:flex-row max-md:items-center max-md:border-r-0 max-md:border-b max-md:[&>a]:min-h-0 max-md:[&>a]:p-3 max-md:[&_nav]:p-0 max-md:[&_ul]:flex max-md:[&_li]:m-0 max-md:[&_li]:flex-1 max-md:[&_li]:border-0 max-md:[&_li]:p-0 max-md:[&_li_a]:min-h-14 max-md:[&_li_a]:gap-0 max-md:[&_li_a]:py-1 max-md:[&_li_a]:border-r-0 max-md:[&_li_a[aria-current=page]]:bg-primary/5"
        items={[
          {
            icon: <Plus />,
            title: "Đăng tin",
            link: "/me/create-post",
            variant: "primary",
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
      <main className="min-w-0 flex-1">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex  items-center justify-between gap-4 py-5 px-4">
            <h1 className="text-xl font-semibold tracking-tight sm:text-xl">
              Quản lý tin đăng
            </h1>
            <div className="flex items-center gap-3">
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
