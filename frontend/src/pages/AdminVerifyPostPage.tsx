import { useParams } from "react-router";
import AdminLayout from "@/components/admin/admin-layout";
import VerificationQueue from "@/components/admin/verification/verification-queue";
import VerificationReview from "@/components/admin/verification/verification-review";

export default function AdminVerifyPostPage() {
  const { maYeuCau } = useParams();
  return (
    <AdminLayout
      title={maYeuCau ? "Xét duyệt hồ sơ xác thực" : "Xác thực tin đăng"}
    >
      <div className="min-h-[calc(100dvh-5rem)] bg-slate-50 p-3 sm:p-4 lg:p-4">
        <div className="mx-auto max-w-[1440px]">
          {maYeuCau ? (
            <VerificationReview key={maYeuCau} id={Number(maYeuCau)} />
          ) : (
            <VerificationQueue />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
