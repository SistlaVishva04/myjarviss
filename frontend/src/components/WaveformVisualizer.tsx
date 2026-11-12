interface WaveformVisualizerProps {
  isActive: boolean;
  type: "listening" | "speaking";
}

const WaveformVisualizer = ({ isActive, type }: WaveformVisualizerProps) => {
  if (!isActive) return null;

  return (
    <div
      className={`waveform is-${type}`}
      role="img"
      aria-label={type === "listening" ? "Listening for speech" : "Speaking response"}
    >
      {Array.from({ length: 17 }, (_, index) => (
        <span
          key={index}
          className="waveform-bar"
          style={{ animationDelay: `${index * -55}ms` }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualizer;
