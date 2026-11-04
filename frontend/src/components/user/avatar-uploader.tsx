import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/userStore";
import { Camera } from "lucide-react";
import { useRef } from "react";

const AvatarUploader = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar } = useUserStore();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await uploadAvatar(formData);
  };
  return (
    <>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleClick}
        className="absolute cursor-pointer -bottom-2 left-12 size-9 rounded-full shadow-md hover:scale-115 transition duration-300 hover:bg-background"
      >
        <Camera className="size-4" />
      </Button>
      <input type="file" hidden ref={fileInputRef} onChange={handleUpload} />
    </>
  );
};

export default AvatarUploader;
