import { Link } from "react-router";
import { ShieldBan, ArrowLeft, LogIn } from "lucide-react";

const DisabledAccount = () => (
  <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10">
    <section
      aria-labelledby="disabled-account-title"
      className="w-full max-w-lg rounded-sm border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10"
    >
      <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-red-50 text-red-600">
        <ShieldBan className="size-10" aria-hidden="true" />
      </div>
      <h1
        id="disabled-account-title"
        className="text-2xl font-bold text-slate-900"
      >
        Tài khoản đã bị vô hiệu hóa
      </h1>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        Tài khoản của bạn hiện đã bị vô hiệu hóa và không thể đăng nhập. Vui
        lòng liên hệ quản trị viên để được hỗ trợ kiểm tra và mở lại tài khoản.
      </p>
      <Link
        to="/contact"
        className="mt-6 inline-flex min-h-10 items-center justify-center rounded-sm bg-primary px-5 text-sm font-medium text-white"
      >
        Liên hệ hỗ trợ
      </Link>
      <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-600 ">
          <ArrowLeft className="size-4" />
          Về trang chủ
        </Link>
        <Link
          to="/signin"
          replace
          className="inline-flex items-center gap-2 text-slate-600 "
        >
          <LogIn className="size-4" />
          Đăng nhập tài khoản khác
        </Link>
      </div>
    </section>
  </main>
);

export default DisabledAccount;
