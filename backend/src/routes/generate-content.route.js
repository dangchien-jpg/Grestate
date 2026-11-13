import express from "express";
import { generateContent } from "../controllers/generate-content.controller.js";

const route = express.Router();
route.post("/", generateContent);
export default route;
