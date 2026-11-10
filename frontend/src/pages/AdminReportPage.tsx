import PostReportList from "@/components/admin/post-report/post-report-list";
import AdminLayout from "@/components/admin/admin-layout";

const AdminReportPage = () => {
  return (
    <AdminLayout title="Trang danh sách tin đăng bị báo cáo">
      <PostReportList />
    </AdminLayout>
  );
};

export default AdminReportPage;
