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
import { toast } from "sonner";

const Header = () => {
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
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <div>
          <img
            src="/Grestate_Logo_Vector.svg"
            alt="Grestate Logo"
            className="w-44 h-auto"
          />
        </div>
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
          <a href="#valuation" className="hover:text-primary">
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
          <Button
            variant="ghost"
            size="icon"
            aria-label="L?u tin"
            className="relative rounded-full"
          >
            <Heart />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Thông báo"
            className="hidden rounded-full sm:inline-flex"
          >
            <Bell />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              {user ? (
                <Avatar>
                  {user.anhDaiDienUrl ? (
                    <AvatarImage src={user.anhDaiDienUrl} />
                  ) : (
                    <AvatarImage src="/user.png" />
                  )}
                </Avatar>
              ) : (
                <Link
                  to="/signin"
                  className="hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold sm:inline-flex"
                >
                  <UserRound className="size-4" />
                  Đăng nhập
                </Link>
              )}
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
                  <Link to="" className="flex gap-2">
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

          <Link
            to="/signin"
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
          <Link to="/signin">Đăng nhập</Link>
        </nav>
      </details>
    </header>
  );
};

export default Header;
