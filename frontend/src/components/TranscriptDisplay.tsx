import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

export interface Message {
  id: string;
  type: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface TranscriptDisplayProps {
  messages: Message[];
  currentTranscript?: string;
  isThinking?: boolean;
  isLoadingMessages?: boolean;
  hasMoreMessages?: boolean;
  isLoadingOlderMessages?: boolean;
  onLoadOlderMessages?: () => void;
}

const TranscriptDisplay = ({
  messages,
  currentTranscript,
  isThinking,
  isLoadingMessages,
  hasMoreMessages,
  isLoadingOlderMessages,
  onLoadOlderMessages,
}: TranscriptDisplayProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const pendingScrollHeightRef = useRef<number | null>(null);
  const messageCountBeforeLoadRef = useRef(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (pendingScrollHeightRef.current !== null) {
      if (messages.length > messageCountBeforeLoadRef.current) {
        container.scrollTop += container.scrollHeight - pendingScrollHeightRef.current;
      }
      pendingScrollHeightRef.current = null;
    } else if (shouldStickToBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, currentTranscript, isLoadingMessages, isLoadingOlderMessages]);

  const loadOlderMessages = () => {
    if (scrollRef.current) {
      pendingScrollHeightRef.current = scrollRef.current.scrollHeight;
      messageCountBeforeLoadRef.current = messages.length;
    }
    onLoadOlderMessages?.();
  };
  const lastMessage = messages[messages.length - 1];
  const showThinking = Boolean(isThinking && lastMessage?.type === "assistant" && !lastMessage.text);

  return (
    <div
      ref={scrollRef}
      className="conversation-messages overflow-y-auto"
      role="log"
      aria-label="Conversation messages"
      aria-live="polite"
      aria-relevant="additions text"
      onScroll={(event) => {
        const element = event.currentTarget;
        shouldStickToBottomRef.current =
          element.scrollHeight - element.scrollTop - element.clientHeight < 120;
      }}
    >
      {hasMoreMessages && onLoadOlderMessages && (
        <button
          type="button"
          className="message-load-older"
          disabled={isLoadingOlderMessages}
          onClick={loadOlderMessages}
        >
          {isLoadingOlderMessages ? "Loading earlier messages…" : "Load earlier messages"}
        </button>
      )}

      {isLoadingMessages && messages.length === 0 ? (
        <div className="conversation-loading" role="status">
          <span />
          <span />
          <span />
          <span className="sr-only">Loading conversation</span>
        </div>
      ) : (
        messages.map((message) => (
          <article
            key={message.id}
            className={`message-row ${message.type === "user" ? "is-user" : "is-assistant"}`}
          >
            {message.type === "assistant" && (
              <span className="message-avatar" aria-hidden="true">
                <Sparkles size={15} />
              </span>
            )}
            <div className="message-body">
              <span className="sr-only">{message.type === "user" ? "You said: " : "Vishva replied: "}</span>
              {message.text}
            </div>
          </article>
        ))
      )}

      {currentTranscript && (
        <p className="listening-transcript" role="status">
          {currentTranscript}
        </p>
      )}

      {showThinking && (
        <div className="message-row is-assistant" role="status" aria-label="Vishva is thinking">
          <span className="message-avatar" aria-hidden="true">
            <Sparkles size={15} />
          </span>
          <div className="thinking-indicator"><span /> Vishva is thinking</div>
        </div>
      )}

      {messages.length === 0 && !currentTranscript && !isThinking && !isLoadingMessages && (
        <p className="conversation-empty">Your conversation will appear here.</p>
      )}
    </div>
  );
};

export default TranscriptDisplay;
