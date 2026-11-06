import express from "express";
import { fetchLegalDocuments } from "../controllers/legal-document.controller.js";

const route = express.Router();

route.get("/", fetchLegalDocuments);

export default route;
