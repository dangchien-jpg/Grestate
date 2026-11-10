import express from "express";
import {
  createPost,
  fetchDetailPost,
  fetchPost,
  fetchPostsByUser,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";
import { uploadPostImages } from "../middlewares/uploadPost.middleware.js";
import {
  requirePostOwner,
  validateCreatePost,
  validateUpdatePost,
} from "../middlewares/post.middleware.js";
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
route.get("/me", protectedRoute, fetchPostsByUser);
route.get("/:maTinDang", fetchDetailPost);
route.put(
  "/:maTinDang",
  protectedRoute,
  requirePostOwner,
  uploadPostImages,
  validateUpdatePost,
  updatePost,
);
route.delete("/:maTinDang", protectedRoute, requirePostOwner, deletePost);
export default route;
