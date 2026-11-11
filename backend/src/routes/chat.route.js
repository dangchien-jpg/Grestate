import express from "express";
import { chat } from "../controllers/chat.controller.js";

const route = express.Router();
route.post("/", chat);

export default route;
