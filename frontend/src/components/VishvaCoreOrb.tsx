import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "error";
export type OrbSize = "hero" | "compact" | number;

interface VishvaCoreOrbProps {
  state: OrbState;
  audioAnalyser?: AnalyserNode | null;
  className?: string;
  onClick?: () => void;
  size?: OrbSize;
}

const stateLabels: Record<OrbState, string> = {
  idle: "Ready to listen",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  error: "Voice input error",
};

const VishvaCoreOrb = ({
  state,
  audioAnalyser = null,
  className = "",
  onClick,
  size = "hero",
}: VishvaCoreOrbProps) => {
  const shouldReduceMotion = useReducedMotion();
  const orbRef = useRef<HTMLButtonElement>(null);
  const isCompact = size === "compact";
  const isBusy = state === "thinking" || state === "speaking";
  const customSize = typeof size === "number" ? { width: size, height: size } : undefined;

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    const audioReactiveState = state === "listening" || state === "speaking";
    if (!audioAnalyser || !audioReactiveState) {
      orb.style.setProperty("--orb-audio-level", "0");
      orb.style.setProperty("--orb-audio-scale", "1");
      return;
    }

    let frameId = 0;
    const samples = new Uint8Array(audioAnalyser.fftSize);

    const readAudioLevel = () => {
      audioAnalyser.getByteTimeDomainData(samples);
      let sumOfSquares = 0;
      for (const sample of samples) {
        const amplitude = (sample - 128) / 128;
        sumOfSquares += amplitude * amplitude;
      }

      const rms = Math.sqrt(sumOfSquares / samples.length);
      const level = Math.min(1, Math.max(0, (rms - 0.012) * 5));
      orb.style.setProperty("--orb-audio-level", level.toFixed(3));
      orb.style.setProperty("--orb-audio-scale", (1 + level * 0.045).toFixed(3));
      frameId = window.requestAnimationFrame(readAudioLevel);
    };

    frameId = window.requestAnimationFrame(readAudioLevel);
    return () => {
      window.cancelAnimationFrame(frameId);
      orb.style.setProperty("--orb-audio-level", "0");
      orb.style.setProperty("--orb-audio-scale", "1");
    };
  }, [audioAnalyser, state]);

  const classes = [
    "vishva-core-orb",
    isCompact ? "is-compact" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <motion.button
      ref={orbRef}
      type="button"
      layoutId="vishva-orb"
      layout
      className={classes}
      data-state={state}
      data-audio-reactive={(state === "listening" || state === "speaking") && audioAnalyser ? "true" : "false"}
      style={customSize}
      onClick={onClick}
      disabled={isBusy}
      aria-label={`Vishva is ${stateLabels[state].toLocaleLowerCase()}. ${isBusy ? "Voice input is unavailable while Vishva responds." : "Activate voice input."}`}
      aria-pressed={state === "listening"}
      title={isBusy ? stateLabels[state] : "Activate voice input"}
      transition={{
        layout: {
          duration: shouldReduceMotion ? 0.15 : 0.42,
          ease: "easeOut",
        },
      }}
    >
      <span className="vishva-core-orb__halo" aria-hidden="true" />
      <span className="vishva-core-orb__orbit vishva-core-orb__orbit--outer" aria-hidden="true" />
      <span className="vishva-core-orb__orbit vishva-core-orb__orbit--inner" aria-hidden="true" />
      <span className="vishva-core-orb__shell" aria-hidden="true">
        <span className="vishva-core-orb__filament" />
        <span className="vishva-core-orb__logo-plate">
          <img
            className="vishva-core-orb__logo"
            src="/vishva-logo.png"
            alt=""
            width="768"
            height="768"
            draggable="false"
          />
        </span>
        <span className="vishva-core-orb__particle vishva-core-orb__particle--one" />
        <span className="vishva-core-orb__particle vishva-core-orb__particle--two" />
        <span className="vishva-core-orb__particle vishva-core-orb__particle--three" />
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {stateLabels[state]}
      </span>
    </motion.button>
  );
};

export default VishvaCoreOrb;
