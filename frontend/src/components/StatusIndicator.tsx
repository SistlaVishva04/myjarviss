import { Cpu, Mic, Volume2, Wifi, WifiOff } from "lucide-react";

interface StatusIndicatorProps {
  connectionState: "checking" | "connected" | "disconnected";
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
}

const StatusIndicator = ({
  connectionState,
  isListening,
  isThinking,
  isSpeaking,
}: StatusIndicatorProps) => {
  const activity = isListening
    ? { label: "Listening", Icon: Mic }
    : isThinking
      ? { label: "Thinking", Icon: Cpu }
      : isSpeaking
        ? { label: "Speaking", Icon: Volume2 }
        : { label: "Ready", Icon: Cpu };
  const ConnectionIcon = connectionState === "disconnected" ? WifiOff : Wifi;
  const connectionLabel = {
    checking: "Checking connection",
    connected: "Service connected",
    disconnected: "Service unavailable",
  }[connectionState];

  return (
    <div className="system-state" role="status" aria-live="polite">
      <span className={`system-state-connection is-${connectionState}`}>
        <ConnectionIcon size={16} aria-hidden="true" />
        <span>{connectionLabel}</span>
      </span>
      <span className="system-state-activity">
        <activity.Icon size={15} aria-hidden="true" />
        <span>{activity.label}</span>
      </span>
    </div>
  );
};

export default StatusIndicator;
