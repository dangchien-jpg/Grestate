import AdminLayout from "@/components/admin/admin-layout";
import PostCensorList from "@/components/admin/post-censor/post-censor-list";

const AdminCensorPage = () => (
  <AdminLayout title="Trang kiểm duyệt tin">
    <PostCensorList />
  </AdminLayout>
);

export default AdminCensorPage;
