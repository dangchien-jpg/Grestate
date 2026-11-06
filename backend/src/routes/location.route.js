import express from "express";
import {
  fetchProvinces,
  fetchWardsByProvinces,
} from "../controllers/location.controller.js";

const route = express.Router();

route.get("/", fetchProvinces);
route.get("/:maTinhThanh/wards", fetchWardsByProvinces);

export default route;
