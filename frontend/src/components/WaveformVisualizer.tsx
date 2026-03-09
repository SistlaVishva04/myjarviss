import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface WaveformVisualizerProps {
  isActive: boolean;
  type: "listening" | "speaking";
}

const WaveformVisualizer = ({ isActive, type }: WaveformVisualizerProps) => {
  const [bars, setBars] = useState<number[]>(Array(24).fill(5));
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isActive) {
      setBars(Array(24).fill(5));
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    // For listening, use real microphone input
    if (type === "listening") {
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateBars = () => {
            if (!isActive) return;
            analyser.getByteFrequencyData(dataArray);
            const newBars = Array.from({ length: 24 }, (_, i) => {
              const index = Math.floor((i / 24) * dataArray.length);
              return Math.max(5, (dataArray[index] / 255) * 100);
            });
            setBars(newBars);
            animationRef.current = requestAnimationFrame(updateBars);
          };
          updateBars();
        } catch (err) {
          console.error("Microphone access error:", err);
          // Fallback to simulated visualization
          simulateWaveform();
        }
      };
      initAudio();
    } else {
      // For speaking, simulate based on TTS
      simulateWaveform();
    }

    function simulateWaveform() {
      const animate = () => {
        if (!isActive) return;
        const newBars = Array.from({ length: 24 }, () => {
          const base = type === "speaking" ? 40 : 20;
          const variance = type === "speaking" ? 50 : 30;
          return Math.max(5, base + Math.random() * variance);
        });
        setBars(newBars);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isActive, type]);

  const color = type === "listening" ? "hsl(187, 100%, 50%)" : "hsl(45, 100%, 60%)";

  return (
    <div className="flex items-end justify-center gap-[2px] h-16 px-4">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
          animate={{
            height: isActive ? `${height}%` : "8%",
            opacity: isActive ? 0.8 + (height / 100) * 0.2 : 0.3,
          }}
          transition={{
            duration: 0.05,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualizer;