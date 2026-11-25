import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const postUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 7, fileSize: 10 * 1024 * 1024, fieldSize: 1024 * 1024, fields: 40, parts: 48 },
  fileFilter: (_req, file, done) => {
    if (file.fieldname === "video") {
      if (!["video/mp4", "video/webm"].includes(file.mimetype)) {
        return done(Object.assign(new Error("Video phải là MP4 hoặc WebM"), { code: "INVALID_VIDEO_TYPE" }));
      }
      return done(null, true);
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return done(Object.assign(new Error("Chỉ hỗ trợ hình ảnh JPG, PNG và WebP"), { code: "INVALID_IMAGE_TYPE" }));
    }
    done(null, true);
  },
});
const receiveImages = postUpload.array("images", 6);
const receiveMedia = postUpload.fields([{ name: "images", maxCount: 6 }, { name: "video", maxCount: 1 }]);

const handlePostUpload = (receive, withVideo) => (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    return res.status(400).json({ message: "Vui lòng gửi multipart/form-data với trường data chứa JSON và trường images chứa hình ảnh" });
  }
  receive(req, res, (error) => {
    if (error) {
      const messages = {
        INVALID_VIDEO_TYPE: "Video phải là MP4 hoặc WebM",
        INVALID_IMAGE_TYPE: "Chỉ hỗ trợ hình ảnh JPG, PNG và WebP",
        LIMIT_FILE_SIZE: "Mỗi tệp không được vượt quá 10 MB",
        LIMIT_FILE_COUNT: withVideo ? "Tối đa 6 ảnh và 1 video" : "Tối đa 6 ảnh",
        LIMIT_UNEXPECTED_FILE: withVideo ? "Chỉ nhận tối đa 6 ảnh và 1 video" : "Chỉ nhận tối đa 6 ảnh",
        LIMIT_FIELD_VALUE: "Nội dung của một trường dữ liệu vượt quá giới hạn 1 MB",
        LIMIT_FIELD_COUNT: "Số trường dữ liệu vượt quá giới hạn cho phép",
        LIMIT_PART_COUNT: "Tổng số trường dữ liệu và tệp tải lên vượt quá giới hạn cho phép",
        LIMIT_FIELD_KEY: "Tên trường dữ liệu quá dài",
      };
      return res.status(400).json({ message: messages[error.code] ?? "Dữ liệu hoặc hình ảnh tải lên không hợp lệ" });
    }
    if (withVideo) {
      req.postVideo = req.files?.video?.[0];
      req.files = req.files?.images ?? [];
      if (req.postVideo && !req.postVideo.size) {
        return res.status(400).json({ message: "Tệp video bị trống" });
      }
    }
    next();
  });
};

export const uploadPostImages = handlePostUpload(receiveImages, false);
export const uploadPostMedia = handlePostUpload(receiveMedia, true);

export const uploadPostFromBuffer = (buffer, options) => new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream({
    folder: "Grestate/post",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    ...options,
  }, (error, result) => {
    if (error) reject(error);
    else resolve(result);
  });
  uploadStream.end(buffer);
});
