import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function VerificationForm({
  email,
  resendAt,
}: {
  email: string;
  resendAt: number;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now);
  const seconds = Math.max(0, Math.ceil((resendAt - now) / 1000));

  useEffect(() => {
    if (resendAt <= Date.now()) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= resendAt) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  async function resend() {
    if (seconds || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await authService.sendVerificationOTP(email);
      setOtp("");
      toast.success("Đã gửi mã xác thực mới.");
    } catch (error) {
      setMessage(
        (isAxiosError(error) && error.response?.data?.message) ||
          "Gửi mã thất bại.",
      );
      if (!isAxiosError(error) || error.response?.status !== 429) return;
    } finally {
      setBusy(false);
    }
    setNow(Date.now());
    navigate(location.pathname, {
      replace: true,
      state: { ...location.state, resendAt: Date.now() + 30000 },
    });
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await authService.verifyEmail(email, otp);
      toast.success("Email đã xác thực. Bạn có thể đăng nhập.");
      navigate("/signin", {
        replace: true,
        state: { backgroundLocation: location.state?.backgroundLocation },
      });
    } catch (error) {
      setMessage(
        (isAxiosError(error) && error.response?.data?.message) ||
          "Xác thực thất bại.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full rounded-sm max-w-md shadow-sm p-6 md:p-8">
      <h1 className="text-2xl font-bold">Xác thực email</h1>
      <p className="text-sm">
        Nhập mã OTP gồm 6 chữ số gửi đến <strong>{email}</strong>.
      </p>
      <form className="grid gap-4" onSubmit={verify}>
        <div className="flex items-center gap-4">
          <Input
            id="otp"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]{6}"
            required
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            className="h-12 rounded-full text-xl font-bold "
          />

          <Button
            type="button"
            variant="outline"
            disabled={busy || seconds > 0}
            onClick={resend}
            className="h-12 rounded-full text-sm font-medium"
          >
            {seconds ? `Gửi lại OTP sau ${seconds}s` : "Gửi lại OTP"}
          </Button>
        </div>
        <Button
          type="submit"
          disabled={busy || !/^\d{6}$/.test(otp)}
          className="h-12 rounded-full text-sm font-bold"
        >
          Xác thực tài khoản
        </Button>
        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
      </form>
    </Card>
  );
}
