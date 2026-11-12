import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, Plus, LogIn, LogOut, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VishvaCoreOrb, { OrbState } from "@/components/VishvaCoreOrb";
import BackgroundGrid from "@/components/BackgroundGrid";
import TranscriptDisplay, { Message } from "@/components/TranscriptDisplay";
import StatusIndicator from "@/components/StatusIndicator";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import ChatHistorySidebar, { Conversation } from "@/components/ChatHistorySidebar";
import ChatComposer, { ChatComposerHandle } from "@/components/ChatComposer";
import CreditsModal from "@/components/CreditsModal";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import useTextToSpeech from "@/hooks/useTextToSpeech";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isMobileBrowser } from "@/lib/isMobile";
import { API_BASE_URL } from "@/lib/api";
import { readChatStream } from "@/lib/readChatStream";
import { toSpeechText } from "@/lib/speechText";

// Generate title from first message
const generateTitle = (messages: Message[]): string => {
  const firstUserMessage = messages.find(m => m.type === "user");
  if (firstUserMessage) {
    const text = firstUserMessage.text;
    return text.length > 40 ? text.substring(0, 40) + "..." : text;
  }
  return "New Conversation";
};
const Index = () => {
  const navigate = useNavigate();
  const isMobile = isMobileBrowser();
  const shouldReduceMotion = useReducedMotion();
  const {
    user,
    loading: authLoading,
    signOut,
    backendAvailable,
    sessionError,
    reportBackendStatus,
  } = useAuth();
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState(false);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [isLoadingSelectedConversation, setIsLoadingSelectedConversation] = useState(false);
  const composerRef = useRef<ChatComposerHandle>(null);
  const isSpacePressed = useRef(false);
  const pendingProcessRef = useRef(false);
  const isHoldToSpeakActiveRef = useRef(false);
  const conversationPageRef = useRef(1);
  const selectedMessageRequestRef = useRef(0);

  // Get current conversation messages
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  const loadConversations = useCallback(async (append = false) => {
    if (!user) return;
    const page = append ? conversationPageRef.current + 1 : 1;
    if (append) setIsLoadingMoreConversations(true);
    else setIsLoadingConversations(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations?page=${page}&limit=20`,
        {
        method: "GET",
        credentials: "include",
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to load conversations");
      }

      const data = await response.json();
      const convs = (data?.conversations || []) as Array<{
        id: string;
        title: string;
        createdAt: string;
        updatedAt: string;
        messageCount: number;
      }>;

      const summaries: Conversation[] = convs.map((conv) => ({
        id: conv.id,
        title: conv.title,
        messages: [],
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messageCount: conv.messageCount,
        messagesPage: 0,
        hasMoreMessages: conv.messageCount > 0,
      }));

      conversationPageRef.current = page;
      setHasMoreConversations(Boolean(data?.hasMore));
      setConversations((previous) =>
        append
          ? [...previous, ...summaries.filter(
              (summary) => !previous.some((item) => item.id === summary.id),
            )]
          : summaries,
      );
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load conversations");
    } finally {
      if (append) setIsLoadingMoreConversations(false);
      else setIsLoadingConversations(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      conversationPageRef.current = 1;
      void loadConversations();
    } else {
      setConversations([]);
      setCurrentConversationId(null);
      setHasMoreConversations(false);
      conversationPageRef.current = 1;
    }
  }, [user, loadConversations]);
  const {
    isListening,
    transcript,
    interimTranscript,
    audioAnalyser,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechSupported,
    error: speechError
  } = useSpeechRecognition();
  const {
    isSpeaking,
    speak,
    isSupported: ttsSupported
  } = useTextToSpeech();

  // Update orb state based on current activity
  useEffect(() => {
    if (speechError) {
      setOrbState("error");
    } else if (isSpeaking) {
      setOrbState("speaking");
    } else if (isProcessing) {
      setOrbState("thinking");
    } else if (isListening) {
      setOrbState("listening");
    } else {
      setOrbState("idle");
    }
  }, [isListening, isSpeaking, isProcessing, speechError]);

  const handleSelectConversation = useCallback(async (id: string) => {
    setCurrentConversationId(id);
    if (!user) return;

    const conversation = conversations.find((item) => item.id === id);
    if (conversation?.messagesPage) return;

    const requestId = ++selectedMessageRequestRef.current;
    setIsLoadingSelectedConversation(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${id}/messages?page=1&limit=50`,
        { credentials: "include" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to load conversation messages");
      }

      const data = await response.json();
      if (requestId !== selectedMessageRequestRef.current) return;
      reportBackendStatus(true);
      setConversations((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                messages: (data.messages || []).map((message: {
                  id: string;
                  sender: "user" | "assistant";
                  text: string;
                  timestamp: string;
                }) => ({
                  id: message.id,
                  type: message.sender,
                  text: message.text,
                  timestamp: new Date(message.timestamp),
                })),
                messagesPage: data.page,
                hasMoreMessages: data.hasMore,
              }
            : item,
        ),
      );
    } catch (error) {
      if (requestId === selectedMessageRequestRef.current) {
        reportBackendStatus(false);
        toast.error(error instanceof Error ? error.message : "Failed to load conversation messages");
      }
    } finally {
      if (requestId === selectedMessageRequestRef.current) {
        setIsLoadingSelectedConversation(false);
      }
    }
  }, [conversations, reportBackendStatus, user]);

  const loadOlderMessages = useCallback(async () => {
    if (!user || !currentConversation) return;
    const page = (currentConversation.messagesPage ?? 1) + 1;
    setIsLoadingOlderMessages(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${currentConversation.id}/messages?page=${page}&limit=50`,
        { credentials: "include" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to load earlier messages");
      }

      const data = await response.json();
      reportBackendStatus(true);
      setConversations((previous) =>
        previous.map((item) =>
          item.id === currentConversation.id
            ? {
                ...item,
                messages: [
                  ...(data.messages || []).map((message: {
                    id: string;
                    sender: "user" | "assistant";
                    text: string;
                    timestamp: string;
                  }) => ({
                    id: message.id,
                    type: message.sender,
                    text: message.text,
                    timestamp: new Date(message.timestamp),
                  })),
                  ...item.messages,
                ],
                messagesPage: data.page,
                hasMoreMessages: data.hasMore,
              }
            : item,
        ),
      );
    } catch (error) {
      reportBackendStatus(false);
      toast.error(error instanceof Error ? error.message : "Failed to load earlier messages");
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [currentConversation, reportBackendStatus, user]);

  // Handle speech errors
  useEffect(() => {
    if (speechError) {
      toast.error(`Speech recognition error: ${speechError}`);
    }
  }, [speechError]);

  // Create new conversation
  const createNewConversation = useCallback(async () => {
    if (!user) {
      // For non-authenticated users, just create a local conversation
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: "New Conversation",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setConversations([newConv]);
      setCurrentConversationId(newConv.id);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: "New Conversation",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await response.json();
      const newConv: Conversation = {
        id: data.id,
        title: data.title ?? "New Conversation",
        messages: [],
        createdAt: new Date(data.createdAt ?? Date.now()),
        updatedAt: new Date(data.updatedAt ?? Date.now()),
      };
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      toast.success("New conversation started");
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
    }
  }, [user]);

  // Delete conversation
  const deleteConversation = useCallback(
    async (id: string) => {
      if (!user) {
        // For non-authenticated users, just update local state
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (currentConversationId === id) {
          const remaining = conversations.filter((c) => c.id !== id);
          setCurrentConversationId(
            remaining.length > 0 ? remaining[0].id : null
          );
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to delete conversation");
        }

        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (currentConversationId === id) {
          const remaining = conversations.filter((c) => c.id !== id);
          setCurrentConversationId(
            remaining.length > 0 ? remaining[0].id : null
          );
        }
        toast.success("Conversation deleted");
      } catch (error) {
        console.error("Error deleting conversation:", error);
        toast.error("Failed to delete conversation");
      }
    },
    [user, currentConversationId, conversations]
  );
const handleHoldToSpeakStart = useCallback(() => {
  if (!isMobile) return;

  if (isHoldToSpeakActiveRef.current) return;
  isHoldToSpeakActiveRef.current = true;

  if (speechSupported && !isProcessing && !isSpeaking) {
    startListening();
    toast.info("Listening...", { duration: 2000 });
  } else if (!speechSupported) {
    toast.error("Speech recognition is not supported in this browser");
  }

}, [isMobile, speechSupported, isProcessing, isSpeaking, startListening]);

const handleHoldToSpeakEnd = useCallback(() => {
  if (!isMobile) return;

  if (!isHoldToSpeakActiveRef.current) return;
  isHoldToSpeakActiveRef.current = false;

  if (isListening) {
    pendingProcessRef.current = true;
    stopListening();
  }
}, [isMobile, isListening, stopListening]);
  const handleUserInput = useCallback(async (input: string) => {
    const text = input.trim();
    if (!text || isProcessing) return;

    let convId = currentConversationId;
    if (!convId) {
      if (user) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/conversations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title: "New Conversation" }),
          });
          if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(data?.error || "Failed to create conversation");
          }

          const data = await response.json();
          convId = data.id;
          setConversations((previous) => [{
            id: data.id,
            title: data.title ?? "New Conversation",
            messages: [],
            createdAt: new Date(data.createdAt ?? Date.now()),
            updatedAt: new Date(data.updatedAt ?? Date.now()),
            messageCount: 0,
            messagesPage: 1,
            hasMoreMessages: false,
          }, ...previous]);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to create conversation");
          return;
        }
      } else {
        convId = Date.now().toString();
        setConversations([{
          id: convId,
          title: "New Conversation",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          messageCount: 0,
          messagesPage: 1,
          hasMoreMessages: false,
        }]);
      }
      setCurrentConversationId(convId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text,
      timestamp: new Date(),
    };
    const assistantMessageId = `${Date.now() + 1}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      type: "assistant",
      text: "",
      timestamp: new Date(),
    };
    setConversations((previous) => previous.map((conversation) => {
      if (conversation.id !== convId) return conversation;
      const newTitle = conversation.messages.length === 0
        ? generateTitle([userMessage])
        : conversation.title;
      return {
        ...conversation,
        title: newTitle,
        messages: [...conversation.messages, userMessage, assistantMessage],
        messageCount: (conversation.messageCount ?? conversation.messages.length) + 2,
        updatedAt: new Date(),
      };
    }));

    setIsProcessing(true);
    let streamedReply = "";
    let pendingFrame: number | null = null;
    try {
      const currentConv = conversations.find((conversation) => conversation.id === convId);
      const conversationHistory = [
        ...(currentConv?.messages || []),
        userMessage,
      ].slice(-10).map((message) => ({
        role: message.type === "user" ? "user" : "assistant",
        content: message.text,
      }));

      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conversationId: convId,
          messages: conversationHistory,
        }),
      });
      reportBackendStatus(response.status < 500);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to get response");
      }

      const result = await readChatStream(response, (delta) => {
        streamedReply += delta;
        if (pendingFrame !== null) return;
        pendingFrame = window.requestAnimationFrame(() => {
          pendingFrame = null;
          setConversations((previous) => previous.map((conversation) =>
            conversation.id === convId
              ? {
                  ...conversation,
                  messages: conversation.messages.map((message) =>
                    message.id === assistantMessageId
                      ? { ...message, text: streamedReply }
                      : message,
                  ),
                }
              : conversation,
          ));
        });
      });

      if (pendingFrame !== null) window.cancelAnimationFrame(pendingFrame);
      setConversations((previous) => previous.map((conversation) =>
        conversation.id === convId
          ? {
              ...conversation,
              title: conversation.messages.length <= 2
                ? generateTitle([userMessage])
                : conversation.title,
              messages: conversation.messages.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, text: result.reply }
                  : message,
              ),
              updatedAt: new Date(),
            }
          : conversation,
      ));

      if (ttsSupported) speak(toSpeechText(result.reply));
    } catch (error: unknown) {
      if (pendingFrame !== null) window.cancelAnimationFrame(pendingFrame);
      if (error instanceof TypeError) reportBackendStatus(false);
      setConversations((previous) => previous.map((conversation) =>
        conversation.id === convId
          ? {
              ...conversation,
              messages: conversation.messages.filter(
                (message) => message.id !== assistantMessageId,
              ),
              messageCount: Math.max(0, (conversation.messageCount ?? 2) - 1),
            }
          : conversation,
      ));
      toast.error(error instanceof Error ? error.message : "Failed to get response");
    } finally {
      setIsProcessing(false);
    }
  }, [currentConversationId, conversations, user, speak, ttsSupported, isProcessing, reportBackendStatus]);

  // Process transcript - use interim if final isn't available yet
  const processTranscript = useCallback(async () => {
    const textToProcess = transcript || interimTranscript;
    if (textToProcess && !isProcessing) {
      await handleUserInput(textToProcess);
      resetTranscript();
    }
    pendingProcessRef.current = false;
  }, [transcript, interimTranscript, isProcessing, handleUserInput, resetTranscript]);

  // Auto-process when listening ends and we have pending process
  useEffect(() => {
    if (!isListening && pendingProcessRef.current) {
      // Small delay to ensure final transcript is captured
      const timer = setTimeout(() => {
        processTranscript();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isListening, processTranscript]);

  // Spacebar hold-to-listen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      const isEditing = target instanceof HTMLElement &&
        (target.isContentEditable || Boolean(target.closest("input, textarea, button, select, [role='textbox']")));
      if (e.code === "Space" && !isEditing && !isSpacePressed.current && !e.repeat) {
        e.preventDefault();
        isSpacePressed.current = true;
        if (speechSupported && !isProcessing && !isSpeaking) {
          startListening();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target;
      const isEditing = target instanceof HTMLElement &&
        (target.isContentEditable || Boolean(target.closest("input, textarea, button, select, [role='textbox']")));
      if (e.code === "Space" && isSpacePressed.current) {
        e.preventDefault();
        isSpacePressed.current = false;
        if (!isEditing && isListening) {
          pendingProcessRef.current = true;
          stopListening();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [speechSupported, isProcessing, isSpeaking, isListening, startListening, stopListening]);

  const handleOrbClick = useCallback(() => {
    if (!speechSupported) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }
    if (isListening) {
      pendingProcessRef.current = true;
      stopListening();
    } else if (!isProcessing && !isSpeaking) {
      startListening();
      toast.info("Listening...", {
        duration: 2000
      });
    }
  }, [isListening, startListening, stopListening, speechSupported, isProcessing, isSpeaking]);
  const handleSignOut = async () => {
    await signOut();
    setConversations([]);
    setCurrentConversationId(null);
    toast.success("Signed out successfully");
  };

  const closeCredits = useCallback(() => setIsCreditsOpen(false), []);
  const closeHistory = useCallback(() => setIsHistoryOpen(false), []);
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const connectionState = backendAvailable === null
    ? "checking"
    : backendAvailable
      ? "connected"
      : "disconnected";
  const hasStartedConversation = messages.length > 0 ||
    (currentConversation?.messageCount ?? 0) > 0 ||
    isProcessing;
  const greeting = user?.email ? "Welcome back" : "What can I help with?";
  const prompts = [
    { label: "Coding", prompt: "Help me solve a coding problem." },
    { label: "Cooking", prompt: "Suggest a simple meal I can cook." },
    { label: "Health", prompt: "Share general wellness guidance for me." },
    { label: "Trips", prompt: "Help me plan a trip." },
    { label: "Troubleshoot", prompt: "Help me troubleshoot a problem." },
  ];
  const transition = {
    duration: shouldReduceMotion ? 0.15 : 0.28,
    ease: "easeOut" as const,
  };

  if (authLoading) {
    return (
      <main className="assistant-loading" role="status" aria-live="polite">
        <BackgroundGrid />
        <Sparkles size={20} aria-hidden="true" />
        <span>Starting myVishva…</span>
      </main>
    );
  }

  return (
    <div className="assistant-shell">
      <BackgroundGrid />
      <ChatHistorySidebar
        isOpen={isHistoryOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={closeHistory}
        onToggleCollapsed={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={createNewConversation}
        onDeleteConversation={deleteConversation}
        hasMoreConversations={hasMoreConversations}
        isLoadingMoreConversations={isLoadingMoreConversations}
        isLoadingConversations={isLoadingConversations}
        onLoadMoreConversations={() => void loadConversations(true)}
        userLabel={user?.email ?? null}
        onSignIn={() => navigate("/auth")}
        onSignOut={handleSignOut}
        onOpenCredits={() => setIsCreditsOpen(true)}
      />

      <main className="workspace">
        <header className="workspace-header">
          <div className="workspace-identity">
            <button
              type="button"
              className="icon-control mobile-menu-button"
              onClick={() => setIsHistoryOpen(true)}
              aria-label="Open conversation navigation"
            >
              <Menu size={19} aria-hidden="true" />
            </button>
            <span className="brand-mark workspace-brand-mark" aria-hidden="true">
              <Sparkles size={18} />
            </span>
            <div className="workspace-brand-copy">
              <strong>myVishva</strong>
              <span>AI assistant</span>
            </div>
          </div>

          <div className="workspace-actions">
            <StatusIndicator
              connectionState={connectionState}
              isListening={isListening}
              isThinking={isProcessing}
              isSpeaking={isSpeaking}
            />
            <time className="workspace-time">
              <span>{currentTime}</span>
              <span>{currentDate}</span>
            </time>
            <button
              type="button"
              className="icon-control workspace-new-chat"
              onClick={createNewConversation}
              aria-label="Start a new chat"
              title="Start a new chat"
            >
              <Plus size={19} aria-hidden="true" />
            </button>
            {user ? (
              <button
                type="button"
                className="icon-control workspace-auth-action"
                onClick={handleSignOut}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={18} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className="workspace-text-action workspace-auth-action"
                onClick={() => navigate("/auth")}
                aria-label="Sign in for conversation history"
              >
                <LogIn size={17} aria-hidden="true" />
                <span>Sign in</span>
              </button>
            )}
          </div>
        </header>

        {sessionError && !user && (
          <div className="session-notice" role="status">
            {sessionError}
          </div>
        )}

        <div className="workspace-content">
          <AnimatePresence mode="sync" initial={false}>
            {hasStartedConversation ? (
              <motion.section
                key="conversation"
                className="conversation-stage"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -5 }}
                transition={transition}
                aria-label="Current conversation"
              >
                <header className="conversation-header">
                  <VishvaCoreOrb
                    state={orbState}
                    audioAnalyser={audioAnalyser}
                    size="compact"
                    onClick={handleOrbClick}
                  />
                  <div className="conversation-header-copy">
                    <h1 className="conversation-header-title">
                      {currentConversation?.title || "New conversation"}
                    </h1>
                    <p className="conversation-header-state" role="status" aria-live="polite">
                      {speechError
                        ? "Voice input unavailable"
                        : isListening
                        ? "Listening"
                        : isProcessing
                          ? "Vishva is thinking"
                          : isSpeaking
                            ? "Speaking"
                            : "Ready when you are"}
                    </p>
                  </div>
                  <WaveformVisualizer
                    isActive={isListening || isSpeaking}
                    type={isSpeaking ? "speaking" : "listening"}
                  />
                </header>
                <TranscriptDisplay
                  messages={messages}
                  currentTranscript={isListening ? interimTranscript || transcript : undefined}
                  isThinking={isProcessing}
                  isLoadingMessages={isLoadingSelectedConversation}
                  hasMoreMessages={Boolean(user && currentConversation?.hasMoreMessages)}
                  isLoadingOlderMessages={isLoadingOlderMessages}
                  onLoadOlderMessages={loadOlderMessages}
                />
              </motion.section>
            ) : (
              <motion.section
                key="welcome"
                className="welcome-stage"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -5 }}
                transition={transition}
                aria-label="Start a conversation"
              >
                <div className="welcome-orb-wrap">
                  <VishvaCoreOrb
                    state={orbState}
                    audioAnalyser={audioAnalyser}
                    onClick={handleOrbClick}
                  />
                  <div className="orb-caption" role="status" aria-live="polite">
                    {speechError
                      ? "Voice input unavailable"
                      : isListening
                      ? "Listening"
                      : isProcessing
                        ? "Thinking"
                        : isSpeaking
                          ? "Speaking"
                          : speechSupported
                            ? "Speak or type to begin"
                            : "Type a message to begin"}
                  </div>
                  <WaveformVisualizer
                    isActive={isListening || isSpeaking}
                    type={isSpeaking ? "speaking" : "listening"}
                  />
                </div>
                <div className="welcome-copy">
                  <h1 className="welcome-title">{greeting}</h1>
                  <p className="welcome-subtitle">
                    Ask a question, explore an idea, or talk it through.
                  </p>
                </div>
                <div className="welcome-composer">
                  <ChatComposer
                    ref={composerRef}
                    isProcessing={isProcessing}
                    isListening={isListening}
                    isMobile={isMobile}
                    speechSupported={speechSupported}
                    onSend={handleUserInput}
                    onVoice={handleOrbClick}
                    onPointerDown={handleHoldToSpeakStart}
                    onPointerUp={handleHoldToSpeakEnd}
                    onPointerCancel={handleHoldToSpeakEnd}
                  />
                </div>
                <div className="suggested-prompts" aria-label="Suggested prompts">
                  {prompts.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="prompt-chip"
                      onClick={() => composerRef.current?.applyPrompt(item.prompt)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {hasStartedConversation && (
            <div className="chat-composer">
              <ChatComposer
                isProcessing={isProcessing}
                isListening={isListening}
                isMobile={isMobile}
                speechSupported={speechSupported}
                onSend={handleUserInput}
                onVoice={handleOrbClick}
                onPointerDown={handleHoldToSpeakStart}
                onPointerUp={handleHoldToSpeakEnd}
                onPointerCancel={handleHoldToSpeakEnd}
              />
            </div>
          )}
        </div>

        <CreditsModal isOpen={isCreditsOpen} onClose={closeCredits} />
      </main>
    </div>
  );
};
export default Index;
