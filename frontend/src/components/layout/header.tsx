import {
  Heart,
  Menu,
  Plus,
  UserRound,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import AccountMenu from "@/components/layout/account-menu";
import Notification from "@/components/notification/notification";

import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useFavorites } from "@/hooks/use-favorites";

const Header = () => {
  useFavorites();
  const { user } = useAuthStore();
  const savedCount = useFavoriteStore((state) => state.posts.length);
  const favoriteCount = user ? savedCount : 0;
  const location = useLocation();
  const menuItems = [
    { to: "/nha-dat-ban", label: "Nhà đất bán" },
    { to: "/projects", label: "Dự án" },
    { to: "/predict", label: "Định giá AI" },
    { to: "/news", label: "Tin tức" },
    { to: "/contact", label: "Liên hệ" },
  ];
  const isMenuActive = (to: string) => {
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link to="/">
          <img
            src="/Grestate_Logo_Vector.svg"
            alt="Grestate Logo"
            className="w-44 h-auto"
          />
        </Link>
        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-7 text-sm font-medium lg:flex"
        >
          {menuItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              aria-current={isMenuActive(to) ? "page" : undefined}
              className={`border-b-2 py-7 transition-colors hover:text-primary ${isMenuActive(to) ? "border-primary text-primary" : "border-transparent"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/me/favorite-post"
            aria-label={`Tin đăng đã lưu: ${favoriteCount} tin`}
            className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Heart aria-hidden="true" className="size-6" />
            {favoriteCount > 0 && (
              <span
                aria-live="polite"
                aria-atomic="true"
                className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-white"
              >
                {favoriteCount}
              </span>
            )}
          </Link>
          {user && <Notification key={user.maNguoiDung} />}
          {user ? (
            <AccountMenu />
          ) : (
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 rounded-full border border-[#ccc] px-3 py-2 text-xs font-semibold"
            >
              <UserRound className="size-5" />
              Đăng nhập
            </Link>
          )}

          <Link
            to="/me/create-post"
            className="flex items-center gap-2 rounded-full bg-primary  px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Đăng tin
          </Link>
        </div>
      </div>
      <details className="border-t px-5 py-3 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
          <Menu className="size-4" />
          Điều hướng
        </summary>
        <nav
          id="mobile-nav"
          aria-label="Điều hướng trên điện thoại"
          className="grid grid-cols-2 gap-4 border-t px-5 py-5 text-sm lg:hidden"
        >
          {menuItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              aria-current={isMenuActive(to) ? "page" : undefined}
              className={`justify-self-start border-b-2 pb-1 hover:text-primary ${isMenuActive(to) ? "border-primary text-primary" : "border-transparent"}`}
            >
              {label}
            </Link>
          ))}
          {!user && <Link to="/signin">Đăng nhập</Link>}
        </nav>
      </details>
    </header>
  );
};

export default Header;
