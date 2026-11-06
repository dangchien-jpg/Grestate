import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const receiveImages = multer({
  storage: multer.memoryStorage(),
  limits: { files: 6, fileSize: 10 * 1024 * 1024, fieldSize: 1024 * 1024, fields: 40, parts: 46 },
  fileFilter: (_req, file, done) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return done(new Error("Only JPG, PNG and WebP images are supported"));
    }
    done(null, true);
  },
}).array("images", 6);

export const uploadPostImages = (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    return res.status(400).json({ message: "Use multipart/form-data with images and a JSON data field" });
  }
  receiveImages(req, res, (error) => {
    if (error) return res.status(400).json({ message: error.message });
    next();
  });
};

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
