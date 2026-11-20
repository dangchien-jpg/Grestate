import { Navigate, useLocation } from "react-router";
import VerificationForm from "@/components/auth/verification-form";

export default function VerifyEmailPage() {
  const { state } = useLocation();
  if (!state?.email) return <Navigate to="/signin" replace />;
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <VerificationForm email={state.email} resendAt={state.resendAt ?? 0} />
    </main>
  );
}
