interface AudioTrackLike {
  stop: () => void;
}

interface AudioStreamLike {
  getTracks: () => AudioTrackLike[];
}

interface AudioSourceLike {
  disconnect: () => void;
}

interface AudioContextLike {
  state: string;
  close: () => Promise<void>;
}

export async function cleanupAudioMonitor(
  stream: AudioStreamLike | null,
  source: AudioSourceLike | null,
  context: AudioContextLike | null,
): Promise<void> {
  stream?.getTracks().forEach((track) => track.stop());
  source?.disconnect();
  if (context && context.state !== "closed") {
    await context.close();
  }
}
