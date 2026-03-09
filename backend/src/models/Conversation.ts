import mongoose, { Document, Schema, Types } from "mongoose";

export interface IConversation extends Document {
  userId: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: "New Conversation",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "conversations",
  }
);

ConversationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema
);

