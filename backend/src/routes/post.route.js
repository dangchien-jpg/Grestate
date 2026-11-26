import {
  filterPrice,
  filterArea,
  filterPostByCategory,
  filterPostByLocation,
} from "../controllers/filter.controller.js";
import {
  searchPost,
  suggestSearchPost,
} from "../controllers/search.controller.js";
import express from "express";
import {
  createPost,
  fetchDetailPost,
  fetchPost,
  fetchPostsByUser,
  updatePost,
  deletePost,
  hidePost,
  unHidePost,
  fetchPostsByUserPublic,
} from "../controllers/post.controller.js";
import {
  uploadPostImages,
  uploadPostMedia,
} from "../middlewares/uploadPost.middleware.js";
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
  uploadPostMedia,
  validateCreatePost,
  createPost,
);
route.get("/", fetchPost);
route.get("/me", protectedRoute, fetchPostsByUser);
route.get("/user/:profilePath", fetchPostsByUserPublic);
route.get("/search", searchPost);
route.get("/suggestions", suggestSearchPost);
route.get("/filter/price", filterPrice);
route.get("/filter/area", filterArea);
route.get("/filter/category", filterPostByCategory);
route.get("/filter/location", filterPostByLocation);
route.get("/:maTinDang", fetchDetailPost);
route.put(
  "/:maTinDang",
  protectedRoute,
  requirePostOwner,
  uploadPostImages,
  validateUpdatePost,
  updatePost,
);
route.patch("/:maTinDang/hide", protectedRoute, hidePost);
route.patch("/:maTinDang/unhide", protectedRoute, unHidePost);
route.delete("/:maTinDang", protectedRoute, requirePostOwner, deletePost);
export default route;
