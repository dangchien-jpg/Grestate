import { useEffect, useState } from "react";
import { CircleUserRound, ListChecks, Plus, UsersRound } from "lucide-react";
import Sidebar from "@/components/ui/sidebar";
import { fetchPendingContactCount } from "@/services/contactService";

export function UserNavigation({ pending }: { pending?: number }) {
  return <Sidebar
    className="max-md:static max-md:h-auto max-md:w-full max-md:flex-row max-md:items-center max-md:border-r-0 max-md:border-b max-md:[&>a]:min-h-0 max-md:[&>a]:p-2 max-md:[&_nav]:p-0 max-md:[&_ul]:flex max-md:[&_li]:m-0 max-md:[&_li]:flex-1 max-md:[&_li]:border-0 max-md:[&_li]:p-0 max-md:[&_li_a]:min-h-16 max-md:[&_li_a]:gap-0 max-md:[&_li_a]:border-r-0"
    items={[
      { icon: <Plus />, title: "Đăng tin", link: "/me/create-post", variant: "primary" },
      { icon: <ListChecks />, title: "Tin đăng", link: "/me/manager-post" },
      { icon: <UsersRound />, title: "Khách hàng", link: "/me/customers", badgeClassName: "-top-1 left-full", badge: pending ? <span aria-label={`${pending} yêu cầu chờ liên hệ`}>{pending}</span> : undefined },
      { icon: <CircleUserRound />, title: "Tài khoản", link: "/me/profile" },
    ]}
  />;
}

export default function UserSidebar() {
  const [pending, setPending] = useState<number>();
  useEffect(() => {
    let active = true;
    let loading = false;
    async function refresh() {
      if (loading || document.hidden) return;
      loading = true;
      try {
        const count = await fetchPendingContactCount();
        if (active) setPending(count);
      } catch {
        // Retry when the window regains focus or the next interval runs.
      } finally {
        loading = false;
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return <UserNavigation pending={pending} />;
}
