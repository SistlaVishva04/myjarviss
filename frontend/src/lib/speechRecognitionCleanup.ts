interface AbortableRecognition {
  abort: () => void;
}

export function cleanupSpeechRecognition(
  recognition: AbortableRecognition | null,
  retryTimer: number | null,
  clearTimer: (timerId: number) => void,
): void {
  if (recognition) {
    try {
      recognition.abort();
    } catch {
      // Browser recognition may already have stopped.
    }
  }
  if (retryTimer !== null) clearTimer(retryTimer);
}
