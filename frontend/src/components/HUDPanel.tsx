import { motion } from "framer-motion";
import { ReactNode } from "react";

interface HUDPanelProps {
  title: string;
  children: ReactNode;
  position?: "left" | "right";
  className?: string;
}

const HUDPanel = ({ title, children, position = "left", className = "" }: HUDPanelProps) => {
  const isLeft = position === "left";

  return (
    <motion.div
      className={`glass hud-corners rounded-lg p-4 min-w-[280px] ${className}`}
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-primary/20">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <h3 className="font-orbitron text-xs tracking-[0.2em] text-primary uppercase">
          {title}
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="text-foreground/90 font-rajdhani">
        {children}
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 right-0 w-8 h-8">
        <div className="absolute top-1 right-1 w-4 h-px bg-primary/50" />
        <div className="absolute top-1 right-1 w-px h-4 bg-primary/50" />
      </div>
      <div className="absolute bottom-0 left-0 w-8 h-8">
        <div className="absolute bottom-1 left-1 w-4 h-px bg-primary/50" />
        <div className="absolute bottom-1 left-1 w-px h-4 bg-primary/50" />
      </div>
    </motion.div>
  );
};

export default HUDPanel;
