import express from "express";
import { fetchMe } from "../controllers/user.controller.js";

const route = express.Router();

route.get("/me", fetchMe);
export default route;
