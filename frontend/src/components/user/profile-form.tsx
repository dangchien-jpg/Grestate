import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/stores/userStore";
import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import AvatarUploader from "@/components/user/avatar-uploader";

type ProfileFormData = {
  fullName: string;
  email: string;
  phoneNumber: string;
  linkZalo: string;
};

type EditableField = {
  key: keyof ProfileFormData;
  label: string;
  type?: string;
};

const PERSONAL_FIELDS: EditableField[] = [
  { key: "fullName", label: "Họ và tên" },
  { key: "email", label: "Email", type: "email" },
  { key: "phoneNumber", label: "Số điện thoại" },
  { key: "linkZalo", label: "Link Zalo" },
];

const ProfileForm = () => {
  const { user } = useAuthStore();
  const { updateProfile } = useUserStore();
  const [formData, setFormData] = useState({
    fullName: user?.hoTen || "",
    email: user?.email || "",
    phoneNumber: user?.soDienThoai || "",
    linkZalo: user?.duongDanZalo || "",
  });

  const isChanged =
    JSON.stringify(formData) !==
    JSON.stringify({
      fullName: user?.hoTen || "",
      email: user?.email || "",
      phoneNumber: user?.soDienThoai || "",
      linkZalo: user?.duongDanZalo || "",
    });

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await updateProfile(
        formData.fullName,
        formData.email,
        formData.phoneNumber,
        formData.linkZalo,
      );
      toast.success("Cập nhật thành công");
    } catch (error) {
      toast.error("Cập nhật không thành công");
      console.error(error);
    }
  };

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8",
      )}
    >
      <fieldset className=" space-y-7 disabled:opacity-70">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Avatar className="size-24">
            {user?.anhDaiDienUrl ? (
              <AvatarImage src={user.anhDaiDienUrl} />
            ) : (
              <AvatarImage src="/user.png" />
            )}
          </Avatar>
          <div className="space-y-2">
            <Label className="text-sm font-bold">Ảnh đại diện</Label>
          </div>
          <AvatarUploader />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {PERSONAL_FIELDS.map(({ key, label, type }) => (
            <div key={key}>
              <Label className="font-bold" htmlFor={key}>
                {label}
              </Label>
              <Input
                id={key}
                type={type || "text"}
                value={formData[key] ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                className="mt-2"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <Button
        onClick={handleSubmit}
        disabled={!isChanged}
        className="h-10 gap-2 px-5 text-sm mt-4"
      >
        <Save />
        Lưu thay đổi
      </Button>
    </div>
  );
};

export default ProfileForm;
