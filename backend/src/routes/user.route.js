import express from "express";
import {
  fetchMe,
  updateProfile,
  uploadAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/uploadAvatar.middleware.js";

const route = express.Router();

route.get("/me", fetchMe);
route.put("/me", updateProfile);
route.post("/me/upload_avatar", upload.single("file"), uploadAvatar);
export default route;
