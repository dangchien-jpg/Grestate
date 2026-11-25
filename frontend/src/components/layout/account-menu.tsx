import { ListCheck, LogOut, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AccountMenu() {
  const { user, signOut } = useAuthStore();
  const navigation = useNavigate();
  if (!user) return null;

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
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Mở menu tài khoản">
        <Avatar>
          <AvatarImage src={user.anhDaiDienUrl || "/user.png"} />
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{user.hoTen}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link to="/me/profile" className="flex gap-2 text-sm">
              <Settings /> Cài đặt tài khoản
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link to="/me/manager-post" className="flex gap-2 text-sm">
              <ListCheck /> Quản lý đăng tin
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="text-destructive text-sm"
            onClick={handleSignout}
          >
            <LogOut /> Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
