export interface ChatStreamComplete {
  reply: string;
  conversationId?: string;
}

export async function readChatStream(
  response: Response,
  onDelta: (text: string) => void,
): Promise<ChatStreamComplete> {
  if (!response.body) {
    throw new Error("The server did not provide a response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";
  let complete: ChatStreamComplete | null = null;

  const processEvent = (rawEvent: string) => {
    let data = "";
    eventName = "message";

    for (const line of rawEvent.split("\n")) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data += `${data ? "\n" : ""}${line.slice(5).trimStart()}`;
      }
    }

    if (!data) return;
    const payload = JSON.parse(data) as {
      text?: string;
      reply?: string;
      conversationId?: string;
      error?: string;
    };

    if (eventName === "delta" && payload.text) {
      onDelta(payload.text);
    } else if (eventName === "complete") {
      if (typeof payload.reply !== "string") {
        throw new Error("The server returned an invalid completion event.");
      }
      complete = {
        reply: payload.reply,
        conversationId: payload.conversationId,
      };
    } else if (eventName === "error") {
      throw new Error(payload.error || "The response stream failed.");
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");

      let eventEnd = buffer.indexOf("\n\n");
      while (eventEnd !== -1) {
        processEvent(buffer.slice(0, eventEnd));
        buffer = buffer.slice(eventEnd + 2);
        eventEnd = buffer.indexOf("\n\n");
      }

      if (done) break;
    }

    if (buffer.trim()) processEvent(buffer);
  } finally {
    reader.releaseLock();
  }

  if (!complete) {
    throw new Error("The response stream ended before completion.");
  }

  return complete;
}
