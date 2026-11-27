import AdminLayout from "@/components/admin/admin-layout";
import PostCensorList from "@/components/admin/post-censor/post-censor-list";

const AdminCensorPage = () => (
  <AdminLayout title="Trang kiểm duyệt tin">
    <div className="min-h-[calc(100dvh-5rem)] bg-slate-50 p-3 sm:p-4">
        <div className="mx-auto max-w-[1440px]"><PostCensorList /></div>
      </div>
  </AdminLayout>
);

export default AdminCensorPage;
