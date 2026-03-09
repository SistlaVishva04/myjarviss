import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

export type OrbState = "idle" | "listening" | "speaking";

interface JarvisOrbProps {
  state: OrbState;
  onClick?: () => void;
}

const JarvisOrb = ({ state, onClick }: JarvisOrbProps) => {
  const stateConfig = useMemo(() => {
    switch (state) {
      case "listening":
        return {
          scale: 1.05,
          glowIntensity: 2,
          rotationSpeed: 2,
          pulseSpeed: 0.3,
          ringOpacity: 0.9,
        };
      case "speaking":
        return {
          scale: 1.02,
          glowIntensity: 1.8,
          rotationSpeed: 4,
          pulseSpeed: 0.15,
          ringOpacity: 0.8,
        };
      default:
        return {
          scale: 1,
          glowIntensity: 1,
          rotationSpeed: 15,
          pulseSpeed: 2,
          ringOpacity: 0.6,
        };
    }
  }, [state]);

  // Generate tick marks for the circular HUD
  const tickMarks = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const angle = (i * 6) * (Math.PI / 180);
      const isMajor = i % 5 === 0;
      return { angle, isMajor, index: i };
    });
  }, []);

  // Arc segments for the outer ring
  const arcSegments = useMemo(() => {
    return [
      { start: 0, end: 90, offset: 0 },
      { start: 120, end: 210, offset: 0.5 },
      { start: 240, end: 330, offset: 1 },
    ];
  }, []);

  return (
    <div className="relative flex items-center justify-center cursor-pointer select-none" onClick={onClick}>
      {/* Outer ambient glow */}
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(187 100% 50% / 0.15) 0%, hsl(200 100% 40% / 0.05) 40%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4 * stateConfig.glowIntensity, 0.7 * stateConfig.glowIntensity, 0.4 * stateConfig.glowIntensity],
        }}
        transition={{
          duration: stateConfig.pulseSpeed * 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Listening pulse waves */}
      <AnimatePresence>
        {state === "listening" && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-[300px] h-[300px] rounded-full border border-primary/50"
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Outermost rotating ring with arc segments */}
      <motion.div
        className="absolute w-[340px] h-[340px]"
        animate={{ rotate: 360 }}
        transition={{
          duration: stateConfig.rotationSpeed * 2,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg viewBox="0 0 340 340" className="w-full h-full">
          {arcSegments.map((arc, idx) => (
            <motion.path
              key={idx}
              d={describeArc(170, 170, 165, arc.start, arc.end)}
              fill="none"
              stroke="hsl(187, 100%, 50%)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity={stateConfig.ringOpacity}
              animate={{
                opacity: [stateConfig.ringOpacity * 0.5, stateConfig.ringOpacity, stateConfig.ringOpacity * 0.5],
              }}
              transition={{
                duration: stateConfig.pulseSpeed,
                repeat: Infinity,
                delay: arc.offset * stateConfig.pulseSpeed,
              }}
            />
          ))}
        </svg>
      </motion.div>

      {/* Secondary rotating ring (counter-clockwise) */}
      <motion.div
        className="absolute w-[300px] h-[300px]"
        animate={{ rotate: -360 }}
        transition={{
          duration: stateConfig.rotationSpeed * 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* Dashed circle */}
          <circle
            cx="150"
            cy="150"
            r="145"
            fill="none"
            stroke="hsl(195, 100%, 50%)"
            strokeWidth="1"
            strokeDasharray="8 12"
            opacity={stateConfig.ringOpacity * 0.7}
          />
          {/* Node points */}
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x = 150 + 145 * Math.cos(rad);
            const y = 150 + 145 * Math.sin(rad);
            return (
              <motion.circle
                key={deg}
                cx={x}
                cy={y}
                r="4"
                fill="hsl(187, 100%, 60%)"
                animate={{
                  r: [3, 5, 3],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: stateConfig.pulseSpeed,
                  repeat: Infinity,
                  delay: deg / 360,
                }}
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Inner tick marks ring */}
      <motion.div
        className="absolute w-[260px] h-[260px]"
        animate={{ rotate: 360 }}
        transition={{
          duration: stateConfig.rotationSpeed * 3,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg viewBox="0 0 260 260" className="w-full h-full">
          {tickMarks.map(({ angle, isMajor, index }) => {
            const innerR = isMajor ? 115 : 120;
            const outerR = 125;
            const x1 = 130 + innerR * Math.cos(angle);
            const y1 = 130 + innerR * Math.sin(angle);
            const x2 = 130 + outerR * Math.cos(angle);
            const y2 = 130 + outerR * Math.sin(angle);
            return (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? "hsl(187, 100%, 60%)" : "hsl(195, 80%, 40%)"}
                strokeWidth={isMajor ? 2 : 1}
                opacity={stateConfig.ringOpacity}
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Core container */}
      <motion.div
        className="relative w-[200px] h-[200px]"
        animate={{ scale: stateConfig.scale }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Core glow layer */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 30% 30%, hsl(187 100% 70% / 0.5), hsl(200 100% 50% / 0.2), transparent)",
            filter: `blur(${25 * stateConfig.glowIntensity}px)`,
          }}
          animate={{
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{
            duration: stateConfig.pulseSpeed,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main core orb */}
        <motion.div
          className="absolute inset-4 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 35% 35%, hsl(187 100% 85% / 0.9), transparent 40%),
              radial-gradient(circle at 50% 50%, hsl(195 100% 55% / 0.9), hsl(200 100% 40% / 0.7), hsl(210 80% 25% / 0.5)),
              linear-gradient(135deg, hsl(200 100% 30% / 0.8), hsl(220 80% 20% / 0.9))
            `,
            boxShadow: `
              0 0 60px hsl(187 100% 50% / 0.4),
              0 0 120px hsl(200 100% 50% / 0.2),
              inset 0 0 60px hsl(187 100% 80% / 0.3)
            `,
          }}
          animate={
            state === "speaking"
              ? { scale: [1, 1.04, 0.97, 1.02, 1] }
              : { scale: [1, 1.02, 1] }
          }
          transition={{
            duration: state === "speaking" ? 0.2 : stateConfig.pulseSpeed,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Inner bright core */}
        <motion.div
          className="absolute inset-12 rounded-full"
          style={{
            background: "radial-gradient(circle at 40% 40%, hsl(187 100% 95% / 0.9), hsl(195 100% 70% / 0.5), transparent)",
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: stateConfig.pulseSpeed * 0.7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Central hotspot */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(0 0% 100%), hsl(187 100% 80% / 0.6), transparent)",
            boxShadow: "0 0 40px hsl(187 100% 70% / 0.9)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: stateConfig.pulseSpeed * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Speaking particles */}
        <AnimatePresence>
          {state === "speaking" && (
            <>
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30) * (Math.PI / 180);
                return (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary"
                    style={{ boxShadow: "0 0 8px hsl(187 100% 60%)" }}
                    initial={{ scale: 0, x: "-50%", y: "-50%" }}
                    animate={{
                      scale: [0, 1, 0],
                      x: [`-50%`, `${Math.cos(angle) * 80 - 50}%`],
                      y: [`-50%`, `${Math.sin(angle) * 80 - 50}%`],
                      opacity: [1, 0.5, 0],
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: "easeOut",
                    }}
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* State indicator */}
      <motion.div
        className="absolute -bottom-20 font-orbitron text-sm tracking-[0.3em] text-primary/90"
        style={{ textShadow: "0 0 20px hsl(187 100% 50% / 0.8)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={state}
      >
        {state === "idle" && "STANDBY"}
        {state === "listening" && "LISTENING..."}
        {state === "speaking" && "RESPONDING"}
      </motion.div>

      {/* Keyboard hint - hidden on mobile */}
      <motion.div
        className="absolute -bottom-28 font-rajdhani text-xs tracking-wider text-muted-foreground hidden md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
      >
        Hold SPACE to speak
      </motion.div>
    </div>
  );
};

// Helper function to describe SVG arc
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

export default JarvisOrb;
