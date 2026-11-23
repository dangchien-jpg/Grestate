import express from "express";
import { listPendingVerifications, getPendingVerification, submitVerification, acceptVerification, rejectVerification } from "../controllers/verify-post.controller.js";
import { receiveVerificationFiles } from "../middlewares/uploadVerifyPost.middleware.js";

const route = express.Router();
route.get("/pending", listPendingVerifications);
route.get("/pending/:maYeuCau", getPendingVerification);
route.post("/:maTinDang", receiveVerificationFiles, submitVerification);
route.put("/:maYeuCau/accept", acceptVerification);
route.put("/:maYeuCau/reject", rejectVerification);
export default route;
