import express from "express";
import { fetchDetailPost, fetchPost } from "../controllers/post.controller.js";

const route = express.Router();
route.get("/", fetchPost);
route.get("/:maTinDang", fetchDetailPost);
export default route;
