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

import {
  fetchActiveUsers,
  fetchBlockedUsers,
  blockUser,
  unblockUser,
} from "../controllers/admin-manager-user.controller.js";

const route = express.Router();

route.get("/dashboard/overview", fetchDashboardOverview);
route.get("/dashboard/post-trend", fetchDashboardPostTrend);
route.get("/dashboard/post-statuses", fetchDashboardPostStatuses);
route.get("/dashboard/top-locations", fetchDashboardTopLocations);

route.get("/posts", fetchCensorPosts);
route.get("/posts/:maTinDang", fetchCensorPostDetail);

route.put("/accept-post/:maTinDang", acceptPost);
route.put("/reject-post/:maTinDang", rejectPost);

route.get("/users/active", fetchActiveUsers);
route.get("/users/blocked", fetchBlockedUsers);
route.put("/users/:maNguoiDung/block", blockUser);
route.put("/users/:maNguoiDung/unblock", unblockUser);

export default route;



