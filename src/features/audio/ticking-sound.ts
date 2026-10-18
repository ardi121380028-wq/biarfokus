let tickingContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!tickingContext || tickingContext.state === "closed") {
    tickingContext = new AudioContextClass();
  }
  if (tickingContext.state === "suspended") {
    void tickingContext.resume();
  }
  return tickingContext;
}

/**
 * Synthesizes an organic, gentle woodblock/mechanical clock tick
 * via Web Audio API. Extremely lightweight with near-zero CPU footprint.
 */
export function playTickSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.value = 1100;
    filter.Q.value = 4;

    osc.type = "sine";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.012);

    // Subtle volume: 0.035 peak so it stays relaxing and non-intrusive
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.02);
  } catch {
    // Browser autoplay policy might hold context before initial click
  }
}
