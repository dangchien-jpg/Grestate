import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Link, useLocation, useNavigate } from "react-router";
import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicAuthor } from "@/types/post";

function membership(value: string) {
  const start = new Date(value);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    now.getMonth() -
    start.getMonth() -
    Number(now.getDate() < start.getDate());
  if (months >= 12) return `${Math.floor(months / 12)} năm`;
  if (months > 0) return `${months} tháng`;
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return `${Math.max(0, (day(now) - day(start)) / 86400000)} ngày`;
}

export default function AuthorContact({
  author,
  total,
  name = author.hoTen,
  phone = author.soDienThoai,
  showLink = false,
  requireLogin = false,
}: {
  author: PublicAuthor;
  total: number;
  name?: string;
  phone?: string | null;
  showLink?: boolean;
  requireLogin?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.maNguoiDung);
  const needsLogin = requireLogin && !userId;
  const openLogin = () => navigate("/signin", { state: { backgroundLocation: location } });
  const [shown, setShown] = useState<{ phone: string; userId?: number } | null>(null);
  let zaloUrl: string | null = null;
  const zaloLink = author.duongDanZalo?.trim();
  if (zaloLink) {
    try {
      const url = new URL(
        /^https?:\/\//i.test(zaloLink) ? zaloLink : `https://${zaloLink}`,
      );
      if (url.protocol === "https:" || url.protocol === "http:") {
        zaloUrl = url.href;
      }
    } catch {
      zaloUrl = null;
    }
  }

  return (
    <section className="rounded-xl border-3 border-transparent border-t-[12px] [background:linear-gradient(white,white)_padding-box,linear-gradient(to_right,#12B878,var(--primary))_border-box] p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <img
          src={author.anhDaiDienUrl ?? "/user.png"}
          alt={name}
          className="size-16 rounded-full object-cover"
          loading="lazy"
        />
        <div>
          <h2 className="font-bold">{name}</h2>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="text-center">
          <dt>Tham gia</dt>
          <dd className="font-semibold text-lg">
            {membership(author.createdAt)}
          </dd>
        </div>
        <div className="text-center">
          <dt>Tin đăng hiện có</dt>
          <dd className="font-semibold text-lg">{total} tin</dd>
        </div>
      </dl>
      {showLink && (
        <Link
          className="mt-4 block text-center text-sm hover:opacity-90  underline"
          to={`/nguoi-dang/${encodeURIComponent(author.profilePath)}`}
        >
          Xem trang cá nhân
        </Link>
      )}
      <div className="mt-5 space-y-3">
        <Button
          className="w-full h-12 text-sm"
          disabled={!phone}
          onClick={() => {
            if (needsLogin) openLogin();
            else if (phone) setShown({ phone, userId });
          }}
        >
          <Phone className="size-4" />
          {phone
            ? shown?.phone === phone && (!requireLogin || (!needsLogin && shown.userId === userId))
              ? phone
              : "**********　 Xem số"
            : "Chưa có số điện thoại"}
        </Button>
        {zaloUrl && needsLogin ? (
          <Button type="button" variant="outline" className="h-12 w-full gap-2" onClick={openLogin}>
            <MessageCircle className="size-4" />
            Liên hệ qua Zalo
          </Button>
        ) : zaloUrl ? (
          <a
            href={zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-sm border border-primary bg-white px-3 text-sm font-semibold text-primary transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <MessageCircle className="size-4" />
            Liên hệ qua Zalo
          </a>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled
            className="h-11 w-full gap-2 rounded-lg"
          >
            <MessageCircle className="size-4" />
            Chưa có liên kết Zalo
          </Button>
        )}
      </div>
    </section>
  );
}
