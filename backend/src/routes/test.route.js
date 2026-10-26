import express from "express";
const route = express.Router();

route.get("/", (req, res) => {
  return res.send("hello");
});

export default route;
