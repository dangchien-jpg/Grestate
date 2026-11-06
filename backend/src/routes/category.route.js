import express from "express";
import { fetchCategories } from "../controllers/category.controller.js";

const route = express.Router();
route.get("/", fetchCategories);

export default route;
