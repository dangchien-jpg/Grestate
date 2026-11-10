import express from "express";
import { reportPost, confirmReportViolation, confirmReportNoViolation, fetchReports, fetchReportDetail } from "../controllers/report.controller.js";

const route = express.Router();

route.get("/", fetchReports);
route.get("/:maBaoCao", fetchReportDetail);
route.post("/post/:maTinDang", reportPost);
route.put("/:maBaoCao/violation", confirmReportViolation);
route.put("/:maBaoCao/no-violation", confirmReportNoViolation);
export default route;
