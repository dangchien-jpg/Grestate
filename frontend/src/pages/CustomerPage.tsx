import { useCallback, useEffect, useRef, useState } from "react";
import AccountMenu from "@/components/layout/account-menu";
import { UserNavigation } from "@/components/layout/user-sidebar";
import ContactInbox from "@/components/customer/contact-inbox";
import { useAuthStore } from "@/stores/authStore";
import {
  contactError,
  fetchReceivedContactRequests,
  markContactRequestContacted,
  type ListedContact,
} from "@/services/contactService";

function CustomerWorkspace({ name }: { name: string }) {
  const [items, setItems] = useState<ListedContact[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++revision.current;
    try {
      const { requests } = await fetchReceivedContactRequests();
      if (version === revision.current) {
        setItems(requests);
        setError("");
      }
    } catch (err) {
      if (version === revision.current) setError(contactError(err));
    }
  }, []);
  useEffect(() => {
    const update = () => {
      if (!document.hidden) void refresh();
    };
    update();
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, [refresh]);

  async function mark(id: number) {
    setBusy(id);
    setError("");
    try {
      await markContactRequestContacted(id);
      revision.current++;
      setItems(
        (current) =>
          current?.map((row) =>
            row.maYeuCau === id ? { ...row, trangThai: "DA_LIEN_HE" } : row,
          ) ?? null,
      );
    } catch (err) {
      setError(contactError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#dedede] md:flex-row">
      <UserNavigation
        pending={items?.filter((row) => row.trangThai === "CHO_LIEN_HE").length}
      />
      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b bg-card px-4 py-4 sm:px-8">
          <p className="text-sm font-medium">
            <span className="text-muted-foreground">Trang quản lý / </span>Khách
            hàng
          </p>
          <div className="flex min-w-0 items-center gap-2 pl-3">
            <span
              className="max-w-32 truncate text-sm font-medium sm:max-w-64"
              title={name}
            >
              {name}
            </span>
            <AccountMenu />
          </div>
        </header>
        <section className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-8 sm:py-8">
          <ContactInbox
            items={items}
            error={error}
            busy={busy}
            refresh={refresh}
            mark={mark}
          />
        </section>
      </main>
    </div>
  );
}

export default function CustomerPage() {
  const user = useAuthStore((state) => state.user);
  return user ? (
    <CustomerWorkspace key={user.maNguoiDung} name={user.hoTen} />
  ) : null;
}
