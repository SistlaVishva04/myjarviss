import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  FileClock,
  Info,
  LogIn,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { Message } from "@/components/TranscriptDisplay";

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
  messagesPage?: number;
  hasMoreMessages?: boolean;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  hasMoreConversations: boolean;
  isLoadingMoreConversations: boolean;
  isLoadingConversations: boolean;
  onLoadMoreConversations: () => void;
  userLabel: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenCredits: () => void;
}

interface SidebarPanelProps extends ChatHistorySidebarProps {
  mobile?: boolean;
}

const SidebarPanel = ({
  isCollapsed,
  onClose,
  onToggleCollapsed,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  hasMoreConversations,
  isLoadingMoreConversations,
  isLoadingConversations,
  onLoadMoreConversations,
  userLabel,
  onSignIn,
  onSignOut,
  onOpenCredits,
  mobile = false,
}: SidebarPanelProps) => {
  const [query, setQuery] = useState("");
  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return normalizedQuery
      ? conversations.filter((conversation) =>
          conversation.title.toLocaleLowerCase().includes(normalizedQuery),
        )
      : conversations;
  }, [conversations, query]);

  return (
    <aside
      className={`assistant-sidebar${isCollapsed ? " is-collapsed" : ""}${mobile ? "" : " desktop-sidebar"}`}
      aria-label="Conversation navigation"
    >
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">
          <Sparkles size={19} />
        </span>
        <span className="brand-name">myVishva</span>
      </div>

      {mobile && (
        <button
          type="button"
          className="icon-control mobile-sidebar-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}

      <div className="sidebar-tools">
        <button
          type="button"
          className="sidebar-action"
          onClick={() => { onNewChat(); onClose(); }}
          title="Start a new chat"
        >
          <Plus size={18} aria-hidden="true" />
          <span className="sidebar-action-label">New chat</span>
        </button>
        {!isCollapsed && (
          <label className="sidebar-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search loaded conversations</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
            />
          </label>
        )}
      </div>

      <h2 className="sidebar-section-label">Recent conversations</h2>
      {!isCollapsed && (
        <ul className="sidebar-conversations">
          {isLoadingConversations && conversations.length === 0 ? (
            <li className="sidebar-empty" role="status">Loading conversations…</li>
          ) : filteredConversations.length === 0 ? (
            <li className="sidebar-empty">
              {query ? "No loaded conversations match." : "Your conversations will appear here."}
            </li>
          ) : (
            filteredConversations.map((conversation) => (
              <li className="sidebar-conversation" key={conversation.id}>
                <button
                  type="button"
                  className="sidebar-conversation-select"
                  onClick={() => { onSelectConversation(conversation.id); onClose(); }}
                  aria-current={currentConversationId === conversation.id ? "page" : undefined}
                  title={conversation.title}
                >
                  <MessageSquare size={16} aria-hidden="true" />
                  <span className="sidebar-conversation-title">{conversation.title}</span>
                </button>
                <button
                  type="button"
                  className="sidebar-delete"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                  aria-label={`Delete ${conversation.title}`}
                  title={`Delete ${conversation.title}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))
          )}
          {hasMoreConversations && !query && (
            <li>
              <button
                type="button"
                className="sidebar-action"
                onClick={onLoadMoreConversations}
                disabled={isLoadingMoreConversations}
              >
                <FileClock size={17} aria-hidden="true" />
                <span className="sidebar-action-label">
                  {isLoadingMoreConversations ? "Loading…" : "Load older"}
                </span>
              </button>
            </li>
          )}
        </ul>
      )}

      {!isCollapsed && query && filteredConversations.length > 0 && (
        <p className="sidebar-empty" aria-live="polite">
          Showing loaded matches
        </p>
      )}

      <div className="sidebar-footer">
        <button type="button" className="sidebar-action" onClick={onOpenCredits}>
          <Info size={18} aria-hidden="true" />
          <span className="sidebar-action-label">About myVishva</span>
        </button>
        {userLabel ? (
          <>
            <div className="sidebar-account" title={userLabel}>
              <span className="account-avatar" aria-hidden="true">
                {userLabel.slice(0, 1).toLocaleUpperCase()}
              </span>
              <span className="account-email">{userLabel}</span>
            </div>
            <button type="button" className="sidebar-action" onClick={onSignOut}>
              <LogOut size={18} aria-hidden="true" />
              <span className="sidebar-action-label">Sign out</span>
            </button>
          </>
        ) : (
          <button type="button" className="sidebar-action" onClick={onSignIn}>
            <LogIn size={18} aria-hidden="true" />
            <span className="sidebar-action-label">Sign in for history</span>
          </button>
        )}
        {!mobile && (
          <button
            type="button"
            className="sidebar-collapse"
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>
    </aside>
  );
};

const ChatHistorySidebar = (props: ChatHistorySidebarProps) => {
  const shouldReduceMotion = useReducedMotion();
  const { isOpen, onClose } = props;
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusableElements = () => Array.from(
      mobilePanelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    focusableElements()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (
          document.activeElement instanceof Node &&
          !mobilePanelRef.current?.contains(document.activeElement)
        ) {
          return;
        }
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const elements = focusableElements();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <>
      <SidebarPanel {...props} />
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              className="mobile-sidebar-backdrop"
              aria-label="Close navigation"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.15 : 0.22 }}
            />
            <motion.div
              ref={mobilePanelRef}
              className="mobile-sidebar-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Conversation navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: shouldReduceMotion ? 0.15 : 0.22, ease: "easeOut" }}
            >
              <SidebarPanel {...props} mobile isCollapsed={false} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatHistorySidebar;
