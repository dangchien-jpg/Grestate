import express from "express";
import {
  createContactRequest,
  fetchSentContactRequests,
  fetchReceivedContactRequests,
  markContactRequestContacted,
} from "../controllers/contact.controller.js";

const route = express.Router();

route.post("/post/:maTinDang", createContactRequest);
route.get("/sent", fetchSentContactRequests);
route.get("/received", fetchReceivedContactRequests);
route.patch("/:maYeuCau/contacted", markContactRequestContacted);

export default route;
