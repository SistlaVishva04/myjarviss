import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

interface Message {
  id: string;
  type: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface TranscriptDisplayProps {
  messages: Message[];
  currentTranscript?: string;
}

const TranscriptDisplay = ({ messages, currentTranscript }: TranscriptDisplayProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  return (
    <div 
      ref={scrollRef}
      className="h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent pr-2"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-3 ${message.type === "user" ? "text-right" : "text-left"}`}
          >
            <div className="text-[10px] font-orbitron text-primary/50 uppercase tracking-wider mb-1">
              {message.type === "user" ? "USER" : "ASSISTANT"}
            </div>
            <div
              className={`inline-block px-3 py-2 rounded-lg text-sm max-w-[90%] ${
                message.type === "user"
                  ? "bg-primary/20 text-foreground border border-primary/30"
                  : "bg-secondary/50 text-foreground border border-accent/20"
              }`}
            >
              {message.text}
            </div>
          </motion.div>
        ))}

        {/* Live transcript indicator */}
        {currentTranscript && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-right mb-3"
          >
            <div className="text-[10px] font-orbitron text-accent/70 uppercase tracking-wider mb-1 flex items-center justify-end gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-accent"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
              PROCESSING
            </div>
            <div className="inline-block px-3 py-2 rounded-lg text-sm bg-accent/10 text-foreground/70 border border-accent/20 italic">
              {currentTranscript}...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length === 0 && !currentTranscript && (
        <div className="text-center text-muted-foreground/50 text-sm mt-8">
          Click the orb to begin...
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay;
