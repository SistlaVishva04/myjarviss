import { Router, Response } from "express";
import { Types } from "mongoose";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userObjectId = new Types.ObjectId(req.userId);

      const conversations = await Conversation.find({
        userId: userObjectId,
      }).sort({ updatedAt: -1 });

      const conversationIds = conversations.map((c) => c._id);

      const messages = await Message.find({
        conversationId: { $in: conversationIds },
      }).sort({ timestamp: 1 });

      const messagesByConv = new Map<string, typeof messages>();
      for (const msg of messages) {
        const key = msg.conversationId.toString();
        if (!messagesByConv.has(key)) {
          messagesByConv.set(key, []);
        }
        messagesByConv.get(key)!.push(msg);
      }

      const result = conversations.map((conv) => {
        const convMessages = messagesByConv.get(conv._id.toString()) || [];
        return {
          id: conv._id.toString(),
          title: conv.title,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
          messages: convMessages.map((m) => ({
            id: m._id.toString(),
            sender: m.sender,
            text: m.text,
            timestamp: m.timestamp.toISOString(),
          })),
        };
      });

      return res.json({ conversations: result });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Get conversations error:", error);
      return res.status(500).json({ error: "Failed to load conversations" });
    }
  }
);

router.post(
  "/",
  async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { title } = req.body;

      const conversation = await Conversation.create({
        userId: req.userId,
        title: title || "New Conversation",
      });

      return res.status(201).json({
        id: conversation._id.toString(),
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Create conversation error:", error);
      return res.status(500).json({ error: "Failed to create conversation" });
    }
  }
);

router.delete(
  "/:id",
  async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;

      const conversation = await Conversation.findOne({
        _id: id,
        userId: req.userId,
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      await Message.deleteMany({ conversationId: conversation._id });
      await conversation.deleteOne();

      return res.json({ success: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Delete conversation error:", error);
      return res.status(500).json({ error: "Failed to delete conversation" });
    }
  }
);

export default router;

