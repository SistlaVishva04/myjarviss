import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = "7d";

const COOKIE_NAME = "token";

const setAuthCookie = (res: Response, token: string) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
  secure: true,          
  sameSite: "none",    
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

router.post(
  "/register",
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res
          .status(409)
          .json({ error: "This email is already registered" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const user = await User.create({
        email: email.toLowerCase(),
        password: hashed,
      });

      const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      setAuthCookie(res, token);

      return res.status(201).json({
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Register error:", error);
      return res.status(500).json({ error: "Registration failed" });
    }
  }
);

router.post(
  "/login",
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      setAuthCookie(res, token);

      return res.json({
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  }
);

router.post(
  "/logout",
  async (req: Request, res: Response): Promise<Response | void> => {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    return res.json({ success: true });
  }
);

router.get(
  "/session",
  async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      const token = req.cookies?.[COOKIE_NAME];

      if (!token) {
        return res.json({ user: null });
      }

      let decoded: { userId: string };
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      } catch {
        return res.json({ user: null });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.json({ user: null });
      }

      return res.json({
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Session error:", error);
      return res.status(500).json({ error: "Failed to fetch session" });
    }
  }
);

export default router;

