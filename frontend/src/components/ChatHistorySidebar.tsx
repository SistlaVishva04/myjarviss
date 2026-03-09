import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  type: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
}

const ChatHistorySidebar = ({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}: ChatHistorySidebarProps) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-card/90 backdrop-blur-xl border-r border-primary/30 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary/20">
              <h2 className="font-orbitron text-lg text-primary text-glow tracking-wider">
                CHAT HISTORY
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <Button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-rajdhani tracking-wider"
              >
                <Plus className="h-4 w-4 mr-2" />
                NEW CONVERSATION
              </Button>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-2 pb-4">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground font-rajdhani">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                        currentConversationId === conv.id
                          ? "bg-primary/20 border-primary/50"
                          : "bg-secondary/30 border-transparent hover:bg-secondary/50 hover:border-primary/20"
                      }`}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        onClose();
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-rajdhani text-sm text-foreground truncate">
                            {conv.title}
                          </p>
                          <p className="font-rajdhani text-xs text-muted-foreground mt-1">
                            {formatDate(conv.updatedAt)} • {conv.messages.length} messages
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-primary/20">
              <p className="font-orbitron text-[10px] text-muted-foreground text-center tracking-widest">
                {conversations.length} CONVERSATIONS STORED
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatHistorySidebar;
