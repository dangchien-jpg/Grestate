import express from "express";
import {
  fetchAllNotifications,
  markNotificationRead,
} from "../controllers/notification.controller.js";

const route = express.Router();

route.get("/", fetchAllNotifications);

route.patch("/:id/read", markNotificationRead);
export default route;
