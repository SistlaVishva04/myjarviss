import { motion } from "framer-motion";
import { Mic, Volume2, Wifi, Cpu } from "lucide-react";

interface StatusIndicatorProps {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
}

const StatusIndicator = ({ isConnected, isListening, isSpeaking }: StatusIndicatorProps) => {
  const statuses = [
    {
      label: "NETWORK",
      icon: Wifi,
      active: isConnected,
      color: "text-green-400",
    },
    {
      label: "VOICE IN",
      icon: Mic,
      active: isListening,
      color: "text-primary",
    },
    {
      label: "VOICE OUT",
      icon: Volume2,
      active: isSpeaking,
      color: "text-accent",
    },
    {
      label: "AI CORE",
      icon: Cpu,
      active: true,
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-2">
      {statuses.map((status, index) => (
        <motion.div
          key={status.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3"
        >
          <motion.div
            className={`w-2 h-2 rounded-full ${
              status.active ? "bg-current" : "bg-muted-foreground/30"
            } ${status.color}`}
            animate={
              status.active
                ? { opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }
                : {}
            }
            transition={{ duration: 1, repeat: Infinity }}
          />
          <status.icon
            className={`w-4 h-4 ${
              status.active ? status.color : "text-muted-foreground/30"
            }`}
          />
          <span
            className={`text-xs font-orbitron tracking-wider ${
              status.active ? "text-foreground/80" : "text-muted-foreground/30"
            }`}
          >
            {status.label}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          <span
            className={`text-[10px] font-orbitron ${
              status.active ? status.color : "text-muted-foreground/30"
            }`}
          >
            {status.active ? "ON" : "OFF"}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default StatusIndicator;
