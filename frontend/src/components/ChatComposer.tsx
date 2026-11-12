import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ArrowUp, FileText, Mic, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

export interface ChatComposerHandle {
  applyPrompt: (prompt: string) => void;
}

interface ChatComposerProps {
  isProcessing: boolean;
  isListening: boolean;
  isMobile: boolean;
  speechSupported: boolean;
  onSend: (text: string) => Promise<void>;
  onVoice: () => void;
  onPointerDown: React.PointerEventHandler<HTMLButtonElement>;
  onPointerUp: React.PointerEventHandler<HTMLButtonElement>;
  onPointerCancel: React.PointerEventHandler<HTMLButtonElement>;
}

interface TextAttachment {
  name: string;
  content: string;
}

const MAX_ATTACHMENT_BYTES = 256 * 1024;
const ALLOWED_EXTENSIONS = /\.(txt|md|csv|json)$/i;

const ChatComposer = forwardRef<ChatComposerHandle, ChatComposerProps>(
  ({ isProcessing, isListening, isMobile, speechSupported, onSend, onVoice, onPointerDown, onPointerUp, onPointerCancel }, ref) => {
    const [draft, setDraft] = useState("");
    const [attachment, setAttachment] = useState<TextAttachment | null>(null);
    const [isReadingAttachment, setIsReadingAttachment] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const skipVoiceClickRef = useRef(false);

    useImperativeHandle(ref, () => ({
      applyPrompt(prompt) {
        setDraft(prompt);
        window.requestAnimationFrame(() => textareaRef.current?.focus());
      },
    }));

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const message = draft.trim();
      if ((!message && !attachment) || isProcessing || isReadingAttachment) return;

      const text = attachment
        ? `${message || "Please review this file."}\n\nAttached file: ${attachment.name}\n${attachment.content}`
        : message;
      setDraft("");
      setAttachment(null);
      await onSend(text);
    };

    const handleAttachment = async (file?: File) => {
      if (!file) return;
      if (!ALLOWED_EXTENSIONS.test(file.name)) {
        toast.error("Choose a text, Markdown, CSV, or JSON file.");
        return;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error("That file is over 256 KB. Choose a smaller text file.");
        return;
      }

      setIsReadingAttachment(true);
      try {
        setAttachment({ name: file.name, content: await file.text() });
      } catch {
        toast.error("The file could not be read. Try another text file.");
      } finally {
        setIsReadingAttachment(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    const handleVoiceClick = () => {
      if (skipVoiceClickRef.current) {
        skipVoiceClickRef.current = false;
        return;
      }
      onVoice();
    };

    return (
      <form className="composer-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="composer-surface">
          <label className="sr-only" htmlFor="vishva-message">
            Message Vishva
          </label>
          <textarea
            ref={textareaRef}
            id="vishva-message"
            className="composer-textarea"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask anything, or share what’s on your mind"
            rows={2}
            disabled={isProcessing}
            aria-describedby="composer-hint"
          />

          {attachment && (
            <div className="composer-file">
              <FileText size={15} aria-hidden="true" />
              <span>{attachment.name}</span>
              <button
                type="button"
                className="composer-file-remove"
                aria-label={`Remove ${attachment.name}`}
                onClick={() => setAttachment(null)}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          )}

          {isReadingAttachment && (
            <p className="composer-file-status" role="status">Reading text file…</p>
          )}

          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json"
            aria-label="Choose a text file to attach"
            onChange={(event) => void handleAttachment(event.target.files?.[0])}
          />

          <div className="composer-toolbar">
            <div className="composer-toolbar-group">
              <button
                type="button"
                className="icon-control"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || isReadingAttachment}
                aria-label="Attach a text file"
                title="Attach a text file"
              >
                <Paperclip size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`icon-control${isListening ? " is-active" : ""}`}
                onPointerDown={(event) => {
                  if (isMobile) {
                    skipVoiceClickRef.current = true;
                    onPointerDown(event);
                  }
                }}
                onPointerUp={(event) => {
                  if (isMobile && skipVoiceClickRef.current) {
                    onPointerUp(event);
                    window.setTimeout(() => {
                      skipVoiceClickRef.current = false;
                    }, 0);
                  }
                }}
                onPointerCancel={(event) => {
                  if (isMobile && skipVoiceClickRef.current) {
                    onPointerCancel(event);
                    window.setTimeout(() => {
                      skipVoiceClickRef.current = false;
                    }, 0);
                  }
                }}
                onClick={handleVoiceClick}
                disabled={!speechSupported || isProcessing}
                aria-label={isListening ? "Stop listening and send transcript" : "Start voice input"}
                aria-pressed={isListening}
                title={
                  !speechSupported
                    ? "Speech recognition is not supported in this browser"
                    : isMobile
                      ? "Touch and hold to speak"
                      : "Start voice input"
                }
              >
                <Mic size={18} aria-hidden="true" />
              </button>
            </div>
            <button
              type="submit"
              className="icon-control composer-send"
              disabled={isProcessing || isReadingAttachment || (!draft.trim() && !attachment)}
              aria-label={isProcessing ? "Vishva is responding" : "Send message"}
              title="Send message"
            >
              <ArrowUp size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
        <p id="composer-hint" className="composer-note">
          Enter to send · Shift + Enter for a new line
        </p>
      </form>
    );
  },
);

ChatComposer.displayName = "ChatComposer";

export default ChatComposer;
