import express from "express";
import {
  refreshToken,
  sendVerificationOTP,
  signIn,
  signOut,
  signUp,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { signUpValidate } from "../middlewares/auth.middleware.js";

const route = express.Router();

route.post("/signup", signUpValidate, signUp);
route.post("/signin", signIn);
route.post("/signout", signOut);
route.post("/refresh_token", refreshToken);
route.post("/send-verification-otp", sendVerificationOTP);
route.post("/verify-email", verifyEmail);

export default route;
