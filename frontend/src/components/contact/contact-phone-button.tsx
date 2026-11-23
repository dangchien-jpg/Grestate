import { useState } from "react";
import { Phone } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import type { TinDangDanhSach } from "@/types/post";

export default function ContactPhoneButton({
  post,
  className = "",
}: {
  post: TinDangDanhSach;
  className?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [revealedContact, setRevealedContact] = useState<{
    postId: number;
    userId: number;
    phone: string;
  } | null>(null);
  const contactPhone =
    post.soDienThoaiLienHe?.trim() || post.nguoiDang.soDienThoai?.trim();
  const phoneVisible = Boolean(
    user &&
    revealedContact?.postId === post.maTinDang &&
    revealedContact.userId === user.maNguoiDung &&
    revealedContact.phone === contactPhone,
  );
  const showPhone = () => {
    if (!user) {
      navigate("/signin", { state: { backgroundLocation: location } });
      return;
    }
    if (contactPhone) {
      setRevealedContact({
        postId: post.maTinDang,
        userId: user.maNguoiDung,
        phone: contactPhone,
      });
    }
  };
  return (
    <Button
      type="button"
      className={`h-10 gap-2 rounded-sm  ${className}`}
      disabled={!contactPhone}
      onClick={showPhone}
      aria-label={
        contactPhone && !phoneVisible ? "Xem số điện thoại liên hệ" : undefined
      }
    >
      <Phone className="size-4" />
      <span aria-live="polite">
        {contactPhone
          ? phoneVisible
            ? contactPhone
            : "**********"
          : "Chưa có số điện thoại"}
      </span>
      {contactPhone && !phoneVisible && (
        <span className="ml-2 underline underline-offset-4">Xem số</span>
      )}
    </Button>
  );
}
