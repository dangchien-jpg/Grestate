import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { X } from "lucide-react";
import Backdrop from "@/components/backdrop/backdrop";
import { SigninForm } from "./signin-form";
import { SignupForm } from "./signup-form";

export default function AuthDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const signup = location.pathname === "/signup";
  const close = () => navigate("/", { replace: true });

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-label={signup ? "Đăng ký tài khoản" : "Đăng nhập"}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto border-0 bg-transparent p-0 text-foreground backdrop:bg-transparent"
    >
      <Backdrop onClick={close} aria-hidden="true" />
      <div className="pointer-events-none relative z-[60] flex min-h-full items-center justify-center px-4 py-8">
        <div className="pointer-events-auto relative w-full max-w-3xl">
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="absolute right-2 top-2 z-10 rounded-full bg-background p-2 shadow-sm hover:bg-muted"
          >
            <X className="size-5" />
          </button>
          {signup ? <SignupForm key="signup" /> : <SigninForm key="signin" />}
        </div>
      </div>
    </dialog>
  );
}
