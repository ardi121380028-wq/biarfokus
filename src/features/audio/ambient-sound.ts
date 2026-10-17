import type { AmbientSoundMode } from "../../types/domain";

export const AMBIENT_SOUND_OPTIONS: ReadonlyArray<{
  mode: AmbientSoundMode;
  label: string;
}> = [
  { mode: "off", label: "Mati" },
  { mode: "rain", label: "🌧 Hujan" },
  { mode: "waves", label: "🌊 Ombak" },
  { mode: "brown", label: "🧠 Fokus" },
];

type ActiveAmbientEngine = {
  mode: AmbientSoundMode;
  stop: () => void;
};

let activeEngine: ActiveAmbientEngine | null = null;

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

function createNoiseBuffer(context: AudioContext, type: "pink" | "brown"): AudioBuffer {
  const bufferSize = context.sampleRate * 4;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const output = buffer.getChannelData(0);

  if (type === "brown") {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.2;
    }
    return buffer;
  }

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < bufferSize; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
    b6 = white * 0.115926;
  }
  return buffer;
}

export function stopAmbientSound(): void {
  if (!activeEngine) return;
  const engine = activeEngine;
  activeEngine = null;
  engine.stop();
}

export function syncAmbientSound(
  mode: AmbientSoundMode,
  shouldPlay: boolean,
): void {
  if (!shouldPlay || mode === "off") {
    stopAmbientSound();
    return;
  }

  if (activeEngine && activeEngine.mode === mode) {
    return;
  }

  stopAmbientSound();

  const AudioContextClass = getAudioContextConstructor();
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const source = context.createBufferSource();
  source.buffer = createNoiseBuffer(context, mode === "brown" ? "brown" : "pink");
  source.loop = true;

  const filter = context.createBiquadFilter();
  const masterGain = context.createGain();
  masterGain.gain.setValueAtTime(0.001, context.currentTime);

  let lfo: OscillatorNode | null = null;
  let lfoGain: GainNode | null = null;

  if (mode === "rain") {
    filter.type = "bandpass";
    filter.frequency.value = 1150;
    filter.Q.value = 0.65;
    masterGain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.6);
  } else if (mode === "waves") {
    filter.type = "lowpass";
    filter.frequency.value = 480;
    masterGain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.8);

    lfo = context.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.14;
    lfoGain = context.createGain();
    lfoGain.gain.value = 280;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
  } else {
    filter.type = "lowpass";
    filter.frequency.value = 340;
    masterGain.gain.exponentialRampToValueAtTime(0.075, context.currentTime + 0.6);
  }

  source.connect(filter);
  filter.connect(masterGain);
  masterGain.connect(context.destination);
  source.start();
  void context.resume();

  let stopped = false;
  activeEngine = {
    mode,
    stop: () => {
      if (stopped) return;
      stopped = true;
      try {
        masterGain.gain.setValueAtTime(masterGain.gain.value, context.currentTime);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
      } catch {
        // Ignore gain ramp errors if context is already closing.
      }
      window.setTimeout(() => {
        try {
          source.stop();
          lfo?.stop();
        } catch {
          // Ignore stop errors on already-stopped nodes.
        }
        void context.close();
      }, 220);
    },
  };
}
