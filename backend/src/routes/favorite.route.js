import express from "express";
import {
  addFavoritePost,
  fetchAllFavoritePosts,
  removeFavoritePost,
} from "../controllers/favorite.controller.js";

const route = express.Router();

route.get("/", fetchAllFavoritePosts);
route.post("/post/:maTinDang", addFavoritePost);
route.delete("/post/:maTinDang", removeFavoritePost);
export default route;
