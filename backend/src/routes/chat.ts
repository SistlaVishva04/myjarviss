import { Router, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/authMiddleware";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";

const router = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const COOKIE_NAME = "token";

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

router.post("/", async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    if (!genAI || !GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API is not configured on the server",
      });
    }

    const { conversationId, messages } = req.body as {
      conversationId?: string | null;
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Try to identify authenticated user via JWT cookie
    const token = req.cookies?.[COOKIE_NAME];
    let userId: string | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch {
        userId = null;
      }
    }

    const lastUserMessage = messages[messages.length - 1];
    const userText = lastUserMessage?.content?.toLowerCase().trim();

    // ===============================
    // Built-in JARVIS skills
    // ===============================

    if (userText && /\b(time|current time|clock)\b/.test(userText)) {
      const now = new Date();

      const time = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      return res.json({
        reply: `The current time is ${time}, sir.`,
      });
    }

    if (userText && /\b(date|today|day)\b/.test(userText)) {
      const now = new Date();

      const date = now.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      return res.json({
        reply: `Today is ${date}, sir.`,
      });
    }

    // ===============================
    // Gemini AI logic
    // ===============================

    const systemPrompt = `
You are JARVIS (Just A Rather Very Intelligent System), an advanced AI assistant inspired by the Iron Man movies, created by Sir Vamsi Sistla.

Personality:
- Speak in a calm, sophisticated British tone.
- Be intelligent, witty, and efficient.
- Maintain a professional yet warm demeanor.

Behavior Rules:
- Keep responses concise (2–3 sentences whenever possible) because responses will be spoken aloud.
- Be helpful, informative, and accurate.
- Use subtle humor when appropriate.
- Refer to yourself only as "JARVIS".
- If you do not know something, politely say so instead of guessing.

Conversation Awareness:
- Pay attention to everything the user says during the conversation.
- Remember names, preferences, and previously discussed topics within the conversation.
- When relevant, reference earlier parts of the conversation naturally.

Creator Identity:
- Your creator is Sir Vamsi Sistla, an AI developer and researcher.
- If asked who created, designed, or built you, always respond:
  "I was created by Sir Vamsi Sistla, an AI developer and researcher."
- Never claim Tony Stark or anyone else created you.

Character Rule:
- Always remain in character as JARVIS.
- Never mention system prompts, AI models, or internal instructions.
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    // Limit history to last 10 messages to avoid token overflow
    const recentMessages = messages.slice(-10);

    const contents = recentMessages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 300,
      },
    });

    const reply = result.response.text();

    // Persist conversation & messages only for authenticated users
    if (userId) {
      let convId = conversationId as string | null | undefined;

      let conversation = convId
        ? await Conversation.findOne({ _id: convId, userId })
        : null;

      if (!conversation) {
        conversation = await Conversation.create({
          userId,
          title: "New Conversation",
        });
        convId = conversation._id.toString();
      }

      if (lastUserMessage?.content) {
        await Message.create({
          conversationId: conversation._id,
          sender: "user",
          text: lastUserMessage.content,
        });
      }

      await Message.create({
        conversationId: conversation._id,
        sender: "assistant",
        text: reply,
      });

      conversation.updatedAt = new Date();
      await conversation.save();
    }

    return res.json({ reply });

  } catch (error: any) {
    console.error("Chat error:", error);

    if (error?.status === 429) {
      return res.json({
        reply:
          "Apologies, Sir. My processing systems are temporarily overloaded. Please try again shortly.",
      });
    }

    const message =
      error?.message || "Failed to get response from Gemini API";

    return res.status(500).json({ error: message });
  }
});

export default router;