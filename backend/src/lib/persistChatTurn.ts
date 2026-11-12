export interface PersistedConversation {
  _id: { toString: () => string };
  title: string;
  updatedAt: Date;
  save: () => Promise<unknown>;
}

export interface ChatTurnRepositories<T extends PersistedConversation> {
  findConversation: (id: string, userId: string) => Promise<T | null>;
  createConversation: (userId: string, title: string) => Promise<T>;
  createMessage: (input: {
    conversationId: T["_id"];
    sender: "user" | "assistant";
    text: string;
  }) => Promise<unknown>;
}

export const generateConversationTitle = (text: string) => {
  const title = text.trim();
  return title.length > 40 ? `${title.substring(0, 40)}...` : title || "New Conversation";
};

export async function persistChatTurn<T extends PersistedConversation>(
  userId: string | null,
  conversationId: string | null | undefined,
  userText: string,
  reply: string,
  repositories: ChatTurnRepositories<T>,
) {
  if (!userId) return null;

  let conversation = conversationId
    ? await repositories.findConversation(conversationId, userId)
    : null;

  if (!conversation) {
    conversation = await repositories.createConversation(
      userId,
      generateConversationTitle(userText),
    );
  } else if (conversation.title === "New Conversation") {
    conversation.title = generateConversationTitle(userText);
  }

  await Promise.all([
    repositories.createMessage({
      conversationId: conversation._id,
      sender: "user",
      text: userText,
    }),
    repositories.createMessage({
      conversationId: conversation._id,
      sender: "assistant",
      text: reply,
    }),
  ]);
  conversation.updatedAt = new Date();
  await conversation.save();

  return {
    conversationId: conversation._id.toString(),
    title: conversation.title,
  };
}
