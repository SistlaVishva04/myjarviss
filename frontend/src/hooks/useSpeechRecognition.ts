import { useState, useEffect, useCallback, useRef } from "react";

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isStartingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const isSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition: ISpeechRecognition = new SpeechRecognitionClass();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      console.log("[SpeechRecognition] Started successfully");
      setIsListening(true);
      setError(null);
      isStartingRef.current = false;
      retryCountRef.current = 0;
    };

    recognition.onend = () => {
      console.log("[SpeechRecognition] Ended");
      setIsListening(false);
      isStartingRef.current = false;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[SpeechRecognition] Error:", event.error);
      isStartingRef.current = false;
      
      // Handle specific errors
      switch (event.error) {
        case "no-speech":
          // Not a critical error, just no speech detected
          console.log("[SpeechRecognition] No speech detected");
          break;
        case "aborted":
          // User or system aborted, not an error
          break;
        case "audio-capture":
          setError("Microphone not available. Please check permissions.");
          break;
        case "not-allowed":
          setError("Microphone access denied. Please allow microphone access.");
          break;
        case "network":
          setError("Network error. Please check your connection.");
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }
      
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        setInterimTranscript("");
      } else {
        setInterimTranscript(interimText);
      }
    };

    return recognition;
  }, [isSupported]);

  useEffect(() => {
    recognitionRef.current = createRecognition();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [createRecognition]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in your browser");
      return;
    }

    // Prevent multiple simultaneous start attempts
    if (isStartingRef.current || isListening) {
      console.log("[SpeechRecognition] Already starting or listening");
      return;
    }

    setTranscript("");
    setInterimTranscript("");
    setError(null);
    isStartingRef.current = true;

    const attemptStart = () => {
      try {
        // Recreate recognition instance for fresh start
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {
            // Ignore abort errors
          }
        }
        
        recognitionRef.current = createRecognition();
        
        if (recognitionRef.current) {
          console.log("[SpeechRecognition] Attempting to start...");
          recognitionRef.current.start();
        }
      } catch (err: unknown) {
        console.error("[SpeechRecognition] Start error:", err);
        
        // Retry logic for transient errors
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`[SpeechRecognition] Retrying... (${retryCountRef.current}/${maxRetries})`);
          setTimeout(attemptStart, 100);
        } else {
          isStartingRef.current = false;
          setError("Failed to start speech recognition. Please try again.");
        }
      }
    };

    attemptStart();
  }, [isSupported, isListening, createRecognition]);

  const stopListening = useCallback(() => {
    console.log("[SpeechRecognition] Stopping...");
    isStartingRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // If stop fails, try abort
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore errors during cleanup
        }
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  };
};

export default useSpeechRecognition;