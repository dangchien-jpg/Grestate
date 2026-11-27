import PostReportList from "@/components/admin/post-report/post-report-list";
import AdminLayout from "@/components/admin/admin-layout";

const AdminReportPage = () => {
  return (
    <AdminLayout title="Trang danh sách tin đăng bị báo cáo">
      <div className="min-h-[calc(100dvh-5rem)] bg-slate-50 p-3 sm:p-4">
        <div className="mx-auto max-w-[1440px]"><PostReportList /></div>
      </div>
    </AdminLayout>
  );
};

export default AdminReportPage;
