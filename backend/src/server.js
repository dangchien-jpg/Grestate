import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import prisma from "./libs/prisma.js";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import legalDocumentRoute from "./routes/legal-document.route.js";
import categoryRoute from "./routes/category.route.js";
import locationRoute from "./routes/location.route.js";
import valuationRoute from "./routes/valuation.route.js";
import favoriteRoute from "./routes/favorite.route.js";
import adminRoute from "./routes/admin.route.js";
import reportRoute from "./routes/report.route.js";
import chatRoute from "./routes/chat.route.js";
import generateContentRoute from "./routes/generate-content.route.js";

import { protectedRoute } from "./middlewares/auth.middleware.js";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL?.trim(), credentials: true }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// public route
app.use("/api/auth/", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/chat", chatRoute);
// private route
app.use(protectedRoute);
app.use("/api/generate-content", generateContentRoute);
app.use("/api/valuation", valuationRoute);
app.use("/api/users", userRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/legal-documents", legalDocumentRoute);
app.use("/api/provinces", locationRoute);
app.use("/api/favorites", favoriteRoute);
app.use("/api/admin", adminRoute);
app.use("/api/report", reportRoute);

async function startServer() {
  try {
    await prisma.$connect();

    await prisma.$queryRaw`SELECT 1`;
    console.log("MySQL connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MySQL connection failed!");
    console.error(error);

    process.exit(1);
  }
}
startServer();
