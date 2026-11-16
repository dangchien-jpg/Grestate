import express from "express";
import {
  fetchCensorPosts,
  fetchCensorPostDetail,
  acceptPost,
  rejectPost,
} from "../controllers/admin-censor-post.controller.js";

import {
  fetchDashboardOverview,
  fetchDashboardPostTrend,
  fetchDashboardPostStatuses,
  fetchDashboardTopLocations,
} from "../controllers/admin-dashboard.controller.js";

const route = express.Router();

route.get("/dashboard/overview", fetchDashboardOverview);
route.get("/dashboard/post-trend", fetchDashboardPostTrend);
route.get("/dashboard/post-statuses", fetchDashboardPostStatuses);
route.get("/dashboard/top-locations", fetchDashboardTopLocations);

route.get("/posts", fetchCensorPosts);
route.get("/posts/:maTinDang", fetchCensorPostDetail);

route.put("/accept-post/:maTinDang", acceptPost);
route.put("/reject-post/:maTinDang", rejectPost);

export default route;


