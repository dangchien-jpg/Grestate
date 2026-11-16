import { useEffect, useRef, useState } from "react";
import { Ban, LoaderCircle, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/authStore";
import {
  adminManagerService,
  managerUserError,
  type ManagedUser,
  type ManagedUserList,
} from "@/services/adminManagerService";

type UserStatus = "HOAT_DONG" | "BI_CHAN";
const tabs: { status: UserStatus; label: string }[] = [
  { status: "HOAT_DONG", label: "Đang hoạt động" },
  { status: "BI_CHAN", label: "Bị chặn" },
];
const formatCount = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

export default function ManagerUserList() {
  const currentUserId = useAuthStore((state) => state.user?.maNguoiDung);
  const [status, setStatus] = useState<UserStatus>("HOAT_DONG");
  const [revision, setRevision] = useState(0);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const lock = useRef(false);
  const [result, setResult] = useState<{
    revision: number;
    lists: Record<UserStatus, ManagedUserList>;
    error: string;
  } | null>(null);
  const current = result?.revision === revision ? result : null;
  const loading = !current;
  const users = current?.lists[status].users ?? [];
  const refresh = () => setRevision((value) => value + 1);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      adminManagerService.activeUsers(controller.signal),
      adminManagerService.blockedUsers(controller.signal),
    ])
      .then(([active, blocked]) => {
        if (!controller.signal.aborted) {
          setResult({
            revision,
            lists: { HOAT_DONG: active, BI_CHAN: blocked },
            error: "",
          });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            revision,
            lists: {
              HOAT_DONG: { users: [], total: 0 },
              BI_CHAN: { users: [], total: 0 },
            },
            error: managerUserError(error),
          });
        }
      });
    return () => controller.abort();
  }, [revision]);

  async function changeStatus(user: ManagedUser) {
    if (lock.current || user.maNguoiDung === currentUserId) return;
    lock.current = true;
    setPendingId(user.maNguoiDung);
    try {
      const response =
        user.trangThai === "HOAT_DONG"
          ? await adminManagerService.block(user.maNguoiDung)
          : await adminManagerService.unblock(user.maNguoiDung);
      toast.success(response.message);
      refresh();
    } catch (error) {
      toast.error(managerUserError(error));
      if (
        isAxiosError(error) &&
        [404, 409].includes(error.response?.status ?? 0)
      )
        refresh();
    } finally {
      lock.current = false;
      setPendingId(null);
    }
  }

  return (
    <section className="m-4 min-w-0 rounded-sm border border-slate-200 bg-white p-4 sm:m-6 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Danh sách người dùng</h2>
        </div>
        <Button
          variant="outline"
          disabled={loading || pendingId !== null}
          onClick={refresh}
        >
          <RefreshCw className={"size-4 " + (loading ? "animate-spin" : "")} />
          Làm mới
        </Button>
      </div>

      <div
        role="tablist"
        aria-label="Trạng thái người dùng"
        className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-200"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.status}
            id={"user-tab-" + tab.status}
            type="button"
            role="tab"
            aria-selected={status === tab.status}
            aria-controls="manager-user-panel"
            tabIndex={status === tab.status ? 0 : -1}
            onClick={() => setStatus(tab.status)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? tabs.length - 1
                    : (index +
                        (event.key === "ArrowRight" ? 1 : -1) +
                        tabs.length) %
                      tabs.length;
              setStatus(tabs[next].status);
              document.getElementById("user-tab-" + tabs[next].status)?.focus();
            }}
            className={
              "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 " +
              (status === tab.status
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-900")
            }
          >
            {tab.label}
            <span
              className={
                "rounded-full px-2 py-0.5 text-xs " +
                (status === tab.status ? "bg-emerald-50" : "bg-slate-100")
              }
            >
              {current && !current.error
                ? formatCount(current.lists[tab.status].total)
                : "…"}
            </span>
          </button>
        ))}
      </div>

      <div
        id="manager-user-panel"
        role="tabpanel"
        aria-labelledby={"user-tab-" + status}
        aria-busy={loading}
      >
        {loading ? (
          <div
            role="status"
            className="flex min-h-60 items-center justify-center gap-2 text-sm text-slate-500"
          >
            <LoaderCircle className="size-5 animate-spin" />
            Đang tải danh sách người dùng...
          </div>
        ) : current.error ? (
          <div
            role="alert"
            className="rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{current.error}</p>
            <Button variant="outline" className="mt-3" onClick={refresh}>
              Thử lại
            </Button>
          </div>
        ) : !users.length ? (
          <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-sm text-slate-500">
            <Users className="size-9 text-slate-300" />
            {status === "HOAT_DONG"
              ? "Không có người dùng đang hoạt động."
              : "Không có người dùng bị chặn."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-3">Người dùng</th>
                  <th className="px-3 py-3">Liên hệ</th>
                  <th className="px-3 py-3">Vai trò</th>
                  <th className="px-3 py-3">Ngày tham gia</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.maNguoiDung === currentUserId;
                  const blocked = user.trangThai === "BI_CHAN";
                  return (
                    <tr
                      key={user.maNguoiDung}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 shrink-0 rounded-full">
                            <AvatarImage
                              src={user.anhDaiDienUrl || "/user.png"}
                              alt={user.hoTen}
                            />
                          </Avatar>
                          <div className="min-w-0">
                            <p
                              className="max-w-56 truncate font-medium"
                              title={user.hoTen}
                            >
                              {user.hoTen}
                              {isSelf && (
                                <span className="ml-1 text-xs text-slate-500">
                                  (Bạn)
                                </span>
                              )}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              #{user.maNguoiDung}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <p>{user.email}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {user.soDienThoai || "Chưa có số điện thoại"}
                        </p>
                      </td>
                      <td className="px-3 py-4">{user.vaiTro.tenVaiTro}</td>
                      <td className="whitespace-nowrap px-3 py-4">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={
                            "inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium " +
                            (blocked
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700")
                          }
                        >
                          {blocked ? "Bị chặn" : "Đang hoạt động"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <Button
                          variant={blocked ? "outline" : "destructive"}
                          disabled={pendingId !== null || isSelf}
                          title={
                            isSelf
                              ? "Không thể tự chặn tài khoản của mình"
                              : undefined
                          }
                          onClick={() => void changeStatus(user)}
                        >
                          {pendingId === user.maNguoiDung ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : blocked ? (
                            <ShieldCheck className="size-4" />
                          ) : (
                            <Ban className="size-4" />
                          )}
                          {blocked ? "Bỏ chặn" : "Chặn"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
