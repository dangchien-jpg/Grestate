import {
  Bell,
  Heart,
  ListCheck,
  LogOut,
  Menu,
  Settings,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useFavorites } from "@/hooks/use-favorites";
import { toast } from "sonner";

const Header = () => {
  useFavorites();
  const { user, signOut } = useAuthStore();
  const savedCount = useFavoriteStore((state) => state.posts.length);
  const favoriteCount = user ? savedCount : 0;
  const navigation = useNavigate();

  const handleSignout = async () => {
    try {
      await signOut();
      navigation("/");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi đăng xuất");
    }
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
          <a
            href="/"
            aria-current="page"
            className="border-b-2 border-primary py-7 text-primary"
          >
            Trang chủ
          </a>
          <a href="#projects" className="hover:text-primary">
            Dự án
          </a>
          <a href="/predict" className="hover:text-primary">
            Định giá AI
          </a>
          <a href="#news" className="hover:text-primary">
            Tin tức
          </a>
          <a href="#contact" className="hover:text-primary">
            Liên hệ
          </a>
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
                className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-md bg-red-600 px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-white"
              >
                {favoriteCount}
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Thông báo"
            className="hidden rounded-full sm:inline-flex"
          >
            <Bell className="size-6" />
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Mở menu tài khoản">
                <Avatar>
                  <AvatarImage src={user.anhDaiDienUrl || "/user.png"} />
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
                  <DropdownMenuItem>
                    <Link to="/me/manager-post" className="flex gap-2">
                      <ListCheck /> Quản lý đăng tin
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
          ) : (
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 rounded-full border border-[#ccc] px-3 py-2 text-xs font-semibold"
            >
              <UserRound className="size-4" />
              Đăng nhập
            </Link>
          )}

          <Link
            to="/me/create-post"
            className="rounded-full bg-primary  px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
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
          {[
            ["Trang chủ", "#"],
            ["Tìm bất động sản", "#search"],
            ["Dự án", "#projects"],
            ["Định giá AI", "#valuation"],
            ["Tin tức", "#news"],
            ["Liên hệ", "#contact"],
          ].map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
          {!user && <Link to="/signin">Đăng nhập</Link>}
        </nav>
      </details>
    </header>
  );
};

export default Header;
