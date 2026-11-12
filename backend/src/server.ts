import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import conversationsRoutes from "./routes/conversations";
import chatRoutes from "./routes/chat";
import { getAllowedOrigins } from "./lib/cors";
import { requireEnv } from "./config/env";

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = requireEnv("MONGODB_URI");
const allowedOrigins = getAllowedOrigins(process.env.CLIENT_ORIGIN);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  return res
    .status(databaseConnected ? 200 : 503)
    .json({ status: databaseConnected ? "ok" : "unavailable" });
});

const start = async () => {
  await connectDB(MONGODB_URI);

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

void start();
