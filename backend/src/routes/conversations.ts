import { Router, Response } from "express";
import { Types } from "mongoose";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";

const router = Router();
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MESSAGE_PAGE_SIZE = 50;
const MAX_MESSAGE_PAGE_SIZE = 100;

const getPositiveInteger = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
};

router.use(authMiddleware);

router.get(
  "/",
  async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const page = getPositiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
      const limit = getPositiveInteger(req.query.limit, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
      const filter = { userId: new Types.ObjectId(req.userId) };
      const [conversations, total] = await Promise.all([
        Conversation.find(filter)
          .sort({ updatedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit + 1),
        Conversation.countDocuments(filter),
      ]);
      const hasMore = conversations.length > limit;
      const pageConversations = conversations.slice(0, limit);
      const ids = pageConversations.map((conversation) => conversation._id);
      const counts = ids.length
        ? await Message.aggregate<{ _id: Types.ObjectId; count: number }>([
            { $match: { conversationId: { $in: ids } } },
            { $group: { _id: "$conversationId", count: { $sum: 1 } } },
          ])
        : [];
      const messageCounts = new Map(
        counts.map((entry) => [entry._id.toString(), entry.count]),
      );

      return res.json({
        conversations: pageConversations.map((conversation) => ({
          id: conversation._id.toString(),
          title: conversation.title,
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
          messageCount: messageCounts.get(conversation._id.toString()) ?? 0,
        })),
        page,
        limit,
        total,
        hasMore,
      });
    } catch (error) {
      console.error("Get conversations error:", error);
      return res.status(500).json({ error: "Failed to load conversations" });
    }
  },
);

router.get(
  "/:id/messages",
  async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const conversation = await Conversation.findOne({
        _id: req.params.id,
        userId: req.userId,
      }).select("_id");
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const page = getPositiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
      const limit = getPositiveInteger(
        req.query.limit,
        MESSAGE_PAGE_SIZE,
        MAX_MESSAGE_PAGE_SIZE,
      );
      const messages = await Message.find({ conversationId: conversation._id })
        .sort({ timestamp: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit + 1);
      const hasMore = messages.length > limit;
      const pageMessages = messages.slice(0, limit).reverse();

      return res.json({
        messages: pageMessages.map((message) => ({
          id: message._id.toString(),
          sender: message.sender,
          text: message.text,
          timestamp: message.timestamp.toISOString(),
        })),
        page,
        limit,
        hasMore,
      });
    } catch (error) {
      console.error("Get conversation messages error:", error);
      return res.status(500).json({ error: "Failed to load conversation messages" });
    }
  },
);

router.post(
  "/",
  async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const title =
        typeof req.body.title === "string" && req.body.title.trim()
          ? req.body.title.trim().slice(0, 100)
          : "New Conversation";
      const conversation = await Conversation.create({
        userId: req.userId,
        title,
      });

      return res.status(201).json({
        id: conversation._id.toString(),
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      });
    } catch (error) {
      console.error("Create conversation error:", error);
      return res.status(500).json({ error: "Failed to create conversation" });
    }
  },
);

router.delete(
  "/:id",
  async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const conversation = await Conversation.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      await Message.deleteMany({ conversationId: conversation._id });
      await conversation.deleteOne();

      return res.json({ success: true });
    } catch (error) {
      console.error("Delete conversation error:", error);
      return res.status(500).json({ error: "Failed to delete conversation" });
    }
  },
);

export default router;
