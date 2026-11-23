import multer from "multer";
import { uploadPostFromBuffer } from "./uploadPost.middleware.js";
import { v2 as cloudinary } from "cloudinary";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];
const receive = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 8,
    fileSize: 20 * 1024 * 1024,
    fields: 2,
    fieldSize: 8192,
    parts: 11,
  },
  fileFilter: (_req, file, done) => {
    const allowed =
      imageTypes.includes(file.mimetype) ||
      (file.fieldname === "batDongSan" && videoTypes.includes(file.mimetype));
    done(
      allowed ? null : new Error("Định dạng minh chứng không hợp lệ"),
      allowed,
    );
  },
}).fields([
  { name: "hoSoPhapLy", maxCount: 6 },
  { name: "batDongSan", maxCount: 6 },
]);

export const receiveVerificationFiles = (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    return res
      .status(400)
      .json({ message: "Vui lòng gửi minh chứng bằng multipart/form-data" });
  }
  receive(req, res, (error) => {
    if (error) {
      return res
        .status(400)
        .json({
          message:
            error instanceof multer.MulterError
              ? "Tệp hoặc trường không hợp lệ. Tối đa 8 tệp, 6 tệp mỗi nhóm và 20 MB mỗi tệp"
              : "Hồ sơ pháp lý nhận JPG, PNG, WebP; ảnh/video thực tế nhận thêm MP4, WebM, MOV",
        });
    }
    next();
  });
};

export const uploadVerificationFile = (file, folder) => {
  const video = videoTypes.includes(file.mimetype);
  return uploadPostFromBuffer(file.buffer, {
    folder,
    type: "authenticated",
    resource_type: video ? "video" : "image",
    allowed_formats: video
      ? ["mp4", "webm", "mov"]
      : ["jpg", "jpeg", "png", "webp"],
  });
};

export const removeVerificationFiles = async (files) => {
  for (const file of files) {
    try {
      const result = await cloudinary.uploader.destroy(file.public_id, {
        resource_type: file.resource_type,
        type: "authenticated",
      });
      if (!["ok", "not found"].includes(result.result))
        console.error("Không thể dọn tệp xác thực", file.public_id);
    } catch (error) {
      console.error(
        "Không thể dọn tệp xác thực",
        file.public_id,
        error.message,
      );
    }
  }
};
