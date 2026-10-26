import express from "express";
import dotenv from "dotenv";
import prisma from "./libs/prisma.js";
import route from "./routes/test.route.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use("/api/", route);

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
