import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { History, Plus, LogIn, LogOut, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import JarvisOrb, { OrbState } from "@/components/JarvisOrb";
import HUDPanel from "@/components/HUDPanel";
import BackgroundGrid from "@/components/BackgroundGrid";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import StatusIndicator from "@/components/StatusIndicator";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import ChatHistorySidebar, { Conversation, Message } from "@/components/ChatHistorySidebar";
import CreditsModal from "@/components/CreditsModal";
import { Button } from "@/components/ui/button";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import useTextToSpeech from "@/hooks/useTextToSpeech";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const {
    user,
    loading: authLoading,
    signOut
  } = useAuth();
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const isSpacePressed = useRef(false);

  // Get current conversation messages
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  // Load conversations from backend when user is authenticated
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversationId(null);
    }
  }, [user]);
  const loadConversations = async () => {
    if (!user) return;
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }

      const data = await response.json();
      const convs = (data?.conversations || []) as Array<{
        id: string;
        title: string;
        createdAt: string;
        updatedAt: string;
        messages?: Array<{
          id: string;
          sender: "user" | "assistant" | "jarvis";
          text: string;
          timestamp: string;
        }>;
      }>;

      const conversationsWithMessages: Conversation[] = convs.map((conv) => ({
        id: conv.id,
        title: conv.title,
        messages:
          conv.messages?.map((m) => ({
            id: m.id,
            type: m.sender === "jarvis" ? "assistant" : (m.sender as "user" | "assistant"),
            text: m.text,
            timestamp: new Date(m.timestamp),
          })) ?? [],
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
      }));

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoadingConversations(false);
    }
  };
  const {
    isListening,
    transcript,
    interimTranscript,
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
    if (isSpeaking) {
      setOrbState("speaking");
    } else if (isListening || isProcessing) {
      setOrbState("listening");
    } else {
      setOrbState("idle");
    }
  }, [isListening, isSpeaking, isProcessing]);

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

  // Track pending transcript to process after listening stops
  const pendingProcessRef = useRef(false);
  const handleUserInput = useCallback(async (input: string) => {
    if (!input.trim()) return;

    // Create new conversation if none exists
    let convId = currentConversationId;
    if (!convId) {
      if (user) {
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
          convId = data.id;
          const newConv: Conversation = {
            id: data.id,
            title: data.title ?? "New Conversation",
            messages: [],
            createdAt: new Date(data.createdAt ?? Date.now()),
            updatedAt: new Date(data.updatedAt ?? Date.now()),
          };
          setConversations((prev) => [newConv, ...prev]);
        } catch (error) {
          console.error("Error creating conversation:", error);
          toast.error("Failed to create conversation");
          return;
        }
      } else {
        // For non-authenticated users
        convId = Date.now().toString();
        const newConv: Conversation = {
          id: convId,
          title: "New Conversation",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setConversations([newConv]);
      }
      setCurrentConversationId(convId);
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: input.trim(),
      timestamp: new Date()
    };

    // Update local state with user message
    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        const updatedMessages = [...c.messages, userMessage];
        const newTitle =
          c.messages.length === 0 ? generateTitle(updatedMessages) : c.title;
        return {
          ...c,
          messages: updatedMessages,
          title: newTitle,
          updatedAt: new Date()
        };
      }
      return c;
    }));
    setIsProcessing(true);
    try {
      // Get updated messages for this conversation
      const currentConv = conversations.find((c) => c.id === convId);
      const allMessages = [...(currentConv?.messages || []), userMessage];
      const conversationHistory = allMessages.map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          conversationId: convId,
          messages: conversationHistory,
        }),
      });

      if (!response.ok) {
        let message = "Failed to get response";
        try {
          const data = await response.json();
          if (data?.error || data?.message) {
            message = data.error || data.message;
          }
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      const data = await response.json();
      const reply =
        data?.reply ||
        "I apologize, Sir. I'm having difficulty processing that request.";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        text: reply,
        timestamp: new Date(),
      };

      // Update local state with assistant message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            return {
              ...c,
              messages: [...c.messages, assistantMessage],
              updatedAt: new Date(),
            };
          }
          return c;
        })
      );

      if (ttsSupported) {
        speak(reply);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg = err?.message || "Failed to get response";
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }, [currentConversationId, conversations, user, speak, ttsSupported]);

  // Process transcript - use interim if final isn't available yet
  const processTranscript = useCallback(async () => {
    const textToProcess = transcript || interimTranscript;
    if (textToProcess && !isProcessing) {
      console.log("[Processing] Transcript:", textToProcess);
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
      if (e.code === "Space" && !isSpacePressed.current && !e.repeat) {
        e.preventDefault();
        isSpacePressed.current = true;
        if (speechSupported && !isProcessing && !isSpeaking) {
          startListening();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isSpacePressed.current) {
        e.preventDefault();
        isSpacePressed.current = false;
        if (isListening) {
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
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-orbitron text-primary animate-pulse">INITIALIZING...</div>
      </div>;
  }
  return <div className="relative min-h-screen overflow-hidden bg-background">
      <BackgroundGrid />

      {/* History Sidebar - Only for authenticated users */}
      {user && <ChatHistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} conversations={conversations} currentConversationId={currentConversationId} onSelectConversation={setCurrentConversationId} onNewChat={createNewConversation} onDeleteConversation={deleteConversation} />}

      {/* Top left controls */}
      <motion.div className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-1 md:gap-2 z-20" initial={{
      opacity: 0,
      x: -20
    }} animate={{
      opacity: 1,
      x: 0
    }} transition={{
      delay: 0.3
    }}>
        {user ? <>
            <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(true)} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30">
              <History className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={createNewConversation} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30">
              <Plus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30" title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
          </> : <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-rajdhani">
            <LogIn className="h-4 w-4 mr-2" />
            Login for History
          </Button>}
      </motion.div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">

        {/* Time display */}
        <motion.div className="absolute top-4 right-4 md:top-8 md:right-8 text-right" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.4
      }}>
          <div className="font-orbitron text-sm md:text-3xl text-primary text-glow">{currentTime}</div>
          <div className="font-rajdhani text-[10px] md:text-xs text-muted-foreground tracking-wider hidden md:block">
            {currentDate}
          </div>
        </motion.div>

        {/* Main grid layout */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 w-full max-w-6xl mt-16 lg:mt-0">
          {/* Left panel - Status */}
          <div className="order-2 lg:order-1 w-full lg:w-auto">
            <HUDPanel title="System Status" position="left">
              <StatusIndicator isConnected={true} isListening={isListening} isSpeaking={isSpeaking} />
            </HUDPanel>
          </div>

          {/* Center - Title, Orb with Waveform */}
          <div className="order-1 lg:order-2 flex-shrink-0 flex flex-col items-center gap-4">
            <motion.div className="text-center" initial={{
            opacity: 0,
            y: -20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.2
          }}>
              <h1 className="font-orbitron text-lg sm:text-2xl md:text-3xl font-bold tracking-[0.2em] md:tracking-[0.3em] text-primary text-glow">
                J.A.R.V.I.S.
              </h1>
              <p className="font-rajdhani text-[10px] sm:text-xs md:text-sm text-muted-foreground tracking-widest mt-1">
                JUST A RATHER VERY INTELLIGENT SYSTEM
              </p>
            </motion.div>
            <JarvisOrb state={orbState} onClick={handleOrbClick} />
            <div className="w-64 h-20 rounded-lg bg-background/30 border border-primary/20 backdrop-blur-sm overflow-hidden">
              <WaveformVisualizer isActive={isListening || isSpeaking} type={isSpeaking ? "speaking" : "listening"} />
            </div>
          </div>

          {/* Right panel - Transcript */}
          <div className="order-3 w-full lg:w-auto">
            <HUDPanel title="Communication Log" position="right">
              <TranscriptDisplay messages={messages} currentTranscript={isListening ? interimTranscript || transcript : undefined} />
            </HUDPanel>
          </div>
        </div>

        {/* Instructions */}
        <motion.div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 text-center w-full px-4" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.6
      }}>
          
          <p className="font-rajdhani text-xs text-muted-foreground md:hidden">
            {!speechSupported ? <span className="text-destructive">Speech not supported</span> : isListening ? <span className="text-primary animate-pulse">Listening...</span> : isProcessing ? <span className="text-primary/70">Processing...</span> : <span>Tap the orb to speak</span>}
          </p>
          
        </motion.div>
      </div>

      {/* Info button - bottom right */}
      <motion.button
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-20 w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 flex items-center justify-center text-primary transition-all hover:scale-110"
        onClick={() => setIsCreditsOpen(true)}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        title="Credits"
      >
        <Info className="h-5 w-5" />
      </motion.button>

      {/* Credits Modal */}
      <CreditsModal isOpen={isCreditsOpen} onClose={() => setIsCreditsOpen(false)} />

      {/* Ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none">
        <div className="absolute inset-0 rounded-full opacity-20" style={{
        background: "radial-gradient(circle, hsl(187 100% 50% / 0.3) 0%, transparent 50%)"
      }} />
      </div>
    </div>;
};
export default Index;