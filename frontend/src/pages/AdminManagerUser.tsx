import AdminLayout from "@/components/admin/admin-layout";
import ManagerUserList from "@/components/admin/manager-user/manager-user-list";

const AdminManagerUser = () => (
  <AdminLayout title="Quản lý người dùng">
    <ManagerUserList />
  </AdminLayout>
);

export default AdminManagerUser;

