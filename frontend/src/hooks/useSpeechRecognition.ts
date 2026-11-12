import { useState, useEffect, useCallback, useRef } from "react";
import { isMobileBrowser } from "@/lib/isMobile";
import { cleanupAudioMonitor } from "@/lib/audioMonitorCleanup";
import { cleanupSpeechRecognition } from "@/lib/speechRecognitionCleanup";
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
  audioAnalyser: AnalyserNode | null;
}

const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioMonitorRequestRef = useRef(0);
  const isStartingRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const maxRetries = 3;

  const isSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stopAudioMonitor = useCallback(() => {
    audioMonitorRequestRef.current += 1;
    const stream = audioStreamRef.current;
    const source = audioSourceRef.current;
    const context = audioContextRef.current;
    audioStreamRef.current = null;
    audioSourceRef.current = null;
    audioContextRef.current = null;
    setAudioAnalyser(null);

    void cleanupAudioMonitor(stream, source, context).catch((cleanupError: unknown) => {
      console.warn(
        "[SpeechRecognition] Audio monitor cleanup failed:",
        cleanupError instanceof Error ? cleanupError.message : "Unknown cleanup error",
      );
    });
  }, []);

  const startAudioMonitor = useCallback(() => {
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) return;

    stopAudioMonitor();
    const requestId = audioMonitorRequestRef.current;
    let context: AudioContext;
    try {
      context = new window.AudioContext();
    } catch (monitorError: unknown) {
      console.warn(
        "[SpeechRecognition] Audio-reactive orb unavailable:",
        monitorError instanceof Error ? monitorError.message : "Unknown audio monitor error",
      );
      return;
    }
    audioContextRef.current = context;

    void (async () => {
      try {
        await context.resume();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (requestId !== audioMonitorRequestRef.current) {
          await cleanupAudioMonitor(stream, null, context);
          return;
        }

        audioStreamRef.current = stream;
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.78;
        source.connect(analyser);
        audioSourceRef.current = source;
        setAudioAnalyser(analyser);
      } catch (monitorError: unknown) {
        if (requestId !== audioMonitorRequestRef.current) return;

        const stream = audioStreamRef.current;
        const source = audioSourceRef.current;
        audioStreamRef.current = null;
        audioSourceRef.current = null;
        audioContextRef.current = null;
        setAudioAnalyser(null);
        await cleanupAudioMonitor(stream, source, context).catch((cleanupError: unknown) => {
          console.warn(
            "[SpeechRecognition] Audio monitor cleanup failed:",
            cleanupError instanceof Error ? cleanupError.message : "Unknown cleanup error",
          );
        });
        console.warn(
          "[SpeechRecognition] Audio-reactive orb unavailable:",
          monitorError instanceof Error ? monitorError.message : "Unknown audio monitor error",
        );
      }
    })();
  }, [stopAudioMonitor]);

  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition: ISpeechRecognition = new SpeechRecognitionClass();

    const isMobile = isMobileBrowser();
    recognition.continuous = !isMobile;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      if (recognitionRef.current !== recognition) return;
      console.log("[SpeechRecognition] Started successfully");
      setIsListening(true);
      setError(null);
      isStartingRef.current = false;
      retryCountRef.current = 0;
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      console.log("[SpeechRecognition] Ended");
      setIsListening(false);
      isStartingRef.current = false;
      stopAudioMonitor();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (recognitionRef.current !== recognition) return;
      console.error("[SpeechRecognition] Error:", event.error);
      isStartingRef.current = false;
      stopAudioMonitor();
      
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
      if (recognitionRef.current !== recognition) return;
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
  }, [isSupported, stopAudioMonitor]);

  useEffect(() => {
    recognitionRef.current = createRecognition();

    return () => {
      cleanupSpeechRecognition(
        recognitionRef.current,
        retryTimerRef.current,
        (timerId) => window.clearTimeout(timerId),
      );
      stopAudioMonitor();
    };
  }, [createRecognition, stopAudioMonitor]);

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
    startAudioMonitor();

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
          retryTimerRef.current = window.setTimeout(attemptStart, 100);
        } else {
          isStartingRef.current = false;
          stopAudioMonitor();
          setError("Failed to start speech recognition. Please try again.");
        }
      }
    };

    attemptStart();
  }, [isSupported, isListening, createRecognition, startAudioMonitor, stopAudioMonitor]);

  const stopListening = useCallback(() => {
    console.log("[SpeechRecognition] Stopping...");
    isStartingRef.current = false;
    stopAudioMonitor();
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    
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
  }, [stopAudioMonitor]);

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
    audioAnalyser,
  };
};

export default useSpeechRecognition;
