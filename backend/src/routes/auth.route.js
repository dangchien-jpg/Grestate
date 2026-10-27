import express from "express";
import {
  refreshToken,
  signIn,
  signOut,
  signUp,
} from "../controllers/auth.controller.js";
import { signUpValidate } from "../middlewares/auth.middleware.js";

const route = express.Router();

route.post("/signup", signUpValidate, signUp);
route.post("/signin", signIn);
route.post("/signout", signOut);
route.post("/refresh_token", refreshToken);

export default route;
