import mongoose, { Document, Schema, Types } from "mongoose";

export type SenderType = "user" | "assistant";

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  sender: SenderType;
  text: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "messages",
  }
);

export const Message = mongoose.model<IMessage>("Message", MessageSchema);

