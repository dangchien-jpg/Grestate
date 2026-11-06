import express from "express";
import {
  createPost,
  fetchDetailPost,
  fetchPost,
} from "../controllers/post.controller.js";
import { uploadPostImages } from "../middlewares/uploadPost.middleware.js";
import { validateCreatePost } from "../middlewares/post.middleware.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const route = express.Router();
route.post(
  "/",
  protectedRoute,
  uploadPostImages,
  validateCreatePost,
  createPost,
);
route.get("/", fetchPost);
route.get("/:maTinDang", fetchDetailPost);
export default route;
