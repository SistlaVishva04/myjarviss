import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth";
import conversationsRoutes from "./routes/conversations";
import chatRoutes from "./routes/chat";

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/jarvis";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  process.env.CLIENT_ORIGIN
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
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
  res.json({ status: "ok" });
});

const start = async () => {
  await connectDB(MONGODB_URI);

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

void start();

