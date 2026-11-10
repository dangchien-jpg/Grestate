import express from "express";
import {
  fetchCensorPosts,
  fetchCensorPostDetail,
  acceptPost,
  rejectPost,
} from "../controllers/admin-censor-post.controller.js";

const route = express.Router();

route.get("/posts", fetchCensorPosts);
route.get("/posts/:maTinDang", fetchCensorPostDetail);

route.put("/accept-post/:maTinDang", acceptPost);
route.put("/reject-post/:maTinDang", rejectPost);

export default route;
